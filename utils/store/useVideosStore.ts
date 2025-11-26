import { create } from "zustand";
import { getShortVideos } from "../../src/api/users/contentApi";
import { getNetworkQuality } from "../networkQuality";

// 🔥 OPTIMIZED: 5 minutes cache like Inshorts (was 1 hour)
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// 🔥 OPTIMIZED: Keep only 20 videos in memory (was unlimited)
const MAX_VIDEOS_IN_MEMORY = 500;

interface VideoCache {
  items: any[];
  cursor: string | null;
  hasMore: boolean;
  lastFetchedAt: number | null;
}

interface VideosState {
  videos: any[];
  lastFetchedVideosAt: number | null;
  videosByCategory: Record<string, VideoCache>;

  exclusiveVideos: any[];
  lastFetchedExclusiveAt: number | null;

  lastViewedIndexByCategory: Record<string, number>;
  setLastViewedIndex: (categoryKey: string, index: number) => void;
  setLastViewedLatest: (index: number) => void;

  fetchVideos: (force?: boolean) => Promise<void>;
  loadMoreVideos: (categoryId?: number | null) => Promise<void>;

  fetchExclusiveVideos: () => Promise<void>;
  loadMoreExclusiveVideos: () => Promise<void>;

  // 🔥 NEW: Clear cache manually
  clearCache: () => void;
}

const pickBestVariant = (variants: Record<string, string>) => {
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

// 🔥 HELPER: Trim array to max size
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

export const useVideosStore = create<VideosState>((set, get) => ({
  videos: [],
  lastFetchedVideosAt: null,
  videosByCategory: {},

  exclusiveVideos: [],
  lastFetchedExclusiveAt: null,

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

  // 🔥 NEW: Clear all cached videos
  clearCache: () => {
    set({
      videos: [],
      lastFetchedVideosAt: null,
      videosByCategory: {},
      exclusiveVideos: [],
      lastFetchedExclusiveAt: null,
      lastViewedIndexByCategory: {},
    });
  },

  fetchVideos: async (force = false) => {
    const { lastFetchedVideosAt, videos } = get();

    // 🔥 OPTIMIZED: Check 5-minute cache instead of 1 hour
    const shouldRefetch =
      force ||
      !lastFetchedVideosAt ||
      Date.now() - lastFetchedVideosAt > CACHE_DURATION ||
      videos.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("✅ Using cached videos:", videos.length);
      return;
    }

    try {
      // 🔥 OPTIMIZED: Fetch only 20 videos (was 10)
      const res = await getShortVideos(20);

      if (res?.success && Array.isArray(res.data?.items)) {
        const mapped = res.data.items.map((item: any) => {
          const variants = (item.media?.variants || {}) as Record<
            string,
            string
          >;
          const videoUrl = pickBestVariant(variants);

          return {
            _id: String(item.video_id),
            video_id: item.video_id,
            uri: videoUrl ? { uri: videoUrl as string } : null,
            thumbnail: item.media?.thumbnail || null,

            title_te: item.title_te,
            title_en: item.title_en,
            description_te: item.description_te,
            description_en: item.description_en,

            category_id: item.category_id,
            category: {
              name_te: item.Category?.name_te,
              name_en: item.Category?.name_en,
            },

            hashtag: item.hashtag,
            created_at: item.created_at,

            stats: {
              likes_count: Number(
                item.stats?.likes_count || item.likes_count || 0
              ),
              comments_count: Number(item.stats?.comments_count || 0),
              dislikes_count: Number(item.stats?.dislikes_count || 0),
              shares_count: Number(item.stats?.shares_count || 0),
              views_count: Number(
                item.stats?.views_count || item.views_count || 0
              ),
              saves_count: Number(item.stats?.saves_count || 0),
            },
          };
        });

        // 🔥 OPTIMIZED: Keep only 20 videos
        const trimmedVideos = trimToMaxSize(mapped, MAX_VIDEOS_IN_MEMORY);

        set((state) => ({
          videos: trimmedVideos,
          lastFetchedVideosAt: Date.now(),
          videosByCategory: {
            ...state.videosByCategory,
            [`all`]: {
              items: trimmedVideos,
              cursor: res.data?.nextCursor ?? null,
              hasMore: Boolean(res.data?.nextCursor),
              lastFetchedAt: Date.now(),
            },
          },
        }));
      }
    } catch (err) {
      console.error("❌ Error fetching videos:", err);
    }
  },

  loadMoreVideos: async (categoryId = null) => {
    const key = `${categoryId ?? "all"}`;
    const existing: VideoCache = get().videosByCategory[key] ?? {
      items: [],
      cursor: null,
      hasMore: true,
      lastFetchedAt: null,
    };

    // 🔥 OPTIMIZED: Check if we already have 20 videos
    if (existing.items.length >= MAX_VIDEOS_IN_MEMORY) {
      if (__DEV__) console.log("⚠️ Already have max videos:", existing.items.length);

      // Still return cached data if within 5 minutes
      if (
        existing.lastFetchedAt &&
        Date.now() - existing.lastFetchedAt < CACHE_DURATION
      ) {
        if (key.endsWith(":all") || key === "all") {
          set({
            videos: existing.items,
            lastFetchedVideosAt: existing.lastFetchedAt,
          });
        }
        return;
      }
    }

    // 🔥 OPTIMIZED: Use 5-minute cache
    if (
      existing.items.length > 0 &&
      existing.lastFetchedAt &&
      Date.now() - existing.lastFetchedAt < CACHE_DURATION &&
      !existing.cursor
    ) {
      if (key.endsWith(":all") || key === "all") {
        set({
          videos: existing.items,
          lastFetchedVideosAt: existing.lastFetchedAt,
        });
      }
      return;
    }

    if (existing.hasMore === false) {
      return;
    }

    try {
      // 🔥 OPTIMIZED: Calculate how many more we need
      const remainingSlots = MAX_VIDEOS_IN_MEMORY - existing.items.length;
      const fetchCount = Math.min(10, Math.max(1, remainingSlots));

      const res = await getShortVideos(fetchCount, existing.cursor, categoryId ?? null);

      if (res?.success && Array.isArray(res.data?.items)) {
        const mapped = res.data.items.map((item: any) => {
          const variants = (item.media?.variants || {}) as Record<
            string,
            string
          >;
          const videoUrl = pickBestVariant(variants);

          return {
            _id: String(item.video_id),
            video_id: item.video_id,
            uri: videoUrl ? { uri: videoUrl as string } : null,
            thumbnail: item.media?.thumbnail || null,

            title_te: item.title_te,
            title_en: item.title_en,
            description_te: item.description_te,
            description_en: item.description_en,

            category_id: item.category_id,
            category: {
              name_te: item.Category?.name_te,
              name_en: item.Category?.name_en,
            },

            hashtag: item.hashtag,
            created_at: item.created_at,

            stats: {
              likes_count: Number(
                item.stats?.likes_count || item.likes_count || 0
              ),
              comments_count: Number(item.stats?.comments_count || 0),
              dislikes_count: Number(item.stats?.dislikes_count || 0),
              shares_count: Number(item.stats?.shares_count || 0),
              views_count: Number(
                item.stats?.views_count || item.views_count || 0
              ),
              saves_count: Number(item.stats?.saves_count || 0),
            },
          };
        });

        const nextCursor = res.data?.nextCursor ?? null;
        const unique = mapped.filter(
          (a: any) =>
            !existing.items.some(
              (b: any) => String(b.video_id) === String(a.video_id)
            )
        );

        // 🔥 OPTIMIZED: Trim to 20 videos max
        const combined = [...existing.items, ...unique];
        const trimmedItems = trimToMaxSize(combined, MAX_VIDEOS_IN_MEMORY);

        const updated: VideoCache = {
          items: trimmedItems,
          cursor: trimmedItems.length >= MAX_VIDEOS_IN_MEMORY ? null : nextCursor,
          hasMore: trimmedItems.length < MAX_VIDEOS_IN_MEMORY && Boolean(nextCursor),
          lastFetchedAt: Date.now(),
        };

        set((state) => ({
          videosByCategory: { ...state.videosByCategory, [key]: updated },
          ...(key.endsWith(":all") || key === "all"
            ? {
              videos: updated.items,
              lastFetchedVideosAt: updated.lastFetchedAt,
            }
            : {}),
        }));
      }
    } catch (err) {
      console.error("❌ Error loading more videos:", err);
    }
  },

  fetchExclusiveVideos: async () => {
    const { lastFetchedExclusiveAt, exclusiveVideos } = get();

    // 🔥 OPTIMIZED: 5-minute cache
    const shouldRefetch =
      !lastFetchedExclusiveAt ||
      Date.now() - lastFetchedExclusiveAt > CACHE_DURATION ||
      exclusiveVideos.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("✅ Using cached exclusive videos");
      return;
    }

    try {
      // 🔥 OPTIMIZED: Fetch 20 exclusive videos
      const videosRes = await getShortVideos(20, null, null, true);

      const exclusive =
        videosRes?.success && Array.isArray(videosRes.data?.items)
          ? videosRes.data.items.map((item: any) => {
            const variants = (item.media?.variants || {}) as Record<
              string,
              string
            >;
            const videoUrl = pickBestVariant(variants);

            return {
              _id: String(item.video_id),
              video_id: item.video_id,
              uri: videoUrl ? { uri: videoUrl as string } : null,
              thumbnail: item.media?.thumbnail || null,
              title_te: item.title_te,
              title_en: item.title_en,
              description_te: item.description_te,
              description_en: item.description_en,
              category_id: item.category_id,
              category: {
                name_te: item.Category?.name_te,
                name_en: item.Category?.name_en,
              },
              hashtag: item.hashtag,
              created_at: item.created_at,
              stats: {
                likes_count: Number(
                  item.stats?.likes_count || item.likes_count || 0
                ),
                comments_count: Number(item.stats?.comments_count || 0),
                dislikes_count: Number(item.stats?.dislikes_count || 0),
                shares_count: Number(item.stats?.shares_count || 0),
                views_count: Number(
                  item.stats?.views_count || item.views_count || 0
                ),
                saves_count: Number(item.stats?.saves_count || 0),
              },
            };
          })
          : [];

      // 🔥 OPTIMIZED: Trim to 20 videos
      const trimmedExclusive = trimToMaxSize(exclusive, MAX_VIDEOS_IN_MEMORY);

      set({
        exclusiveVideos: trimmedExclusive,
        lastFetchedExclusiveAt: Date.now(),
      });
    } catch (err) {
      console.error("❌ Error fetching exclusive videos:", err);
    }
  },

  loadMoreExclusiveVideos: async () => {
    const { exclusiveVideos } = get();

    // 🔥 OPTIMIZED: Don't load more if we have 20
    if (exclusiveVideos.length >= MAX_VIDEOS_IN_MEMORY) {
      if (__DEV__) console.log("⚠️ Already have max exclusive videos");
      return;
    }

    try {
      const cursor =
        exclusiveVideos.length > 0
          ? String(exclusiveVideos[exclusiveVideos.length - 1].video_id)
          : null;

      const remainingSlots = MAX_VIDEOS_IN_MEMORY - exclusiveVideos.length;
      const fetchCount = Math.min(10, remainingSlots);

      const videosRes = await getShortVideos(fetchCount, cursor, null, true);

      if (videosRes?.success && Array.isArray(videosRes.data?.items)) {
        const newVideos = videosRes.data.items.map((item: any) => {
          const variants = (item.media?.variants || {}) as Record<
            string,
            string
          >;
          const videoUrl = pickBestVariant(variants);

          return {
            _id: String(item.video_id),
            video_id: item.video_id,
            uri: videoUrl ? { uri: videoUrl as string } : null,
            thumbnail: item.media?.thumbnail || null,
            title_te: item.title_te,
            title_en: item.title_en,
            description_te: item.description_te,
            description_en: item.description_en,
            category_id: item.category_id,
            category: {
              name_te: item.Category?.name_te,
              name_en: item.Category?.name_en,
            },
            hashtag: item.hashtag,
            created_at: item.created_at,
            stats: {
              likes_count: Number(
                item.stats?.likes_count || item.likes_count || 0
              ),
              comments_count: Number(item.stats?.comments_count || 0),
              dislikes_count: Number(item.stats?.dislikes_count || 0),
              shares_count: Number(item.stats?.shares_count || 0),
              views_count: Number(
                item.stats?.views_count || item.views_count || 0
              ),
              saves_count: Number(item.stats?.saves_count || 0),
            },
          };
        });

        const uniqueVideos = newVideos.filter(
          (newVideo: any) =>
            !exclusiveVideos.some(
              (existing: any) =>
                existing.video_id === newVideo.video_id
            )
        );

        // 🔥 OPTIMIZED: Trim to 20 videos
        const combined = [...exclusiveVideos, ...uniqueVideos];
        const trimmed = trimToMaxSize(combined, MAX_VIDEOS_IN_MEMORY);

        set({
          exclusiveVideos: trimmed,
        });
      }
    } catch (err) {
      console.error("❌ Error loading more exclusive videos:", err);
    }
  },
}));