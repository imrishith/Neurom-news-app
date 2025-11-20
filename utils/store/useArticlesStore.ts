import { create } from "zustand";
import {
  getStateArticles,
  getLocalizedArticles,
} from "../../src/api/users/contentApi";
import { API_CONFIG } from "../../src/api/config/apiConfig";

const TEN_MIN = 1000 * 60 * 10;
const LIMIT = 10;

interface ArticleCache {
  items: any[];
  cursor: string | null;
  hasMore: boolean;
  lastFetchedAt: number | null;
}

interface ArticlesState {
  // Articles (legacy + new paginated cache)
  articles: any[];
  lastFetchedAt: number | null;
  hasMore: boolean;
  isFetching: boolean;
  cursor: string | null;
  // Per-category paginated cache
  articlesByCategory: Record<string, ArticleCache>;

  lastViewedIndexByCategory: Record<string, number>;
  setLastViewedIndex: (categoryKey: string, index: number) => void;
  setLastViewedLatest: (index: number) => void;
  // Hero sections
  breakingNews: any[];
  lastFetchedBreakingAt: number | null;
  trendingNews: any[];
  lastFetchedTrendingAt: number | null;

  // Exclusive articles
  exclusiveArticles: any[];
  lastFetchedExclusiveAt: number | null;

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
    is_breaking?: boolean
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
    is_trending?: boolean
  ) => Promise<void>;

  resetPagination: () => void;

  fetchBreakingNews: () => Promise<void>;
  fetchTrendingNews: () => Promise<void>;

  fetchExclusiveArticles: () => Promise<void>;
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  articles: [],
  lastFetchedAt: null,
  hasMore: true,
  isFetching: false,
  cursor: null,
  articlesByCategory: {},

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


  breakingNews: [],
  lastFetchedBreakingAt: null,
  trendingNews: [],
  lastFetchedTrendingAt: null,

  exclusiveArticles: [],
  lastFetchedExclusiveAt: null,

  fetchArticles: async (
    reset = false,
    category_id,
    endpoint = "state-articles",
    location,
    is_trending,
    is_breaking
  ) => {
    const key = category_id
      ? `cat:${category_id}`
      : endpoint === "articles"
      ? "state"
      : "latest";

    const existing = get().articlesByCategory[key];
    const fresh =
      !reset &&
      existing &&
      Date.now() - (existing.lastFetchedAt ?? 0) < TEN_MIN &&
      existing.items.length > 0;

    if (fresh) {
      set({
        articles: existing.items,
        cursor: existing.cursor,
        hasMore: existing.hasMore,
        isFetching: false,
      });
      return;
    }

    try {
      set({ isFetching: true });

      let res;
      if (endpoint === "articles") {
        res = await getLocalizedArticles(
          {
            district_id: location?.district_id,
            mandal_id: location?.mandal_id,
            village_id: location?.village_id,
            category_id,
          },
          LIMIT
        );
      } else {
        res = await getStateArticles(
          LIMIT,
          undefined,
          category_id,
          is_breaking,
          is_trending,
          false
        );
      }

      if (res?.success && Array.isArray(res.data?.items)) {
        const updated: ArticleCache = {
          items: res.data.items,
          cursor: res.data?.nextCursor ?? null,
          hasMore: Boolean(res.data?.nextCursor),
          lastFetchedAt: Date.now(),
        };

        set((state) => {
          const nextMap: Record<string, ArticleCache> = {
            ...state.articlesByCategory,
            [key]: updated,
          };
          const keys = Object.keys(nextMap);
          if (keys.length > 10) {
            let oldestKey = keys[0];
            let oldestTs = nextMap[oldestKey]?.lastFetchedAt ?? 0;
            for (let i = 1; i < keys.length; i++) {
              const k = keys[i];
              const ts = nextMap[k]?.lastFetchedAt ?? 0;
              if (ts < oldestTs) {
                oldestTs = ts;
                oldestKey = k;
              }
            }
            delete (nextMap as any)[oldestKey];
          }
          return {
            isFetching: false,
            articles: updated.items,
            cursor: updated.cursor,
            hasMore: updated.hasMore,
            articlesByCategory: nextMap,
          };
        });
      } else {
        set({ isFetching: false, hasMore: false });
      }
    } catch (err) {
      console.error("❌ fetchArticles error:", err);
      set({ isFetching: false });
    }
  },

  loadMoreArticles: async (
    category_id = null,
    endpoint = "state-articles",
    location,
    is_breaking,
    is_trending
  ) => {
    const key = category_id
      ? `cat:${category_id}`
      : endpoint === "articles"
      ? "state"
      : "latest";

    const existing: ArticleCache = get().articlesByCategory[key] ?? {
      items: [],
      cursor: null,
      hasMore: true,
      lastFetchedAt: null,
    };

    if (!existing.hasMore || get().isFetching) {
      return;
    }

    try {
      let res;
      if (endpoint === "articles") {
        res = await getLocalizedArticles(
          {
            district_id: location?.district_id,
            mandal_id: location?.mandal_id,
            village_id: location?.village_id,
            category_id: category_id ?? undefined,
          },
          LIMIT
        );
      } else {
        res = await getStateArticles(
          LIMIT,
          existing.cursor ?? undefined,
          category_id ?? undefined,
          is_breaking,
          is_trending,
          false
        );
      }

      

      if (res?.success && Array.isArray(res.data?.items)) {
        const nextCursor = res.data?.nextCursor ?? null;
        const mapped = res.data.items;

        const seen = new Set(existing.items.map((b: any) => b.article_id));
        const unique = mapped.filter((a: any) => !seen.has(a.article_id));

        const updated: ArticleCache = {
          items: [...existing.items, ...unique],
          cursor: nextCursor,
          hasMore: Boolean(nextCursor),
          lastFetchedAt: Date.now(),
        };

        set((state) => {
          const nextMap: Record<string, ArticleCache> = {
            ...state.articlesByCategory,
            [key]: updated,
          };
          const keys = Object.keys(nextMap);
          if (keys.length > 10) {
            let oldestKey = keys[0];
            let oldestTs = nextMap[oldestKey]?.lastFetchedAt ?? 0;
            for (let i = 1; i < keys.length; i++) {
              const k = keys[i];
              const ts = nextMap[k]?.lastFetchedAt ?? 0;
              if (ts < oldestTs) {
                oldestTs = ts;
                oldestKey = k;
              }
            }
            delete (nextMap as any)[oldestKey];
          }
          return {
            isFetching: false,
            articlesByCategory: nextMap,
            articles: updated.items,
            cursor: updated.cursor,
            hasMore: updated.hasMore,
          };
        });
      } else {
        set({ isFetching: false, hasMore: false });
      }
    } catch (err) {
      console.error("❌ loadMoreArticles error:", err);
      set({ isFetching: false });
    }
  },

  resetPagination: () =>
    set({
      articles: [],
      cursor: null,
      hasMore: true,
      isFetching: false,
    }),

  fetchBreakingNews: async () => {
    const { lastFetchedBreakingAt, breakingNews } = get();
    const shouldRefetch =
      !lastFetchedBreakingAt ||
      Date.now() - lastFetchedBreakingAt > TEN_MIN ||
      breakingNews.length === 0;
    if (!shouldRefetch) return;
    try {
      const res = await getStateArticles(10, undefined, undefined, true, undefined);
      if (res?.success && Array.isArray(res.data?.items)) {
        set({ breakingNews: res.data.items, lastFetchedBreakingAt: Date.now() });
      }
    } catch (err) {
      console.error("❌ Error fetching breaking news:", err);
    }
  },

  fetchTrendingNews: async () => {
    try {
      const { lastFetchedTrendingAt, trendingNews } = get();
      const shouldRefetch =
        !lastFetchedTrendingAt ||
        Date.now() - lastFetchedTrendingAt > TEN_MIN ||
        trendingNews.length === 0;
      if (!shouldRefetch) return;

      const res = await getStateArticles(
        10,
        undefined,
        undefined,
        undefined,
        true
      );

      if (res?.success && Array.isArray(res.data?.items)) {
        set({ trendingNews: res.data.items, lastFetchedTrendingAt: Date.now() });
      } else {
        set({ trendingNews: [], lastFetchedTrendingAt: Date.now() });
      }
    } catch (err) {
      console.error("❌ Error fetching trending news:", err);
      set({ trendingNews: [] });
    }
  },

  fetchExclusiveArticles: async () => {
    const { lastFetchedExclusiveAt, exclusiveArticles } = get();
    const shouldRefetch =
      !lastFetchedExclusiveAt ||
      Date.now() - lastFetchedExclusiveAt > TEN_MIN ||
      exclusiveArticles.length === 0;

    if (!shouldRefetch) {
      return;
    }

    try {
      const articlesRes = await getStateArticles(
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      const exclusive =
        articlesRes?.success && Array.isArray(articlesRes.data?.items)
          ? articlesRes.data.items
          : [];

      set({
        exclusiveArticles: exclusive,
        lastFetchedExclusiveAt: Date.now(),
      });
    } catch (err) {
      console.error("❌ Error fetching exclusive articles:", err);
    }
  },
}));

