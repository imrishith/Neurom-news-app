import RNFS from 'react-native-fs';

export type ContentType = 'articles' | 'buzz' | 'reels';

interface CacheMetadata {
    cachedAt: number;
    day: string;
    itemCount: number;
}

interface CachedData<T = any> {
    metadata: CacheMetadata;
    data: T;
}

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const CACHE_BASE_PATH = `${RNFS.DocumentDirectoryPath}/cache`;

/**
 * Get the cache directory path for a specific content type
 */
const getCacheDir = (type: ContentType): string => {
    return `${CACHE_BASE_PATH}/${type}`;
};

/**
 * Get the full file path for a specific content type and day
 */
export const getCachePath = (type: ContentType, day: string): string => {
    return `${getCacheDir(type)}/day_${day}.json`;
};

/**
 * Ensure cache directory exists for a content type
 */
const ensureCacheDir = async (type: ContentType): Promise<void> => {
    const dir = getCacheDir(type);
    const exists = await RNFS.exists(dir);
    if (!exists) {
        await RNFS.mkdir(dir, { NSURLIsExcludedFromBackupKey: true });
        console.log(`📁 Created cache directory: ${dir}`);
    }
};

/**
 * Read cached data for a specific day
 * Returns null if cache doesn't exist or is expired
 */
export const readDayCache = async <T = any>(
    type: ContentType,
    day: string
): Promise<T | null> => {
    try {
        const filePath = getCachePath(type, day);
        const exists = await RNFS.exists(filePath);

        if (!exists) {
            console.log(`📭 No cache found for ${type}/${day}`);
            return null;
        }

        const content = await RNFS.readFile(filePath, 'utf8');
        const cached: CachedData<T> = JSON.parse(content);

        // Check if cache is expired
        const ageInDays = (Date.now() - cached.metadata.cachedAt) / (1000 * 60 * 60 * 24);
        if (ageInDays > CACHE_EXPIRY_DAYS) {
            console.log(`⏰ Cache expired for ${type}/${day} (${ageInDays.toFixed(1)} days old)`);
            await RNFS.unlink(filePath); // Delete expired cache
            return null;
        }

        console.log(`✅ Cache hit for ${type}/${day} (${cached.metadata.itemCount} items)`);
        return cached.data;
    } catch (error) {
        console.error(`❌ Error reading cache for ${type}/${day}:`, error);
        return null;
    }
};

/**
 * Write data to cache for a specific day
 */
export const writeDayCache = async <T = any>(
    type: ContentType,
    day: string,
    data: T
): Promise<boolean> => {
    try {
        await ensureCacheDir(type);

        const filePath = getCachePath(type, day);
        const itemCount = Array.isArray(data) ? data.length : 1;

        const cacheData: CachedData<T> = {
            metadata: {
                cachedAt: Date.now(),
                day,
                itemCount,
            },
            data,
        };

        await RNFS.writeFile(filePath, JSON.stringify(cacheData), 'utf8');
        console.log(`💾 Cached ${itemCount} items for ${type}/${day}`);
        return true;
    } catch (error) {
        console.error(`❌ Error writing cache for ${type}/${day}:`, error);
        return false;
    }
};

/**
 * Clear old cache files for a specific content type
 * Keeps only the most recent N days
 */
export const clearOldCache = async (
    type: ContentType,
    daysToKeep: number = CACHE_EXPIRY_DAYS
): Promise<number> => {
    try {
        const dir = getCacheDir(type);
        const exists = await RNFS.exists(dir);
        if (!exists) return 0;

        const files = await RNFS.readDir(dir);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            if (!file.name.endsWith('.json')) continue;

            const ageInDays = (now - new Date(file.mtime!).getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays > daysToKeep) {
                await RNFS.unlink(file.path);
                deletedCount++;
                console.log(`🗑️ Deleted old cache: ${file.name} (${ageInDays.toFixed(1)} days old)`);
            }
        }

        return deletedCount;
    } catch (error) {
        console.error(`❌ Error clearing old cache for ${type}:`, error);
        return 0;
    }
};

/**
 * Get total cache size for a content type or all types
 */
export const getCacheSize = async (type?: ContentType): Promise<number> => {
    try {
        let totalSize = 0;

        if (type) {
            // Get size for specific type
            const dir = getCacheDir(type);
            const exists = await RNFS.exists(dir);
            if (!exists) return 0;

            const files = await RNFS.readDir(dir);
            totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        } else {
            // Get size for all types
            const types: ContentType[] = ['articles', 'buzz', 'reels'];
            for (const t of types) {
                totalSize += await getCacheSize(t);
            }
        }

        return totalSize;
    } catch (error) {
        console.error(`❌ Error getting cache size:`, error);
        return 0;
    }
};

/**
 * Clear all cached content for a specific type or all types
 */
export const clearAllCache = async (type?: ContentType): Promise<boolean> => {
    try {
        if (type) {
            // Clear specific type
            const dir = getCacheDir(type);
            const exists = await RNFS.exists(dir);
            if (exists) {
                await RNFS.unlink(dir);
                console.log(`🗑️ Cleared all cache for ${type}`);
            }
        } else {
            // Clear all types
            const exists = await RNFS.exists(CACHE_BASE_PATH);
            if (exists) {
                await RNFS.unlink(CACHE_BASE_PATH);
                console.log(`🗑️ Cleared all cache`);
            }
        }
        return true;
    } catch (error) {
        console.error(`❌ Error clearing cache:`, error);
        return false;
    }
};

/**
 * Get list of cached days for a content type
 */
export const getCachedDays = async (type: ContentType): Promise<string[]> => {
    try {
        const dir = getCacheDir(type);
        const exists = await RNFS.exists(dir);
        if (!exists) return [];

        const files = await RNFS.readDir(dir);
        const days = files
            .filter(file => file.name.endsWith('.json'))
            .map(file => file.name.replace('day_', '').replace('.json', ''))
            .sort()
            .reverse(); // Most recent first

        return days;
    } catch (error) {
        console.error(`❌ Error getting cached days for ${type}:`, error);
        return [];
    }
};

/**
 * Initialize cache system (create directories, clean old cache)
 */
export const initializeCache = async (): Promise<void> => {
    try {
        console.log('🚀 Initializing content cache system...');

        const types: ContentType[] = ['articles', 'buzz', 'reels'];

        // Create directories for all content types
        for (const type of types) {
            await ensureCacheDir(type);
        }

        // Clean old cache for all types
        for (const type of types) {
            const deleted = await clearOldCache(type);
            if (deleted > 0) {
                console.log(`🧹 Cleaned ${deleted} old cache files for ${type}`);
            }
        }

        // Log cache size
        const totalSize = await getCacheSize();
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`💾 Total cache size: ${sizeInMB} MB`);

        console.log('✅ Cache system initialized');
    } catch (error) {
        console.error('❌ Error initializing cache:', error);
    }
};
