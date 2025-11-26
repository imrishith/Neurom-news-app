import {
    getStateArticles,
    getLocalizedArticles,
} from '../api/users/contentApi';
import {
    insertArticles,
    saveDayMetadata,
    getDayMetadata,
    getTodayDate,
    checkIfNeedsRefresh,
} from '../db/queries/articles';

/**
 * Fetch articles and save to SQLite
 */
export const fetchAndSaveArticles = async (
    reset: boolean = false,
    categoryId?: number,
    endpoint: 'state-articles' | 'articles' = 'state-articles',
    location?: {
        district_id?: number;
        mandal_id?: number;
        village_id?: number;
    },
    isTrending?: boolean,
    isBreaking?: boolean,
    silent: boolean = false
): Promise<{
    success: boolean;
    count: number;
}> => {
    const fetchDate = getTodayDate();

    try {
        let res;

        if (endpoint === 'articles') {
            res = await getLocalizedArticles({
                district_id: location?.district_id,
                mandal_id: location?.mandal_id,
                village_id: location?.village_id,
                category_id: categoryId,
            });
        } else {
            res = await getStateArticles(
                undefined,
                categoryId,
                isBreaking,
                isTrending,
                false,
                fetchDate
            );
        }

        if (res?.success && Array.isArray(res.data?.items)) {
            const articles = res.data.items;
            const nextCursor = res.data?.nextCursor ?? null;
            const nextDay = res.data?.nextDay ?? null;

            // Save to SQLite
            insertArticles(articles, fetchDate);

            // Save metadata
            saveDayMetadata(fetchDate, nextCursor, nextDay);

            console.log(`✅ Fetched and saved ${articles.length} articles for ${fetchDate}`);

            return {
                success: true,
                count: articles.length,
            };
        }

        return {
            success: false,
            count: 0,
        };
    } catch (error) {
        console.error('❌ fetchAndSaveArticles error:', error);
        return {
            success: false,
            count: 0,
        };
    }
};

/**
 * Load more articles (pagination)
 */
export const loadMoreArticles = async (
    categoryId?: number | null,
    endpoint: 'state-articles' | 'articles' = 'state-articles',
    location?: {
        district_id?: number;
        mandal_id?: number;
        village_id?: number;
    },
    isBreaking?: boolean,
    isTrending?: boolean
): Promise<{
    success: boolean;
    count: number;
}> => {
    const currentDay = getTodayDate();
    const metadata = getDayMetadata(currentDay);

    let targetDate = currentDay;
    let targetCursor = metadata?.next_cursor;

    // Check if we need to move to next day
    if (!metadata?.next_cursor && metadata?.next_day && endpoint === 'state-articles') {
        targetDate = metadata.next_day;
        targetCursor = undefined;
        console.log(`📅 Switching to next day: ${targetDate}`);
    } else if (!metadata?.next_cursor && !metadata?.next_day) {
        console.log('✅ No more articles to load');
        return { success: false, count: 0 };
    }

    try {
        let res;

        if (endpoint === 'articles') {
            res = await getLocalizedArticles({
                district_id: location?.district_id,
                mandal_id: location?.mandal_id,
                village_id: location?.village_id,
                category_id: categoryId ?? undefined,
            });
        } else {
            res = await getStateArticles(
                targetCursor ?? undefined,
                categoryId ?? undefined,
                isBreaking,
                isTrending,
                false,
                targetDate
            );
        }

        if (res?.success && Array.isArray(res.data?.items)) {
            const articles = res.data.items;
            const nextCursor = res.data?.nextCursor ?? null;
            const nextDay = res.data?.nextDay ?? null;

            // Save to SQLite
            insertArticles(articles, targetDate);

            // Update metadata
            saveDayMetadata(targetDate, nextCursor, nextDay);

            console.log(`✅ Loaded ${articles.length} more articles for ${targetDate}`);

            return {
                success: true,
                count: articles.length,
            };
        }

        return {
            success: false,
            count: 0,
        };
    } catch (error) {
        console.error('❌ loadMoreArticles error:', error);
        return {
            success: false,
            count: 0,
        };
    }
};

/**
 * Silent refresh in background
 */
export const silentRefresh = async (): Promise<void> => {
    const today = getTodayDate();
    const needsRefresh = checkIfNeedsRefresh(today);

    if (needsRefresh) {
        console.log('🔄 Silent refresh triggered');
        await fetchAndSaveArticles(true, undefined, 'state-articles', undefined, undefined, undefined, true);
    } else {
        console.log('✅ Cache still fresh, skipping refresh');
    }
};
