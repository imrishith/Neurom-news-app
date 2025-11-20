import { create } from "zustand";
import { getShortVideos } from "../../src/api/users/contentApi";
import { getNetworkQuality } from "../networkQuality";

const TEN_MIN = 1000 * 60 * 10;

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

  fetchVideos: async (force = false) => {
    const { lastFetchedVideosAt, videos } = get();
    const shouldRefetch =
      force ||
      !lastFetchedVideosAt ||
      Date.now() - lastFetchedVideosAt > TEN_MIN ||
      videos.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("✅ Using cached videos:", videos.length);
      return;
    }

    try {
      const res = await getShortVideos();
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

        set((state) => ({
          videos: mapped,
          lastFetchedVideosAt: Date.now(),
          videosByCategory: {
            ...state.videosByCategory,
            [`all`]: {
              items: mapped,
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

    if (
      existing.items.length > 0 &&
      existing.lastFetchedAt &&
      Date.now() - existing.lastFetchedAt < TEN_MIN &&
      !existing.cursor
    ) {
      if (key.endsWith(":all")) {
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
      const res = await getShortVideos(10, existing.cursor, categoryId ?? null);

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

        const updated: VideoCache = {
          items: [...existing.items, ...unique],
          cursor: nextCursor,
          hasMore: Boolean(nextCursor),
          lastFetchedAt: Date.now(),
        };

        set((state) => ({
          videosByCategory: { ...state.videosByCategory, [key]: updated },
          ...(key.endsWith(":all")
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
    const shouldRefetch =
      !lastFetchedExclusiveAt ||
      Date.now() - lastFetchedExclusiveAt > TEN_MIN ||
      exclusiveVideos.length === 0;

    if (!shouldRefetch) {
      if (__DEV__) console.log("✅ Using cached exclusive videos");
      return;
    }

    try {
      const videosRes = await getShortVideos(10, null, null, true);

      const exclusive =
        videosRes?.success && Array.isArray(videosRes.data?.items)
          ? videosRes.data.items.map((item: any) => {
            const variants = (item.media?.variants || {}) as Record<
              string,
              string
            >;
            const preferred = ["480p", "360p", "720p", "240p"];
            const first = Object.values(variants)[0] || null;
            const videoUrl =
              preferred.map((k) => variants[k]).find(Boolean) || first;

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

      set({
        exclusiveVideos: exclusive,
        lastFetchedExclusiveAt: Date.now(),
      });
    } catch (err) {
      console.error("❌ Error fetching exclusive videos:", err);
    }
  },

  loadMoreExclusiveVideos: async () => {
    const { exclusiveVideos } = get();

    try {
      const cursor =
        exclusiveVideos.length > 0
          ? String(exclusiveVideos[exclusiveVideos.length - 1].video_id)
          : null;

      const videosRes = await getShortVideos(10, cursor, null, true);

      if (videosRes?.success && Array.isArray(videosRes.data?.items)) {
        const newVideos = videosRes.data.items.map((item: any) => {
          const variants = (item.media?.variants || {}) as Record<
            string,
            string
          >;
          const videoUrl = variants["720p"] || null;

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

        set({
          exclusiveVideos: [...exclusiveVideos, ...uniqueVideos],
        });
      }
    } catch (err) {
      console.error("❌ Error loading more exclusive videos:", err);
    }
  },
}));

