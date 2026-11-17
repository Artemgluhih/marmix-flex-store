import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const categories = ['Гибкий мрамор', 'Травертин', 'Монтаж'];
export const statuses = ['Новая', 'В работе', 'Завершена', 'Закрыта'];

export function openDatabase(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, image TEXT NOT NULL, published INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, product_title TEXT,
      name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL, message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Новая', note TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL,
      status TEXT NOT NULL, created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, expires INTEGER NOT NULL);
  `);
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare("INSERT OR IGNORE INTO settings VALUES ('seed-v1')").run().changes) {
      const insert = db.prepare('INSERT INTO products (title, category, description, image, published) VALUES (?, ?, ?, ?, 1)');
      insert.run('Азур', categories[0], 'Панель 1420 × 2840 мм. Площадь листа — 4,0328 м². Запросите образец и расчёт под ваш проект.', 'https://thb.tildacdn.com/tild6463-6263-4234-a137-623563363533/MRAMOR-GOLUBOJ-106.jpg');
      insert.run('Травертин 1', categories[1], 'Панель 1420 × 2840 мм. Площадь листа — 4,0328 м². Уточните оттенок и условия поставки.', '');
      insert.run('Клей для гибкого камня, 3 кг', categories[2], 'Сопутствующий материал для монтажа. Совместимость с основанием уточняйте при заказе.', '');
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  return db;
}