import { z } from "zod";
import { getDb } from "../db/client.js";
import {
  defaultGameState,
  ensureGameState,
  requireUser,
  rowToGame,
  rowToProfile,
} from "../middleware/session.js";

const profileSchema = z.object({
  name: z.string(),
  mode: z.enum(["patient", "family"]),
  class: z.enum(["warrior", "mage", "healer"]),
  age: z.string(),
  gender: z.string(),
  diabetesType: z.string(),
  medications: z.string(),
});

const gameSchema = z.object({
  totalXP: z.number().int().min(0),
  level: z.number().int().min(1),
  levelTitle: z.string(),
  streak: z.number().int().min(0),
  lastCheckinDate: z.string(),
  healthCoins: z.number().int().min(0),
  achievements: z.array(z.string()),
  bossDefeated: z.boolean(),
  bossWeekStart: z.string(),
  activeQuest: z.string().nullable(),
});

const daySchema = z.object({
  date: z.string(),
  fastingSugar: z.number().nullable(),
  sleepQuality: z.number().nullable(),
  symptoms: z.array(z.string()),
  medsTaken: z.boolean(),
  meals: z.array(z.record(z.unknown())),
  eveningSummary: z.record(z.unknown()).nullable(),
});

const partySchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string(),
  }),
);

const medsSchema = z.array(z.record(z.unknown()));

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDay(date) {
  return {
    date,
    fastingSugar: null,
    sleepQuality: null,
    symptoms: [],
    medsTaken: false,
    meals: [],
    eveningSummary: null,
  };
}

function getBootstrapData(userId) {
  const db = getDb();
  ensureGameState(db, userId);

  const profileRow = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId);
  const gameRow = db.prepare("SELECT * FROM game_states WHERE user_id = ?").get(userId);
  const dayRows = db
    .prepare("SELECT date, data FROM day_logs WHERE user_id = ? ORDER BY date")
    .all(userId);
  const partyRows = db
    .prepare("SELECT id, name, relationship FROM party_members WHERE user_id = ?")
    .all(userId);
  const medsRow = db.prepare("SELECT meds FROM prescription_meds WHERE user_id = ?").get(userId);
  const questsRow = db.prepare("SELECT data FROM quests WHERE user_id = ?").get(userId);

  const days = {};
  for (const row of dayRows) {
    days[row.date] = JSON.parse(row.data);
  }

  const today = todayKey();
  if (!days[today]) {
    days[today] = emptyDay(today);
  }

  return {
    profile: rowToProfile(profileRow),
    game: rowToGame(gameRow),
    days,
    party: partyRows,
    meds: medsRow ? JSON.parse(medsRow.meds || "[]") : [],
    quests: questsRow ? JSON.parse(questsRow.data || "[]") : [],
  };
}

export function registerDataRoutes(app) {
  app.get("/api/bootstrap", requireUser, (req, res) => {
    res.json({ data: getBootstrapData(req.user.id) });
  });

  app.get("/api/dashboard", requireUser, (req, res) => {
    res.json({ data: getBootstrapData(req.user.id) });
  });

  app.put("/api/profile", requireUser, (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid profile", details: parsed.error.flatten() });
    }

    const db = getDb();
    const data = parsed.data;
    const existing = db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").get(req.user.id);

    if (existing) {
      db.prepare(
        `UPDATE profiles SET name = ?, mode = ?, class = ?, age = ?, gender = ?,
         diabetes_type = ?, medications = ? WHERE user_id = ?`,
      ).run(
        data.name,
        data.mode,
        data.class,
        data.age,
        data.gender,
        data.diabetesType,
        data.medications,
        req.user.id,
      );
    } else {
      db.prepare(
        `INSERT INTO profiles (user_id, name, mode, class, age, gender, diabetes_type, medications)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        req.user.id,
        data.name,
        data.mode,
        data.class,
        data.age,
        data.gender,
        data.diabetesType,
        data.medications,
      );
      ensureGameState(db, req.user.id);
    }

    return res.json({ data });
  });

  app.put("/api/game", requireUser, (req, res) => {
    const parsed = gameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid game state", details: parsed.error.flatten() });
    }

    const db = getDb();
    const g = parsed.data;
    ensureGameState(db, req.user.id);

    db.prepare(
      `UPDATE game_states SET total_xp = ?, level = ?, level_title = ?, streak = ?,
       last_checkin_date = ?, health_coins = ?, achievements = ?, boss_defeated = ?,
       boss_week_start = ?, active_quest = ? WHERE user_id = ?`,
    ).run(
      g.totalXP,
      g.level,
      g.levelTitle,
      g.streak,
      g.lastCheckinDate,
      g.healthCoins,
      JSON.stringify(g.achievements),
      g.bossDefeated ? 1 : 0,
      g.bossWeekStart,
      g.activeQuest,
      req.user.id,
    );

    return res.json({ data: g });
  });

  app.put("/api/days/:date", requireUser, (req, res) => {
    const parsed = daySchema.safeParse({ ...req.body, date: req.params.date });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid day log", details: parsed.error.flatten() });
    }

    const db = getDb();
    const day = parsed.data;
    db.prepare(
      `INSERT INTO day_logs (user_id, date, data) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data`,
    ).run(req.user.id, day.date, JSON.stringify(day));

    return res.json({ data: day });
  });

  app.put("/api/party", requireUser, (req, res) => {
    const parsed = partySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid party data" });
    }

    const db = getDb();
    db.prepare("DELETE FROM party_members WHERE user_id = ?").run(req.user.id);
    const insert = db.prepare(
      "INSERT INTO party_members (id, user_id, name, relationship) VALUES (?, ?, ?, ?)",
    );
    for (const member of parsed.data) {
      insert.run(member.id, req.user.id, member.name, member.relationship);
    }

    return res.json({ data: parsed.data });
  });

  app.put("/api/meds", requireUser, (req, res) => {
    const parsed = medsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid meds data" });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO prescription_meds (user_id, meds) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET meds = excluded.meds`,
    ).run(req.user.id, JSON.stringify(parsed.data));

    return res.json({ data: parsed.data });
  });

  app.put("/api/quests", requireUser, (req, res) => {
    const parsed = z.array(z.record(z.unknown())).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid quests data" });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO quests (user_id, data) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data`,
    ).run(req.user.id, JSON.stringify(parsed.data));

    return res.json({ data: parsed.data });
  });

  app.post("/api/glucose-logs/local", requireUser, (req, res) => {
    const schema = z.object({
      readingMgDl: z.number().int().min(20).max(600),
      readingContext: z
        .enum(["fasting", "before_meal", "after_meal", "bedtime", "random"])
        .default("fasting"),
      symptoms: z.array(z.string()).default([]),
      medsTaken: z.boolean().optional(),
      sleepQuality: z.number().nullable().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid glucose log" });
    }

    const db = getDb();
    const date = todayKey();
    const row = db
      .prepare("SELECT data FROM day_logs WHERE user_id = ? AND date = ?")
      .get(req.user.id, date);
    const day = row ? JSON.parse(row.data) : emptyDay(date);

    if (parsed.data.readingContext === "fasting") {
      day.fastingSugar = parsed.data.readingMgDl;
    }
    if (parsed.data.symptoms?.length) day.symptoms = parsed.data.symptoms;
    if (parsed.data.medsTaken !== undefined) day.medsTaken = parsed.data.medsTaken;
    if (parsed.data.sleepQuality !== undefined) day.sleepQuality = parsed.data.sleepQuality;

    db.prepare(
      `INSERT INTO day_logs (user_id, date, data) VALUES (?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data`,
    ).run(req.user.id, date, JSON.stringify(day));

    return res.status(201).json({ data: day });
  });
}
