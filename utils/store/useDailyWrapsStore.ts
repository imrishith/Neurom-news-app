import { create } from "zustand";
import { getDailyWraps } from "../../src/api/users/contentApi";
import { getNetworkQuality } from "../networkQuality";

// 🔥 OPTIMIZED: 5 minutes cache like Inshorts (was 1 hour)
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// 🔥 OPTIMIZED: Keep only 30 daily wraps in memory
const MAX_WRAPS_IN_MEMORY = 500;

interface WrapMedia {
  type: "video" | "pdf";
  thumbnail: string | null;
  variants?: Record<string, string>;
  url?: string | null;   // chosen variant
}

interface DailyWrap {
  wrap_id: number;
  title_en: string;
  title_te: string;

  media_en: WrapMedia | null;
  media_te: WrapMedia | null;

  pdf_url_en: string | null;
  pdf_url_te: string | null;

  published_at: string;
  approval_status: string;
  created_at: string;
}

interface DailyWrapsState {
  dailyWraps: DailyWrap[];
  lastFetchedDailyWrapsAt: number | null;

  lastViewedIndexByCategory: Record<string, number>;
  setLastViewedIndex: (categoryKey: string, index: number) => void;
  setLastViewedLatest: (index: number) => void;

  fetchDailyWraps: (force?: boolean) => Promise<void>;

  // 🔥 NEW: Clear wraps cache
  clearWrapsCache: () => void;
}

// 🔥 HELPER: Trim array to max size
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

const pickBestVariant = (variants: Record<string, string> = {}) => {
  const quality = getNetworkQuality();
  if (!variants) return null;

  if (quality === "high") {
    return (
      variants["hls_1080p"] ||
      variants["hls_720p"] ||
      variants["hls_480p"] ||
      variants["1080p"] ||
      variants["720p"]
    );
  }

  if (quality === "medium") {
    return (
      variants["hls_720p"] ||
      variants["hls_480p"] ||
      variants["720p"] ||
      variants["480p"]
    );
  }

  return (
    variants["hls_480p"] ||
    variants["hls_360p"] ||
    variants["hls_240p"] ||
    variants["480p"] ||
    variants["360p"]
  );
};

export const useDailyWrapsStore = create<DailyWrapsState>((set, get) => ({
  dailyWraps: [],
  lastFetchedDailyWrapsAt: null,

  // ⭐ Track last viewed page index
  lastViewedIndexByCategory: {},

  setLastViewedIndex: (categoryKey, index) => {
    set((state) => ({
      lastViewedIndexByCategory: {
        ...state.lastViewedIndexByCategory,
        [categoryKey]: index,
      },
    }));
  },

  setLastViewedLatest: (index) => {
    set((state) => ({
      lastViewedIndexByCategory: {
        ...state.lastViewedIndexByCategory,
        latest: index,
      },
    }));
  },

  // 🔥 NEW: Clear all wraps cache
  clearWrapsCache: () => {
    set({
      dailyWraps: [],
      lastFetchedDailyWrapsAt: null,
      lastViewedIndexByCategory: {},
    });
  },

  fetchDailyWraps: async (force = false) => {
    const { lastFetchedDailyWrapsAt, dailyWraps } = get();

    // 🔥 OPTIMIZED: Use 5-minute cache instead of 1 hour
    const shouldRefetch =
      force ||
      !lastFetchedDailyWrapsAt ||
      Date.now() - lastFetchedDailyWrapsAt > CACHE_DURATION ||
      dailyWraps.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("⚡ Using cached daily wraps:", dailyWraps.length);
      return;
    }

    try {
      const res = await getDailyWraps();

      if (res?.success && Array.isArray(res.data?.items)) {
        const mapped = res.data.items.map((item: any) => {
          // Pick best variant for each language media
          const mediaEn = item.media_en
            ? {
              type: "video" as const,
              thumbnail: item.media_en.thumbnail,
              variants: item.media_en.variants,
              url: pickBestVariant(item.media_en.variants),
            }
            : null;

          const mediaTe = item.media_te
            ? {
              type: "video" as const,
              thumbnail: item.media_te.thumbnail,
              variants: item.media_te.variants,
              url: pickBestVariant(item.media_te.variants),
            }
            : null;

          return {
            wrap_id: item.wrap_id,
            title_en: item.title_en,
            title_te: item.title_te,

            media_en: mediaEn,
            media_te: mediaTe,

            pdf_url_en: item.pdf_url_en,
            pdf_url_te: item.pdf_url_te,

            published_at: item.published_at,
            approval_status: item.approval_status,
            created_at: item.created_at,
          };
        });

        // 🔥 OPTIMIZED: Trim to 30 wraps max
        const trimmedWraps = trimToMaxSize(mapped, MAX_WRAPS_IN_MEMORY);

        set({
          dailyWraps: trimmedWraps,
          lastFetchedDailyWrapsAt: Date.now(),
        });

        if (__DEV__) console.log(`✅ Daily Wraps fetched: ${trimmedWraps.length}/${mapped.length} (trimmed to max ${MAX_WRAPS_IN_MEMORY})`);
      }
    } catch (err) {
      console.error("❌ Error fetching daily wraps:", err);
    }
  },
}));