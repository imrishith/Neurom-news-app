import SQLite from 'react-native-sqlite-storage';

// Enable debug to see native logs
SQLite.DEBUG(true);
// Keep promises enabled for the queries (executeSql, transaction) to work as expected
SQLite.enablePromise(true);

const DATABASE_NAME = 'Neurom.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Neurom News Database';
const DATABASE_SIZE = 200000;

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database and create tables
 */
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (dbInstance) {
        return dbInstance;
    }

    // Use a manual Promise wrapper around the callback-based openDatabase
    // This often bypasses issues with the library's built-in Promise implementation for openDatabase
    return new Promise((resolve, reject) => {
        console.log("🛠 Initializing SQLite (Callback Pattern)...");

        const successCb = async (db: SQLite.SQLiteDatabase) => {
            console.log("✅ SQLite.openDatabase success callback triggered");
            if (!db) {
                console.error("❌ SQLite DB instance is null in success callback");
                reject(new Error("SQLite DB instance is null"));
                return;
            }

            dbInstance = db;

            try {
                await createTables(db);
                console.log('✅ SQLite database initialized & tables created');
                resolve(db);
            } catch (error) {
                console.error('❌ Error creating tables:', error);
                reject(error);
            }
        };

        const errorCb = (error: any) => {
            console.error("❌ SQLite.openDatabase error callback:", error);
            reject(error);
        };

        // Call openDatabase with callbacks
        SQLite.openDatabase(
            {
                name: DATABASE_NAME,
                location: 'default',
            },
            successCb,
            errorCb
        );
    });
};

/**
 * Get the database instance
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (dbInstance) {
        return dbInstance;
    }
    return initDatabase();
};

/**
 * Create all required tables
 */
const createTables = async (db: SQLite.SQLiteDatabase) => {
    const tables = [
        // Breaking News Table
        `CREATE TABLE IF NOT EXISTS breaking_news (
      article_id INTEGER PRIMARY KEY,
      title_te TEXT,
      title_en TEXT,
      content_te TEXT,
      content_en TEXT,
      media_url TEXT,
      media_type TEXT,
      category_id INTEGER,
      category_name_te TEXT,
      category_name_en TEXT,
      hashtag TEXT,
      created_at TEXT,
      cached_at INTEGER,
      stats_likes INTEGER DEFAULT 0,
      stats_views INTEGER DEFAULT 0,
      stats_comments INTEGER DEFAULT 0,
      stats_shares INTEGER DEFAULT 0
    )`,

        // Trending News Table
        `CREATE TABLE IF NOT EXISTS trending_news (
      article_id INTEGER PRIMARY KEY,
      title_te TEXT,
      title_en TEXT,
      content_te TEXT,
      content_en TEXT,
      media_url TEXT,
      media_type TEXT,
      category_id INTEGER,
      category_name_te TEXT,
      category_name_en TEXT,
      hashtag TEXT,
      created_at TEXT,
      cached_at INTEGER,
      stats_likes INTEGER DEFAULT 0,
      stats_views INTEGER DEFAULT 0,
      stats_comments INTEGER DEFAULT 0,
      stats_shares INTEGER DEFAULT 0
    )`,

        // Exclusive Articles Table
        `CREATE TABLE IF NOT EXISTS exclusive_articles (
      article_id INTEGER PRIMARY KEY,
      title_te TEXT,
      title_en TEXT,
      content_te TEXT,
      content_en TEXT,
      media_url TEXT,
      media_type TEXT,
      category_id INTEGER,
      category_name_te TEXT,
      category_name_en TEXT,
      hashtag TEXT,
      created_at TEXT,
      cached_at INTEGER,
      stats_likes INTEGER DEFAULT 0,
      stats_views INTEGER DEFAULT 0,
      stats_comments INTEGER DEFAULT 0,
      stats_shares INTEGER DEFAULT 0
    )`,

        // Regular Articles Table (Main Feed - Cursor-based)
        `CREATE TABLE IF NOT EXISTS articles (
      article_id INTEGER PRIMARY KEY,
      title_te TEXT,
      title_en TEXT,
      content_te TEXT,
      content_en TEXT,
      media_url TEXT,
      media_type TEXT,
      category_id INTEGER,
      category_name_te TEXT,
      category_name_en TEXT,
      hashtag TEXT,
      created_at TEXT,
      cached_at INTEGER,
      stats_likes INTEGER DEFAULT 0,
      stats_views INTEGER DEFAULT 0,
      stats_comments INTEGER DEFAULT 0,
      stats_shares INTEGER DEFAULT 0,
      is_breaking INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_exclusive INTEGER DEFAULT 0
    )`,

        // Create indexes for faster queries
        `CREATE INDEX IF NOT EXISTS idx_articles_cached_at ON articles(cached_at)`,
        `CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at)`,
    ];

    try {
        for (const tableSQL of tables) {
            await db.executeSql(tableSQL);
        }
        console.log('✅ All tables created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

/**
 * Close the database connection
 */
export const closeDatabase = async () => {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
        console.log('✅ Database connection closed');
    }
};

/**
 * Clear all data from all tables (for testing/debugging)
 */
export const clearAllData = async () => {
    const db = await getDatabase();
    try {
        await db.executeSql('DELETE FROM breaking_news');
        await db.executeSql('DELETE FROM trending_news');
        await db.executeSql('DELETE FROM exclusive_articles');
        await db.executeSql('DELETE FROM articles');
        console.log('✅ All data cleared from database');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
};
