import { useCallback, useEffect, useMemo, useRef } from "react";
import RNFS from "react-native-fs";

type ReelItem = {
  video_id: number;
  uri?: string;
  media?: { variants?: Record<string, string> };
};

const MAX_CACHE_FILES = 4;
const FILE_PREFIX = "reel_";

const getCacheDir = () => RNFS.CachesDirectoryPath;
const buildFileName = (id: number) => `${FILE_PREFIX}${id}.mp4`;
const buildPath = (id: number) => `${getCacheDir()}/${buildFileName(id)}`;
const toFileUri = (path: string) => (path.startsWith("file://") ? path : `file://${path}`);

export function useVideoCacheManager(videos: ReelItem[] = []) {

  // -----------------------------------------------------
  // 1️⃣ SELECT SAFE MP4 URL ONLY — IGNORE HLS COMPLETELY
  // -----------------------------------------------------
  const urlById = useMemo(() => {
    const map = new Map<number, string>();

    for (const v of videos) {
      let mp4 =
        v?.media?.variants?.["720p"] ||
        v?.media?.variants?.["480p"] ||
        v?.media?.variants?.["1080p"] ||
        v.uri ||
        "";

      // 🔥 Normalize to string to avoid crashes
      mp4 = typeof mp4 === "string" ? mp4 : "";

      // ❌ Skip empty or HLS URLs
      if (!mp4 || mp4.endsWith(".m3u8")) {
        console.log("[Cache] Ignore non-MP4 for ID:", v.video_id);
        continue;
      }

      map.set(v.video_id, mp4);
    }

    return map;
  }, [videos]);

  // -----------------------------------------------------
  // Internal refs
  // -----------------------------------------------------
  const downloading = useRef(new Set<number>());
  const queue = useRef<number[]>([]);
  const processing = useRef(false as boolean);
  const lru = useRef(new Map<number, number>());

  // -----------------------------------------------------
  // Utility: check file exists
  // -----------------------------------------------------
  const fileExists = useCallback(async (path: string) => {
    try {
      return await RNFS.exists(path);
    } catch {
      return false;
    }
  }, []);

  // -----------------------------------------------------
  //  Cleanup cache if exceeds max
  // -----------------------------------------------------
  const ensureCacheLimit = useCallback(async () => {
    try {
      const dir = getCacheDir();
      const entries = await RNFS.readDir(dir);

      const reelFiles = entries.filter(
        (e) => e.isFile() && e.name.startsWith(FILE_PREFIX) && e.name.endsWith(".mp4")
      );

      if (reelFiles.length <= MAX_CACHE_FILES) return;

      const withMeta = await Promise.all(
        reelFiles.map(async (f) => {
          const idStr = f.name.replace(FILE_PREFIX, "").replace(".mp4", "");
          const id = Number(idStr);

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

      // oldest files first
      withMeta.sort((a, b) => a.ts - b.ts);

      const toDelete = withMeta.slice(0, withMeta.length - MAX_CACHE_FILES);

      for (const f of toDelete) {
        try {
          await RNFS.unlink(f.path);
          lru.current.delete(f.id);
          console.log(`[Cache] Evicted reel ${f.id}`);
        } catch { }
      }
    } catch { }
  }, []);

  // -----------------------------------------------------
  // Process queue (downloads)
  // -----------------------------------------------------
  const processQueue = useCallback(async () => {
    if (processing.current) return;

    processing.current = true;

    try {
      while (queue.current.length > 0) {
        const id = queue.current.shift()!;
        const url = urlById.get(id);

        if (!url) continue;

        // ❌ Skip HLS here too (safety layer)
        if (url.endsWith(".m3u8")) {
          console.log("[Cache] Skipped HLS during processing", url);
          continue;
        }

        const toFile = buildPath(id);

        try {
          if (await fileExists(toFile)) {
            lru.current.set(id, Date.now());
            continue;
          }

          if (downloading.current.has(id)) continue;

          downloading.current.add(id);

          console.log(`[Cache] Download start ${id}`, url);

          const { promise } = RNFS.downloadFile({
            fromUrl: url,
            toFile,
            background: true as any,
            discretionary: true as any,
          });

          await promise;

          lru.current.set(id, Date.now());
          console.log(`[Cache] Downloaded ${id}`);

          await ensureCacheLimit();
        } catch (e) {
          console.warn(`[Cache] Download failed for ${id}`, e);
        } finally {
          downloading.current.delete(id);
        }
      }
    } finally {
      processing.current = false;
    }
  }, [ensureCacheLimit, fileExists, urlById]);

  // -----------------------------------------------------
  // Enqueue a video for caching
  // -----------------------------------------------------
  const enqueue = useCallback(
    async (id: number) => {
      if (!id) return;

      const url = urlById.get(id);

      // ❌ Skip if HLS
      if (url?.endsWith(".m3u8")) {
        console.log("[Cache] Skip enqueue HLS:", id, url);
        return;
      }

      const path = buildPath(id);

      if (await fileExists(path)) {
        lru.current.set(id, Date.now());
        console.log(`[Cache] Hit (exists) ${id}`);
        return;
      }

      if (downloading.current.has(id)) return;

      if (!queue.current.includes(id)) queue.current.push(id);

      processQueue();
    },
    [fileExists, processQueue, urlById]
  );

  // -----------------------------------------------------
  // Get cached URI if exists, else start download
  // -----------------------------------------------------
  const getCachedUri = useCallback(
    async (video_id: number, url?: string | null) => {
      // ❌ Skip HLS fully
      if (url?.endsWith(".m3u8")) {
        console.log("[Cache] Skipping HLS caching:", url);
        return null;
      }

      const path = buildPath(video_id);

      if (await fileExists(path)) {
        lru.current.set(video_id, Date.now());
        console.log(`[Cache] Using cached file for ${video_id}`);
        return toFileUri(path);
      }

      if (url) enqueue(video_id);

      console.log(`[Cache] Miss for ${video_id}`);
      return null;
    },
    [enqueue, fileExists]
  );

  // -----------------------------------------------------
  // If user scrolls, prefetch next N videos
  // -----------------------------------------------------
  const prefetchNextVideos = useCallback(
    async (currentIndex: number, count: number = MAX_CACHE_FILES) => {
      const start = Math.max(0, currentIndex);
      const end = Math.min(videos.length, start + count);

      for (let i = start; i < end; i++) {
        const id = videos[i]?.video_id;
        if (id) await enqueue(id);
      }
    },
    [enqueue, videos]
  );

  // On mount ensure cleanup
  useEffect(() => {
    ensureCacheLimit();
  }, [ensureCacheLimit]);

  return {
    getCachedUri,
    prefetchNextVideos,
    buildPath,
  };
}

export default useVideoCacheManager;
