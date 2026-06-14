import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

let db = null;

function migrate(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      patient_name TEXT NOT NULL DEFAULT '',
      caregiver_name TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'patient',
      class TEXT NOT NULL DEFAULT 'warrior',
      age TEXT NOT NULL DEFAULT '',
      date_of_birth TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT '',
      diabetes_type TEXT NOT NULL DEFAULT '',
      medications TEXT NOT NULL DEFAULT ''
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
    CREATE TABLE IF NOT EXISTS quests (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
  `);

  const userCols = sqlite.prepare("PRAGMA table_info(users)").all();
  const userColNames = new Set(userCols.map((c) => c.name));
  if (!userColNames.has("display_name")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''");
  }

  const profileCols = sqlite.prepare("PRAGMA table_info(profiles)").all();
  const profileColNames = new Set(profileCols.map((c) => c.name));
  if (!profileColNames.has("date_of_birth")) {
    sqlite.exec("ALTER TABLE profiles ADD COLUMN date_of_birth TEXT NOT NULL DEFAULT ''");
  }
  if (!profileColNames.has("patient_name")) {
    sqlite.exec("ALTER TABLE profiles ADD COLUMN patient_name TEXT NOT NULL DEFAULT ''");
  }
  if (!profileColNames.has("caregiver_name")) {
    sqlite.exec("ALTER TABLE profiles ADD COLUMN caregiver_name TEXT NOT NULL DEFAULT ''");
  }
}

export function getDbPath() {
  return process.env.DATABASE_PATH ?? join(process.cwd(), "data", "glycobete.db");
}

export function getDb() {
  if (db) return db;

  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  migrate(sqlite);
  db = sqlite;
  return db;
}
