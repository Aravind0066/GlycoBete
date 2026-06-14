import { nanoid } from "nanoid";
import { getDb } from "../db/client.js";

export const SESSION_COOKIE = "gb_session";

export function readSessionUserId(req) {
  return req.cookies?.[SESSION_COOKIE] ?? null;
}

export function requireUser(req, res, next) {
  const userId = readSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  const db = getDb();
  const user = db.prepare("SELECT id, display_name FROM users WHERE id = ?").get(userId);
  if (!user) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  req.user = user;
  return next();
}

export function weekStartKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function defaultGameState() {
  return {
    totalXP: 0,
    level: 1,
    levelTitle: "ROOKIE",
    streak: 0,
    lastCheckinDate: "",
    healthCoins: 0,
    achievements: [],
    bossDefeated: false,
    bossWeekStart: weekStartKey(),
    activeQuest: null,
  };
}

export function rowToGame(row) {
  if (!row) return defaultGameState();
  return {
    totalXP: row.total_xp,
    level: row.level,
    levelTitle: row.level_title,
    streak: row.streak,
    lastCheckinDate: row.last_checkin_date,
    healthCoins: row.health_coins,
    achievements: JSON.parse(row.achievements || "[]"),
    bossDefeated: Boolean(row.boss_defeated),
    bossWeekStart: row.boss_week_start,
    activeQuest: row.active_quest,
  };
}

export function rowToProfile(row) {
  if (!row || !row.name) return null;
  return {
    name: row.name,
    mode: row.mode,
    class: row.class,
    age: row.age,
    gender: row.gender,
    diabetesType: row.diabetes_type,
    medications: row.medications,
  };
}

export function ensureGameState(db, userId) {
  const existing = db.prepare("SELECT user_id FROM game_states WHERE user_id = ?").get(userId);
  if (!existing) {
    const gs = defaultGameState();
    db.prepare(
      `INSERT INTO game_states (
        user_id, total_xp, level, level_title, streak, last_checkin_date,
        health_coins, achievements, boss_defeated, boss_week_start, active_quest
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      userId,
      gs.totalXP,
      gs.level,
      gs.levelTitle,
      gs.streak,
      gs.lastCheckinDate,
      gs.healthCoins,
      JSON.stringify(gs.achievements),
      gs.bossDefeated ? 1 : 0,
      gs.bossWeekStart,
      gs.activeQuest,
    );
  }
}

export function createUser(displayName) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, display_name FROM users WHERE lower(display_name) = lower(?)")
    .get(displayName.trim());

  if (existing) return existing;

  const id = nanoid();
  db.prepare("INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)").run(
    id,
    displayName.trim(),
    Date.now(),
  );
  ensureGameState(db, id);
  return { id, display_name: displayName.trim() };
}
