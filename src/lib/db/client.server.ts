import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'patient',
      class TEXT NOT NULL DEFAULT 'warrior',
      age TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT '',
      diabetes_type TEXT NOT NULL DEFAULT '',
      medications TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT 'midnight'
    );
    CREATE TABLE IF NOT EXISTS game_states (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      level_title TEXT NOT NULL DEFAULT 'ROOKIE',
      streak INTEGER NOT NULL DEFAULT 0,
      last_checkin_date TEXT NOT NULL DEFAULT '',
      health_coins INTEGER NOT NULL DEFAULT 0,
      achievements TEXT NOT NULL DEFAULT '[]',
      boss_defeated INTEGER NOT NULL DEFAULT 0,
      boss_week_start TEXT NOT NULL DEFAULT '',
      active_quest TEXT
    );
    CREATE TABLE IF NOT EXISTS day_logs (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (user_id, date)
    );
    CREATE TABLE IF NOT EXISTS party_members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prescription_meds (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      meds TEXT NOT NULL DEFAULT '[]'
    );
  `);

  const profileCols = sqlite
    .prepare("PRAGMA table_info(profiles)")
    .all() as { name: string }[];
  const colNames = new Set(profileCols.map((c) => c.name));
  const addCol = (name: string, def: string) => {
    if (!colNames.has(name)) sqlite.exec(`ALTER TABLE profiles ADD COLUMN ${name} ${def}`);
  };
  addCol("emergency_contact", "TEXT NOT NULL DEFAULT ''");
  addCol("emergency_phone", "TEXT NOT NULL DEFAULT ''");
  addCol("doctor_name", "TEXT NOT NULL DEFAULT ''");
  addCol("doctor_phone", "TEXT NOT NULL DEFAULT ''");
  addCol("blood_group", "TEXT NOT NULL DEFAULT ''");
}

export function getDbPath() {
  return process.env.DATABASE_PATH ?? join(process.cwd(), "data", "glycobete.db");
}

export function getDb() {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  migrate(sqlite);

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}
