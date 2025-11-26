import { getDB } from "./articles.db";

export const saveArticlesToDB = async (date: string, items: any[]) => {
  if (!items || items.length === 0) return;

  const db = await getDB();
  const now = Date.now();

  const queries = items.map((item) => [
    `INSERT OR REPLACE INTO articles(article_id, date, payload, created_at) VALUES (?, ?, ?, ?)`,
    [item.article_id, date, JSON.stringify(item), now],
  ]);

  await db.sqlBatch(queries);
};

export const loadArticlesByDate = async (date: string, limit: number = 500) => {
  const db = await getDB();
  const res = await db.executeSql(
    `SELECT payload FROM articles WHERE date = ? ORDER BY created_at ASC LIMIT ?`,
    [date, limit]
  );

  const rows = res[0].rows;

  let list: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    list.push(JSON.parse(rows.item(i).payload));
  }
  return list;
};

export const findPrevDateWithArticles = async (beforeDate: string): Promise<string | null> => {
  const db = await getDB();
  const res = await db.executeSql(
    `SELECT date FROM articles WHERE date < ? ORDER BY date DESC LIMIT 1`,
    [beforeDate]
  );

  if (res[0].rows.length > 0) {
    return res[0].rows.item(0).date;
  }
  return null;
};
