import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.mediaDir, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  fb_page_id TEXT NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  niche TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  daily_limit INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  creator TEXT DEFAULT '',
  date_text TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  page_url TEXT DEFAULT '',
  local_path TEXT,
  license_field TEXT DEFAULT '',
  license_value TEXT DEFAULT '',
  license_status TEXT NOT NULL,
  reject_reason TEXT DEFAULT '',
  hash TEXT UNIQUE,
  raw_json TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  script_text TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  fb_post_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  posted_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT NOT NULL DEFAULT (datetime('now')),
  action TEXT NOT NULL,
  details TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);
// পুরোনো ডাটাবেসে নতুন কলাম যোগ (আগের ডেটা অক্ষত থাকে)
function addCol(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === col))
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
addCol("pages", "profile_json", "TEXT DEFAULT ''");
addCol("posts", "format", "TEXT DEFAULT ''");
addCol("posts", "slot_key", "TEXT DEFAULT ''");
