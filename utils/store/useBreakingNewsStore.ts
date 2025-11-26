import { create } from "zustand";
import { getStateArticles } from "../../src/api/users/contentApi";
import {
    getBreakingNews,
    insertBreakingNews,
    clearExpiredBreakingNews,
    isBreakingNewsCacheExpired,
    BreakingNewsArticle,
} from "../db/queries/breakingNews";

// 🔥 5-minute cache like Buzz, Magazines, Polls
const CACHE_DURATION = 1000 * 60 * 5;
// 🔥 Keep max 20 breaking news articles
const MAX_BREAKING_NEWS = 20;

const trimToMaxSize = (items: any[], maxSize: number) => {
    if (items.length <= maxSize) return items;
    return items.slice(0, maxSize);
};

// Optimize API item
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
const sqliteToArticle = (row: BreakingNewsArticle) => ({
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

interface BreakingNewsState {
    breakingNews: any[];
    lastFetchedAt: number | null;
    isFetching: boolean;

    fetchBreakingNews: (force?: boolean) => Promise<void>;
    refreshBreakingNews: () => Promise<void>;
    clearBreakingNewsCache: () => Promise<void>;
}

export const useBreakingNewsStore = create<BreakingNewsState>((set, get) => ({
    breakingNews: [],
    lastFetchedAt: null,
    isFetching: false,

    // 🔥 NEW: Clear store + SQLite
    clearBreakingNewsCache: async () => {
        await clearExpiredBreakingNews();
        set({
            breakingNews: [],
            lastFetchedAt: null,
            isFetching: false,
        });
    },

    fetchBreakingNews: async (force = false) => {
        try {
            await clearExpiredBreakingNews();

            const isExpired = await isBreakingNewsCacheExpired();
            const { lastFetchedAt } = get();

            const shouldFetch =
                force ||
                !lastFetchedAt ||
                isExpired ||
                Date.now() - lastFetchedAt > CACHE_DURATION;

            if (!shouldFetch) {
                const cached = await getBreakingNews();
                if (cached.length > 0) {
                    const formatted = cached.map(sqliteToArticle);
                    const trimmed = trimToMaxSize(formatted, MAX_BREAKING_NEWS);

                    set({
                        breakingNews: trimmed,
                        lastFetchedAt: cached[0]?.cached_at || Date.now(),
                    });

                    if (__DEV__) console.log("⚡ Loaded breaking news from cache:", trimmed.length);
                    return;
                }
            }

            set({ isFetching: true });

            const res = await getStateArticles(
                undefined,
                undefined,
                true, // breaking
                undefined,
                false
            );

            if (res?.success && Array.isArray(res.data?.items)) {
                const optimized = res.data.items.map(optimizeArticle);
                const trimmed = trimToMaxSize(optimized, MAX_BREAKING_NEWS);

                // Store to SQLite
                await insertBreakingNews(trimmed);

                set({
                    breakingNews: trimmed,
                    lastFetchedAt: Date.now(),
                    isFetching: false,
                });

                if (__DEV__) console.log("✅ Fetched breaking news:", trimmed.length);
            } else {
                set({ isFetching: false });
            }
        } catch (err) {
            console.error("❌ Error fetching breaking news:", err);
            set({ isFetching: false });
        }
    },

    refreshBreakingNews: async () => {
        await get().fetchBreakingNews(true);
    },
}));
