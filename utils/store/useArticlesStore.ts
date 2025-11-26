import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import {
  getStateArticles,
  getLocalizedArticles,
} from "../../src/api/users/contentApi";
import {
  getAllArticles,
  insertArticles,
  clearAllArticles,
  Article,
} from "../db/queries/articles";

// 🔥 OPTIMIZED: 5 minutes cache like Inshorts (was unlimited)
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// 🔥 OPTIMIZED: Keep only 100 articles in memory
const MAX_ARTICLES_IN_MEMORY = 500;

// Summary:
// - API First Architecture
// - SQLite Fallback if API fails
// - Background SQLite insertion (non-blocking)
// - MMKV only for lastViewedIndexByCategory
// - Cursor-based pagination with nextCursor
// - 🔥 NEW: Max 100 articles limit
// - 🔥 NEW: 5-minute cache expiry

const storage = new MMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? "{}",
  removeItem: (name: string) => storage.delete(name),
};

interface ArticlesState {
  articles: any[];
  lastFetchedAt: number | null;
  hasMore: boolean;
  isFetching: boolean;
  isLoadingMore: boolean;
  cursor: string | null;
  lastViewedIndexByCategory: Record<string, number>;

  setLastViewedIndex: (categoryKey: string, index: number) => void;
  setLastViewedLatest: (index: number) => void;

  fetchArticles: (
    reset?: boolean,
    category_id?: number,
    endpoint?: "state-articles" | "articles",
    location?: {
      district_id?: number;
      mandal_id?: number;
      village_id?: number;
    },
    is_trending?: boolean,
    is_breaking?: boolean,
    is_exclusive?: boolean,
    silent?: boolean
  ) => Promise<void>;

  loadMoreArticles: (
    category_id?: number | null,
    endpoint?: "state-articles" | "articles",
    location?: {
      district_id?: number;
      mandal_id?: number;
      village_id?: number;
    },
    is_breaking?: boolean,
    is_trending?: boolean,
    is_exclusive?: boolean
  ) => Promise<void>;

  resetPagination: () => void;

  // 🔥 NEW: Clear articles cache
  clearArticlesCache: () => void;
}

// 🔥 HELPER: Trim array to max size
const trimToMaxSize = (items: any[], maxSize: number) => {
  if (items.length <= maxSize) return items;
  return items.slice(0, maxSize);
};

// 🔥 HELPER: Check if cache is stale
const isCacheStale = (lastFetchedAt: number | null): boolean => {
  if (!lastFetchedAt) return true;
  return Date.now() - lastFetchedAt > CACHE_DURATION;
};

/**
 * Convert SQLite row to article format
 */
const sqliteToArticle = (row: Article) => ({
  article_id: row.article_id,
  title_te: row.title_te,
  title_en: row.title_en,
  content_te: row.content_te,
  content_en: row.content_en,
  media: {
    url: row.media_url,
    type: row.media_type,
  },
  category_id: row.category_id,
  Category: {
    name_te: row.category_name_te,
    name_en: row.category_name_en,
  },
  hashtag: row.hashtag,
  created_at: row.created_at,
  stats: {
    likes_count: row.stats_likes,
    views_count: row.stats_views,
    comments_count: row.stats_comments,
    shares_count: row.stats_shares,
  },
  is_breaking: Boolean(row.is_breaking),
  is_trending: Boolean(row.is_trending),
  is_exclusive: Boolean(row.is_exclusive),
});

export const useArticlesStore = create<ArticlesState>()(
  persist(
    (set, get) => ({
      articles: [],
      lastFetchedAt: null,
      hasMore: true,
      isFetching: false,
      isLoadingMore: false,
      cursor: null,
      lastViewedIndexByCategory: {},

      setLastViewedIndex: (categoryKey: string, index: number) => {
        set((state) => ({
          lastViewedIndexByCategory: {
            ...state.lastViewedIndexByCategory,
            [categoryKey]: index,
          },
        }));
      },

      setLastViewedLatest: (index: number) => {
        set((state) => ({
          lastViewedIndexByCategory: {
            ...(state.lastViewedIndexByCategory || {}),
            latest: index,
          },
        }));
      },

      // 🔥 NEW: Clear all articles cache
      clearArticlesCache: () => {
        set({
          articles: [],
          lastFetchedAt: null,
          hasMore: true,
          isFetching: false,
          isLoadingMore: false,
          cursor: null,
        });
        clearAllArticles().catch(e => console.error("Failed to clear SQLite:", e));
      },

      fetchArticles: async (
        reset = false,
        category_id,
        endpoint = "state-articles",
        location,
        is_trending,
        is_breaking,
        is_exclusive,
        silent = false
      ) => {
        const { articles, lastFetchedAt } = get();

        // 🔥 OPTIMIZED: Check cache staleness for "latest" feed
        if (!reset && !category_id && !silent && articles.length > 0 && !isCacheStale(lastFetchedAt)) {
          if (__DEV__) console.log("⚡ Using cached articles:", articles.length);
          return;
        }

        // 🔥 OPTIMIZED: Stop if we already have 100 articles
        if (!reset && articles.length >= MAX_ARTICLES_IN_MEMORY && !category_id) {
          if (__DEV__) console.log("⚠️ Already have max articles:", articles.length);
          return;
        }

        // Category-based articles: ALWAYS fetch fresh from API (no caching)
        if (category_id) {
          try {
            if (!silent) set({ isFetching: true });

            const res = await getStateArticles(
              undefined,
              category_id,
              is_breaking,
              is_trending,
              is_exclusive
            );
            if (res?.success && Array.isArray(res.data?.items)) {
              // 🔥 OPTIMIZED: Trim category articles to 100
              const trimmedArticles = trimToMaxSize(res.data.items, MAX_ARTICLES_IN_MEMORY);

              set({
                articles: trimmedArticles,
                cursor: trimmedArticles.length >= MAX_ARTICLES_IN_MEMORY ? null : (res.data?.nextCursor ?? null),
                hasMore: trimmedArticles.length < MAX_ARTICLES_IN_MEMORY && Boolean(res.data?.nextCursor),
                lastFetchedAt: Date.now(),
                isFetching: false,
              });

              if (__DEV__) console.log(`✅ [Category] Fetched ${trimmedArticles.length}/${res.data.items.length} articles`);
            } else {
              set({ isFetching: false, hasMore: false });
            }
          } catch (err) {
            console.error("❌ fetchArticles (category) error:", err);
            set({ isFetching: false });
          }
          return;
        }

        // Main "latest" feed: API First -> SQLite Fallback
        try {
          if (!silent) set({ isFetching: true });

          // If reset, clear existing cache
          if (reset) {
            await clearAllArticles();
          }

          let res;
          if (endpoint === "articles") {
            res = await getLocalizedArticles({
              district_id: location?.district_id,
              mandal_id: location?.mandal_id,
              village_id: location?.village_id,
              category_id,
            });
          } else {
            res = await getStateArticles(
              undefined,
              category_id,
              is_breaking,
              is_trending,
              is_exclusive
            );
          }

          if (res?.success && Array.isArray(res.data?.items)) {
            // 🔥 OPTIMIZED: Trim to 100 articles max
            const trimmedArticles = trimToMaxSize(res.data.items, MAX_ARTICLES_IN_MEMORY);

            // 1. Update UI Immediately
            set({
              articles: trimmedArticles,
              cursor: trimmedArticles.length >= MAX_ARTICLES_IN_MEMORY ? null : (res.data?.nextCursor ?? null),
              hasMore: trimmedArticles.length < MAX_ARTICLES_IN_MEMORY && Boolean(res.data?.nextCursor),
              lastFetchedAt: Date.now(),
              isFetching: false,
            });

            console.log(`✅ [API → Latest] Fetched ${trimmedArticles.length}/${res.data.items.length} articles (max ${MAX_ARTICLES_IN_MEMORY})`);

            // 2. Background Insert (Non-blocking) - Only trim items
            setTimeout(() => {
              insertArticles(trimmedArticles)
                .then(() => console.log(`💾 [SQLite → Background Insert] Saved ${trimmedArticles.length} to DB`))
                .catch((e) => console.error("❌ Background insert failed:", e));
            }, 0);

          } else {
            // API returned success=false or invalid data
            throw new Error("API returned invalid data");
          }
        } catch (err) {
          console.error("❌ fetchArticles error:", err);

          // 3. Fallback to SQLite
          try {
            const cachedArticles = await getAllArticles();
            if (cachedArticles.length > 0) {
              const articles = cachedArticles.map(sqliteToArticle);

              // 🔥 OPTIMIZED: Trim cached articles to 100
              const trimmedArticles = trimToMaxSize(articles, MAX_ARTICLES_IN_MEMORY);

              set({
                articles: trimmedArticles,
                lastFetchedAt: cachedArticles[0]?.cached_at || Date.now(),
                hasMore: trimmedArticles.length < MAX_ARTICLES_IN_MEMORY,
                cursor: null,
                isFetching: false,
              });
              console.log(`⚠️ [SQLite → Fallback] Loaded ${trimmedArticles.length}/${articles.length} articles from cache`);
            } else {
              set({ isFetching: false, hasMore: false });
            }
          } catch (dbErr) {
            console.error("❌ SQLite fallback failed:", dbErr);
            set({ isFetching: false });
          }
        }
      },

      loadMoreArticles: async (
        category_id = null,
        endpoint = "state-articles",
        location,
        is_breaking,
        is_trending,
        is_exclusive
      ) => {
        const { isFetching, isLoadingMore, hasMore, articles } = get();

        // 🔥 OPTIMIZED: Stop if we already have 100 articles
        if (articles.length >= MAX_ARTICLES_IN_MEMORY) {
          if (__DEV__) console.log("⚠️ Already have max articles:", articles.length);
          set({ hasMore: false });
          return;
        }

        // Prevent duplicate calls
        if (isFetching || isLoadingMore || !hasMore) return;

        // Category-based: Always fetch fresh
        if (category_id) {
          try {
            set({ isLoadingMore: true });

            const res = await getStateArticles(
              get().cursor ?? undefined,
              category_id,
              is_breaking,
              is_trending,
              is_exclusive
            );

            if (res?.success && Array.isArray(res.data?.items)) {
              const currentArticles = get().articles;
              const seen = new Set(currentArticles.map((a: any) => a.article_id));
              const unique = res.data.items.filter((a: any) => !seen.has(a.article_id));

              // 🔥 OPTIMIZED: Combine and trim to 100
              const combined = [...currentArticles, ...unique];
              const trimmedArticles = trimToMaxSize(combined, MAX_ARTICLES_IN_MEMORY);

              set({
                articles: trimmedArticles,
                cursor: trimmedArticles.length >= MAX_ARTICLES_IN_MEMORY ? null : (res.data?.nextCursor ?? null),
                hasMore: trimmedArticles.length < MAX_ARTICLES_IN_MEMORY && Boolean(res.data?.nextCursor),
                isLoadingMore: false,
              });

              if (__DEV__) console.log(`✅ [Load More] Now have ${trimmedArticles.length} articles`);
            } else {
              set({ isLoadingMore: false, hasMore: false });
            }
          } catch (err) {
            console.error("❌ loadMoreArticles (category) error:", err);
            set({ isLoadingMore: false });
          }
          return;
        }

        // Main feed: API -> Append -> Background Insert
        try {
          set({ isLoadingMore: true });

          const targetCursor = get().cursor;

          // 🔥 OPTIMIZED: Calculate remaining slots
          const remainingSlots = MAX_ARTICLES_IN_MEMORY - get().articles.length;
          if (remainingSlots <= 0) {
            if (__DEV__) console.log("⚠️ No slots remaining");
            set({ isLoadingMore: false, hasMore: false });
            return;
          }

          let res;
          if (endpoint === "articles") {
            res = await getLocalizedArticles({
              district_id: location?.district_id,
              mandal_id: location?.mandal_id,
              village_id: location?.village_id,
              category_id: category_id ?? undefined,
            });
          } else {
            res = await getStateArticles(
              targetCursor ?? undefined,
              category_id ?? undefined,
              is_breaking,
              is_trending,
              is_exclusive
            );
          }

          if (res?.success && Array.isArray(res.data?.items)) {
            const currentArticles = get().articles;
            const seen = new Set(currentArticles.map((a: any) => a.article_id));
            const unique = res.data.items.filter((a: any) => !seen.has(a.article_id));

            // 🔥 OPTIMIZED: Combine and trim to 100
            const combined = [...currentArticles, ...unique];
            const trimmedArticles = trimToMaxSize(combined, MAX_ARTICLES_IN_MEMORY);

            // Update UI
            set({
              articles: trimmedArticles,
              cursor: trimmedArticles.length >= MAX_ARTICLES_IN_MEMORY ? null : (res.data?.nextCursor ?? null),
              hasMore: trimmedArticles.length < MAX_ARTICLES_IN_MEMORY && Boolean(res.data?.nextCursor),
              isLoadingMore: false,
            });

            console.log(`✅ [Load More] Now have ${trimmedArticles.length} articles (+${unique.length} new)`);

            // Background Insert (only unique items)
            if (unique.length > 0) {
              setTimeout(() => {
                insertArticles(unique)
                  .then(() => console.log(`💾 [SQLite → Background Insert] Appended ${unique.length} items`))
                  .catch((e) => console.error("❌ Background append failed:", e));
              }, 0);
            }
          } else {
            set({ isLoadingMore: false, hasMore: false });
          }
        } catch (err) {
          console.error("❌ loadMoreArticles error:", err);
          set({ isLoadingMore: false });
        }
      },

      resetPagination: () =>
        set({
          articles: [],
          cursor: null,
          hasMore: true,
          isFetching: false,
          isLoadingMore: false,
        }),
    }),
    {
      name: "articles-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        lastViewedIndexByCategory: state.lastViewedIndexByCategory,
      }),
    }
  )
);