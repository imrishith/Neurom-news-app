import { useCallback, useEffect, useMemo, useRef } from "react";
import RNFS from "react-native-fs";

type FeedItem = {
  id: string; // unique id like `mag-123` or `wrap-456`
  type?: string; // 'magazine' | 'wrap' | 'buzz'
  pdfUrl?: string | null;
  magazine_id?: number;
  wrap_id?: number;
  mediaUrl?: string | null; // optional bonus image caching
};

const MAX_CACHE = 4;
const PDF_PREFIX = "pdf_";
const IMG_PREFIX = "img_";

const getCacheDir = () => RNFS.CachesDirectoryPath;
const pdfName = (id: number | string) => `${PDF_PREFIX}${id}.pdf`;
const imgName = (id: number | string) => `${IMG_PREFIX}${id}`; // extension may vary; we keep raw
const toFileUri = (p: string) => (p.startsWith("file://") ? p : `file://${p}`);

async function isFileCached(path: string): Promise<boolean> {
  try {
    return await RNFS.exists(path);
  } catch {
    return false;
  }
}

async function downloadPdf(url: string, localPath: string): Promise<string> {
  const { promise } = RNFS.downloadFile({ fromUrl: url, toFile: localPath, background: true as any, discretionary: true as any });
  await promise;
  return localPath;
}

export default function usePdfCacheManager(feed: FeedItem[] = []) {
  const pdfUrlByKey = useMemo(() => {
    const m = new Map<string, { url: string; id: number | string }>();
    feed.forEach((item) => {
      const id = item.magazine_id ?? item.wrap_id ?? null;
      const url = item.pdfUrl ?? null;
      if (id != null && url) m.set(item.id, { url, id });
    });
    return m;
  }, [feed]);

  const queue = useRef<string[]>([]); // keys from feed (item.id)
  const downloading = useRef(new Set<string>());
  const processing = useRef(false);
  const lru = useRef(new Map<string | number, number>()); // id -> ts

  const ensureLimit = useCallback(async () => {
    try {
      const list = await RNFS.readDir(getCacheDir());
      const pdfs = list.filter((e) => e.isFile() && e.name.startsWith(PDF_PREFIX) && e.name.endsWith(".pdf"));
      if (pdfs.length <= MAX_CACHE) return;
      const withMeta = await Promise.all(
        pdfs.map(async (f) => {
          const idStr = f.name.replace(PDF_PREFIX, "").replace(".pdf", "");
          const id: number | string = isNaN(Number(idStr)) ? idStr : Number(idStr);
          let ts = lru.current.get(id);
          if (!ts) {
            try {
              const st = await RNFS.stat(f.path);
              ts = (st.mtime ? new Date(st.mtime).getTime() : Date.now()) || Date.now();
            } catch {
              ts = Date.now();
            }
          }
          return { id, path: f.path, ts };
        })
      );
      withMeta.sort((a, b) => a.ts - b.ts);
      const toDelete = withMeta.slice(0, Math.max(0, withMeta.length - MAX_CACHE));
      for (const f of toDelete) {
        try {
          await RNFS.unlink(f.path);
          lru.current.delete(f.id);
          // eslint-disable-next-line no-console
          console.log(`[PDF Cache] Evicted ${String(f.id)}`);
        } catch {}
      }
    } catch {}
  }, []);

  const process = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    try {
      while (queue.current.length > 0) {
        const key = queue.current.shift()!;
        const rec = pdfUrlByKey.get(key);
        if (!rec) continue;
        const localPath = `${getCacheDir()}/${pdfName(rec.id)}`;
        try {
          if (await isFileCached(localPath)) {
            lru.current.set(rec.id, Date.now());
            continue;
          }
          if (downloading.current.has(key)) continue;
          downloading.current.add(key);
          // eslint-disable-next-line no-console
          console.log(`[PDF Cache] Download start ${String(rec.id)}`);
          await downloadPdf(rec.url, localPath);
          lru.current.set(rec.id, Date.now());
          // eslint-disable-next-line no-console
          console.log(`[PDF Cache] Downloaded ${String(rec.id)}`);
          await ensureLimit();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`[PDF Cache] Failed ${String(rec.id)}`, e);
        } finally {
          downloading.current.delete(key);
        }
      }
    } finally {
      processing.current = false;
    }
  }, [ensureLimit, pdfUrlByKey]);

  const enqueue = useCallback(
    async (key: string) => {
      const rec = pdfUrlByKey.get(key);
      if (!rec) return;
      const localPath = `${getCacheDir()}/${pdfName(rec.id)}`;
      if (await isFileCached(localPath)) {
        lru.current.set(rec.id, Date.now());
        return;
      }
      if (!queue.current.includes(key)) queue.current.push(key);
      process();
    },
    [pdfUrlByKey, process]
  );

  const getCachedPdfUri = useCallback(
    async (url: string, id: number | string) => {
      const path = `${getCacheDir()}/${pdfName(id)}`;
      if (await isFileCached(path)) {
        lru.current.set(id, Date.now());
        // eslint-disable-next-line no-console
        console.log(`[PDF Cache] Hit ${String(id)}`);
        return toFileUri(path);
      }
      try {
        await downloadPdf(url, path);
        lru.current.set(id, Date.now());
        await ensureLimit();
        // eslint-disable-next-line no-console
        console.log(`[PDF Cache] Cached ${String(id)}`);
        return toFileUri(path);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`[PDF Cache] Direct fetch failed for ${String(id)}`, e);
        return null;
      }
    },
    [ensureLimit]
  );

  const prefetchNextPdfs = useCallback(
    async (currentIndex: number, count: number = MAX_CACHE) => {
      const start = Math.max(0, currentIndex);
      const end = Math.min(feed.length, start + count);
      for (let i = start; i < end; i++) {
        const item = feed[i];
        if (!item?.pdfUrl) continue;
        await enqueue(item.id);
      }
    },
    [enqueue, feed]
  );

  const cleanupOldPdfs = useCallback(async () => {
    await ensureLimit();
  }, [ensureLimit]);

  // On mount, trim any overflow
  useEffect(() => {
    ensureLimit();
  }, [ensureLimit]);

  return {
    // APIs
    getCachedPdfUri,
    prefetchNextPdfs,
    cleanupOldPdfs,
    // helpers
    isFileCached,
    downloadPdf,
  } as const;
}

export { isFileCached, downloadPdf };

