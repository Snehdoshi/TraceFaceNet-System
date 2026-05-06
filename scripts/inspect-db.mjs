import { DatabaseSync } from 'node:sqlite';
import { sqliteDbPath } from './db-path.mjs';

const db = new DatabaseSync(sqliteDbPath);

const tables = db.prepare(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
).all();

const counts = tables.map((table) => {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table.name}`).get();
  return { table: table.name, count: Number(row.count) };
});

console.log(JSON.stringify({ sqliteDbPath, counts }, null, 2));

db.close();
