import { getDatabase } from '../sqlite';

const ONE_HOUR = 1000 * 60 * 60;

export interface ExclusiveArticle {
    article_id: number;
    title_te: string;
    title_en: string;
    content_te: string;
    content_en: string;
    media_url: string | null;
    media_type: string | null;
    category_id: number;
    category_name_te: string;
    category_name_en: string;
    hashtag: string;
    created_at: string;
    cached_at: number;
    stats_likes: number;
    stats_views: number;
    stats_comments: number;
    stats_shares: number;
}

/**
 * Insert or replace exclusive articles in bulk
 */
export const insertExclusiveArticles = async (items: any[]) => {
    const db = await getDatabase();
    const now = Date.now();

    try {
        await db.transaction(async (tx) => {
            for (const item of items) {
                const sql = `
          INSERT OR REPLACE INTO exclusive_articles (
            article_id, title_te, title_en, content_te, content_en,
            media_url, media_type, category_id, category_name_te, category_name_en,
            hashtag, created_at, cached_at,
            stats_likes, stats_views, stats_comments, stats_shares
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

                const params = [
                    item.article_id,
                    item.title_te || '',
                    item.title_en || '',
                    item.content_te || '',
                    item.content_en || '',
                    item.media?.url || null,
                    item.media?.type || null,
                    item.category?.id || item.category_id,
                    item.category?.name_te || '',
                    item.category?.name_en || '',
                    item.hashtag || '',
                    item.created_at,
                    now,
                    item.stats?.likes_count || 0,
                    item.stats?.views_count || 0,
                    item.stats?.comments_count || 0,
                    item.stats?.shares_count || 0,
                ];

                await tx.executeSql(sql, params);
            }
        });

        // console.log(`✅ Inserted ${items.length} exclusive articles`);
    } catch (error) {
        console.error('❌ Error inserting exclusive articles:', error);
        throw error;
    }
};

/**
 * Get all exclusive articles sorted by created_at DESC
 */
export const getExclusiveArticles = async (): Promise<ExclusiveArticle[]> => {
    const db = await getDatabase();

    try {
        const [results] = await db.executeSql(
            'SELECT * FROM exclusive_articles ORDER BY created_at DESC'
        );

        const articles: ExclusiveArticle[] = [];
        for (let i = 0; i < results.rows.length; i++) {
            articles.push(results.rows.item(i));
        }

        return articles;
    } catch (error) {
        console.error('❌ Error fetching exclusive articles:', error);
        return [];
    }
};

/**
 * Clear expired exclusive articles (older than 1 hour)
 */
export const clearExpiredExclusiveArticles = async () => {
    const db = await getDatabase();
    const expiryTime = Date.now() - ONE_HOUR;

    try {
        await db.executeSql('DELETE FROM exclusive_articles WHERE cached_at < ?', [
            expiryTime,
        ]);
        console.log('✅ Cleared expired exclusive articles');
    } catch (error) {
        console.error('❌ Error clearing expired exclusive articles:', error);
    }
};

/**
 * Clear all exclusive articles
 */
export const clearAllExclusiveArticles = async () => {
    const db = await getDatabase();

    try {
        await db.executeSql('DELETE FROM exclusive_articles');
        console.log('✅ Cleared all exclusive articles');
    } catch (error) {
        console.error('❌ Error clearing all exclusive articles:', error);
    }
};

/**
 * Check if exclusive articles cache is expired
 */
export const isExclusiveArticlesCacheExpired = async (): Promise<boolean> => {
    const db = await getDatabase();

    try {
        const [results] = await db.executeSql(
            'SELECT cached_at FROM exclusive_articles ORDER BY cached_at DESC LIMIT 1'
        );

        if (results.rows.length === 0) {
            return true; // No data, consider expired
        }

        const lastCachedAt = results.rows.item(0).cached_at;
        return Date.now() - lastCachedAt > ONE_HOUR;
    } catch (error) {
        console.error('❌ Error checking cache expiry:', error);
        return true;
    }
};
