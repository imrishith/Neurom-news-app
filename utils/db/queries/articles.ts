import { getDatabase } from '../sqlite';

const ONE_HOUR = 1000 * 60 * 60;

export interface Article {
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
    is_breaking: number;
    is_trending: number;
    is_exclusive: number;
}

/**
 * Insert articles in bulk (skips duplicates based on article_id)
 * Uses INSERT OR IGNORE to prevent re-inserting articles that already exist
 */
export const insertArticles = async (items: any[]) => {
    const db = await getDatabase();
    const now = Date.now();

    if (!items || items.length === 0) return;

    try {
        // Get count before insertion
        const countBefore = await getArticlesCount();
        console.log(`📊 [SQLite] Articles in DB before insert: ${countBefore}`);

        // Batch size to prevent "too many SQL variables" error
        // SQLite limit is typically 999 or higher, but 10-20 items * 20 columns = 200-400 vars is safe
        const BATCH_SIZE = 10;

        await db.transaction(async (tx: any) => {
            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const batch = items.slice(i, i + BATCH_SIZE);

                const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
                const sql = `
                    INSERT OR IGNORE INTO articles (
                        article_id, title_te, title_en, content_te, content_en,
                        media_url, media_type, category_id, category_name_te, category_name_en,
                        hashtag, created_at, cached_at,
                        stats_likes, stats_views, stats_comments, stats_shares,
                        is_breaking, is_trending, is_exclusive
                    ) VALUES ${placeholders}
                `;

                const params: any[] = [];
                batch.forEach((item: any) => {
                    params.push(
                        item.article_id,
                        item.title_te || '',
                        item.title_en || '',
                        item.content_te || '',
                        item.content_en || '',
                        item.media?.url || null,
                        item.media?.type || null,
                        item.Category?.category_id || item.category_id,
                        item.Category?.name_te || '',
                        item.Category?.name_en || '',
                        item.hashtag || '',
                        item.created_at,
                        now,
                        item.stats?.likes_count || 0,
                        item.stats?.views_count || 0,
                        item.stats?.comments_count || 0,
                        item.stats?.shares_count || 0,
                        item.is_breaking ? 1 : 0,
                        item.is_trending ? 1 : 0,
                        item.is_exclusive ? 1 : 0
                    );
                });

                await tx.executeSql(sql, params);
            }
        });

        // Get count after insertion
        const countAfter = await getArticlesCount();
        const newlyInserted = countAfter - countBefore;

        console.log(`📊 [SQLite] Articles in DB after insert: ${countAfter}`);
        console.log(`✅ [SQLite] Attempted: ${items.length} | Actually inserted: ${newlyInserted} | Skipped (duplicates): ${items.length - newlyInserted}`);
    } catch (error) {
        console.error('❌ Error inserting articles:', error);
        throw error;
    }
};

/**
 * Get all cached articles, sorted by created_at DESC
 */
export const getAllArticles = async (): Promise<Article[]> => {
    const db = await getDatabase();

    try {
        const [results] = await db.executeSql(
            'SELECT * FROM articles ORDER BY created_at DESC'
        );

        const articles: Article[] = [];
        for (let i = 0; i < results.rows.length; i++) {
            articles.push(results.rows.item(i));
        }

        console.log(`📊 [SQLite] Retrieved ${articles.length} articles from cache`);
        return articles;
    } catch (error) {
        console.error('❌ Error fetching articles:', error);
        return [];
    }
};

/**
 * Clear expired articles (older than 1 hour)
 */
export const clearExpiredArticles = async () => {
    const db = await getDatabase();
    const expiryTime = Date.now() - ONE_HOUR;

    try {
        await db.executeSql('DELETE FROM articles WHERE cached_at < ?', [expiryTime]);
        console.log('✅ Cleared expired articles');
    } catch (error) {
        console.error('❌ Error clearing expired articles:', error);
    }
};

/**
 * Clear all articles
 */
export const clearAllArticles = async () => {
    const db = await getDatabase();

    try {
        await db.executeSql('DELETE FROM articles');
        console.log('✅ Cleared all articles');
    } catch (error) {
        console.error('❌ Error clearing all articles:', error);
    }
};

/**
 * Check if articles cache is expired (1 hour TTL)
 */
export const isArticlesCacheExpired = async (): Promise<boolean> => {
    const db = await getDatabase();

    try {
        const [results] = await db.executeSql(
            'SELECT cached_at FROM articles ORDER BY cached_at DESC LIMIT 1'
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

/**
 * Get the count of cached articles
 */
export const getArticlesCount = async (): Promise<number> => {
    const db = await getDatabase();

    try {
        const [results] = await db.executeSql('SELECT COUNT(*) as count FROM articles');
        return results.rows.item(0).count;
    } catch (error) {
        console.error('❌ Error getting articles count:', error);
        return 0;
    }
};
