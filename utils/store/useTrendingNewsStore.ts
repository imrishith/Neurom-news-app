import { create } from "zustand";
import { getStateArticles } from "../../src/api/users/contentApi";
import {
    getTrendingNews,
    insertTrendingNews,
    clearExpiredTrendingNews,
    isTrendingNewsCacheExpired,
    TrendingNewsArticle,
} from "../db/queries/trendingNews";

// 🔥 Use same caching policy across all feed types
const CACHE_DURATION = 1000 * 60 * 5;

// 🔥 Trending should keep a maximum of 20 items
const MAX_TRENDING_ITEMS = 500;

const trimToMaxSize = (items: any[], maxSize: number) => {
    if (items.length <= maxSize) return items;
    return items.slice(0, maxSize);
};

// Optimize API article shape
const optimizeArticle = (item: any) => ({
    article_id: item.article_id,
    title_te: item.title_te,
    title_en: item.title_en,
    content_te: item.content_te,
    content_en: item.content_en,
    media: {
        url: item.media?.url || null,
        type: item.media?.type || null,
    },
    category: {
        id: item.category_id,
        name_te: item.Category?.name_te || "",
        name_en: item.Category?.name_en || "",
    },
    hashtag: item.hashtag,
    created_at: item.created_at,
    stats: {
        likes_count: Number(item.stats?.likes_count || 0),
        views_count: Number(item.stats?.views_count || 0),
        comments_count: Number(item.stats?.comments_count || 0),
        shares_count: Number(item.stats?.shares_count || 0),
    },
});

// SQLite → JS
const sqliteToArticle = (row: TrendingNewsArticle) => ({
    article_id: row.article_id,
    title_te: row.title_te,
    title_en: row.title_en,
    content_te: row.content_te,
    content_en: row.content_en,
    media: {
        url: row.media_url,
        type: row.media_type,
    },
    category: {
        id: row.category_id,
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
});

interface TrendingNewsState {
    trendingNews: any[];
    lastFetchedAt: number | null;
    isFetching: boolean;

    fetchTrendingNews: (force?: boolean) => Promise<void>;
    refreshTrendingNews: () => Promise<void>;
    clearTrendingNewsCache: () => Promise<void>;
}

export const useTrendingNewsStore = create<TrendingNewsState>((set, get) => ({
    trendingNews: [],
    lastFetchedAt: null,
    isFetching: false,

    // 🔥 Clear cache + reset
    clearTrendingNewsCache: async () => {
        await clearExpiredTrendingNews();
        set({
            trendingNews: [],
            lastFetchedAt: null,
            isFetching: false,
        });
    },

    fetchTrendingNews: async (force = false) => {
        try {
            await clearExpiredTrendingNews();

            const isExpired = await isTrendingNewsCacheExpired();
            const { lastFetchedAt } = get();

            const shouldFetch =
                force ||
                !lastFetchedAt ||
                isExpired ||
                Date.now() - lastFetchedAt > CACHE_DURATION;

            if (!shouldFetch) {
                const cached = await getTrendingNews();
                if (cached.length > 0) {
                    const formatted = cached.map(sqliteToArticle);
                    const trimmed = trimToMaxSize(formatted, MAX_TRENDING_ITEMS);

                    set({
                        trendingNews: trimmed,
                        lastFetchedAt: cached[0]?.cached_at || Date.now(),
                    });

                    if (__DEV__) console.log("⚡ Loaded trending from cache:", trimmed.length);
                    return;
                }
            }

            // Fetch fresh from API
            set({ isFetching: true });

            const res = await getStateArticles(
                undefined,
                undefined,
                false,
                true, // trending
                false
            );

            if (res?.success && Array.isArray(res.data?.items)) {
                const optimized = res.data.items.map(optimizeArticle);
                const trimmed = trimToMaxSize(optimized, MAX_TRENDING_ITEMS);

                await insertTrendingNews(trimmed);

                set({
                    trendingNews: trimmed,
                    lastFetchedAt: Date.now(),
                    isFetching: false,
                });

                if (__DEV__) console.log("✅ Fetched trending from API:", trimmed.length);
            } else {
                set({ isFetching: false });
            }
        } catch (err) {
            console.error("❌ Trending fetch error:", err);
            set({ isFetching: false });
        }
    },

    refreshTrendingNews: async () => {
        await get().fetchTrendingNews(true);
    },
}));
