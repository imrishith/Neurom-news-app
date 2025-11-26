import SQLite from "react-native-sqlite-storage";

SQLite.enablePromise(true);

export const getDB = async () => {
  const db = await SQLite.openDatabase({ name: "articles.db", location: "default" });

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id TEXT PRIMARY KEY,
      date TEXT,
      payload TEXT,
      created_at INTEGER
    );
  `);

  await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date);`);

  return db;
};
