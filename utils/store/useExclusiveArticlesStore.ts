import { create } from "zustand";
import { getStateArticles } from "../../src/api/users/contentApi";
import {
    getExclusiveArticles,
    insertExclusiveArticles,
    clearExpiredExclusiveArticles,
    isExclusiveArticlesCacheExpired,
    ExclusiveArticle,
} from "../db/queries/exclusiveArticles";

// 🔥 Same cache policy as Buzz/Magazines/Breaking/Polls
const CACHE_DURATION = 1000 * 60 * 5;

// 🔥 Max exclusive articles stored in memory
const MAX_EXCLUSIVE_ARTICLES = 500;

const trimToMaxSize = (items: any[], maxSize: number) => {
    if (items.length <= maxSize) return items;
    return items.slice(0, maxSize);
};

// Optimize API article
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

// SQLite → JS object
const sqliteToArticle = (row: ExclusiveArticle) => ({
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

interface ExclusiveArticlesState {
    exclusiveArticles: any[];
    lastFetchedAt: number | null;
    isFetching: boolean;

    fetchExclusiveArticles: (force?: boolean) => Promise<void>;
    refreshExclusiveArticles: () => Promise<void>;
    clearExclusiveArticlesCache: () => Promise<void>;
}

export const useExclusiveArticlesStore = create<ExclusiveArticlesState>((set, get) => ({
    exclusiveArticles: [],
    lastFetchedAt: null,
    isFetching: false,

    // 🔥 NEW: clear cache
    clearExclusiveArticlesCache: async () => {
        await clearExpiredExclusiveArticles();
        set({
            exclusiveArticles: [],
            lastFetchedAt: null,
            isFetching: false,
        });
    },

    fetchExclusiveArticles: async (force = false) => {
        try {
            await clearExpiredExclusiveArticles();

            const isExpired = await isExclusiveArticlesCacheExpired();
            const { lastFetchedAt } = get();

            const shouldFetch =
                force ||
                !lastFetchedAt ||
                isExpired ||
                Date.now() - lastFetchedAt > CACHE_DURATION;

            if (!shouldFetch) {
                const cached = await getExclusiveArticles();
                if (cached.length > 0) {
                    const formatted = cached.map(sqliteToArticle);
                    const trimmed = trimToMaxSize(formatted, MAX_EXCLUSIVE_ARTICLES);

                    set({
                        exclusiveArticles: trimmed,
                        lastFetchedAt: cached[0]?.cached_at || Date.now(),
                    });

                    if (__DEV__) console.log("⚡ Loaded exclusive from cache:", trimmed.length);
                    return;
                }
            }

            set({ isFetching: true });

            const res = await getStateArticles(
                undefined,
                undefined,
                false,
                false,
                true // exclusive
            );

            if (res?.success && Array.isArray(res.data?.items)) {
                const optimized = res.data.items.map(optimizeArticle);
                const trimmed = trimToMaxSize(optimized, MAX_EXCLUSIVE_ARTICLES);

                await insertExclusiveArticles(trimmed);

                set({
                    exclusiveArticles: trimmed,
                    lastFetchedAt: Date.now(),
                    isFetching: false,
                });

                if (__DEV__) console.log("✅ Fetched exclusive from API:", trimmed.length);
            } else {
                set({ isFetching: false });
            }
        } catch (err) {
            console.error("❌ Error fetching exclusive articles:", err);
            set({ isFetching: false });
        }
    },

    refreshExclusiveArticles: async () => {
        await get().fetchExclusiveArticles(true);
    },
}));
