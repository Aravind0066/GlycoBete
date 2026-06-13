import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.server";
import { dayLogs, gameStates } from "@/lib/db/schema";
import { userMiddleware } from "@/lib/auth.middleware";
import {
  levelFromXP,
  weekStart,
  bossProgressFromDays,
  type XPGrantResult,
  XP_REWARDS,
} from "@/lib/gameEngine";
import type { DayLog, GameState } from "@/lib/types";

function defaultGameState(): GameState {
  return {
    totalXP: 0,
    level: 1,
    levelTitle: "ROOKIE",
    streak: 0,
    lastCheckinDate: "",
    healthCoins: 0,
    achievements: [],
    bossDefeated: false,
    bossWeekStart: weekStart(),
    activeQuest: null,
  };
}

function rowToGame(row: typeof gameStates.$inferSelect): GameState {
  return {
    totalXP: row.totalXP,
    level: row.level,
    levelTitle: row.levelTitle,
    streak: row.streak,
    lastCheckinDate: row.lastCheckinDate,
    healthCoins: row.healthCoins,
    achievements: JSON.parse(row.achievements) as string[],
    bossDefeated: row.bossDefeated,
    bossWeekStart: row.bossWeekStart,
    activeQuest: row.activeQuest,
  };
}

function saveGame(userId: string, game: GameState) {
  const db = getDb();
  const values = {
    userId,
    totalXP: game.totalXP,
    level: game.level,
    levelTitle: game.levelTitle,
    streak: game.streak,
    lastCheckinDate: game.lastCheckinDate,
    healthCoins: game.healthCoins,
    achievements: JSON.stringify(game.achievements),
    bossDefeated: game.bossDefeated,
    bossWeekStart: game.bossWeekStart,
    activeQuest: game.activeQuest,
  };

  const existing = db.select().from(gameStates).where(eq(gameStates.userId, userId)).get();
  if (existing) {
    db.update(gameStates).set(values).where(eq(gameStates.userId, userId)).run();
  } else {
    db.insert(gameStates).values(values).run();
  }
}

export const getGameFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    if (!row) {
      const init = defaultGameState();
      saveGame(context.userId, init);
      return init;
    }
    return rowToGame(row);
  });

const gameSchema = z.object({
  totalXP: z.number(),
  level: z.number(),
  levelTitle: z.string(),
  streak: z.number(),
  lastCheckinDate: z.string(),
  healthCoins: z.number(),
  achievements: z.array(z.string()),
  bossDefeated: z.boolean(),
  bossWeekStart: z.string(),
  activeQuest: z.string().nullable(),
});

export const setGameFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(gameSchema)
  .handler(async ({ context, data }) => {
    saveGame(context.userId, data);
    return data;
  });

const grantXpSchema = z.object({
  amount: z.number(),
  classType: z.enum(["warrior", "mage", "healer"]).optional(),
});

export const grantXpFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(grantXpSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    const prevXP = game.totalXP;
    const bonus =
      data.classType === "warrior" && data.amount === XP_REWARDS.meal_log ? 10 : 0;
    const total = data.amount + bonus;
    game.totalXP += total;
    game.healthCoins += Math.floor(total / 10);

    const before = levelFromXP(prevXP);
    const after = levelFromXP(game.totalXP);
    const leveledUp = after.level > before.level;
    game.level = after.level;
    game.levelTitle = after.title;

    if (after.level >= 6 && !game.achievements.includes("legend")) {
      game.achievements.push("legend");
    }

    saveGame(context.userId, game);

    const result: XPGrantResult = {
      prevXP,
      newXP: game.totalXP,
      leveledUp,
      newLevelTitle: leveledUp ? after.title : undefined,
    };
    return { game, result };
  });

const achievementSchema = z.object({ id: z.string() });

export const unlockAchievementFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(achievementSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    let unlocked = false;
    if (!game.achievements.includes(data.id)) {
      game.achievements.push(data.id);
      saveGame(context.userId, game);
      unlocked = true;
    }

    return { game, unlocked };
  });

const streakSchema = z.object({
  todayKey: z.string(),
  yesterdayKey: z.string(),
});

export const updateStreakFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(streakSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    if (game.lastCheckinDate === data.todayKey) {
      return { game, streak: game.streak };
    }
    if (game.lastCheckinDate === data.yesterdayKey) game.streak += 1;
    else game.streak = 1;
    game.lastCheckinDate = data.todayKey;

    let streakBonus = false;
    if (game.streak === 7 || game.streak === 30) {
      game.totalXP += XP_REWARDS.streak_bonus_7day;
      game.healthCoins += Math.floor(XP_REWARDS.streak_bonus_7day / 10);
      streakBonus = true;
      const after = levelFromXP(game.totalXP);
      game.level = after.level;
      game.levelTitle = after.title;
    }

    saveGame(context.userId, game);
    return { game, streak: game.streak, streakBonus };
  });

export const checkBossWeekFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ weekStartKey: z.string() }))
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    if (game.bossWeekStart !== data.weekStartKey) {
      game.bossWeekStart = data.weekStartKey;
      game.bossDefeated = false;
      saveGame(context.userId, game);
    }
    return game;
  });

export const spendCoinsFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ amount: z.number() }))
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    if (game.healthCoins < data.amount) {
      return { ok: false as const, game };
    }
    game.healthCoins -= data.amount;
    saveGame(context.userId, game);
    return { ok: true as const, game };
  });

export const setActiveQuestFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ quest: z.string().nullable() }))
  .handler(async ({ context, data }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();
    game.activeQuest = data.quest;
    saveGame(context.userId, game);
    return game;
  });

export const evaluateBossFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    const ws = weekStart();
    const dayRows = db
      .select()
      .from(dayLogs)
      .where(eq(dayLogs.userId, context.userId))
      .all();

    const weekDays: Record<string, DayLog> = {};
    for (const r of dayRows) {
      const d = JSON.parse(r.data) as DayLog;
      if (d.date >= ws) weekDays[d.date] = d;
    }

    const boss = bossProgressFromDays(weekDays);
    let rewarded = false;
    let xpGranted = 0;

    if (boss.defeated && !game.bossDefeated) {
      game.bossDefeated = true;
      game.totalXP += XP_REWARDS.boss_defeated;
      game.healthCoins += Math.floor(XP_REWARDS.boss_defeated / 10);
      if (!game.achievements.includes("boss_slayer")) {
        game.achievements.push("boss_slayer");
      }
      const after = levelFromXP(game.totalXP);
      game.level = after.level;
      game.levelTitle = after.title;
      if (after.level >= 6 && !game.achievements.includes("legend")) {
        game.achievements.push("legend");
      }
      rewarded = true;
      xpGranted = XP_REWARDS.boss_defeated;
      saveGame(context.userId, game);
    }

    return { game, boss, rewarded, xpGranted };
  });

export const completeQuestFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
    const game = row ? rowToGame(row) : defaultGameState();

    if (!game.activeQuest) return { game, completed: false, xpGranted: 0 };

    const todayRow = db
      .select()
      .from(dayLogs)
      .where(eq(dayLogs.userId, context.userId))
      .all()
      .map((r) => JSON.parse(r.data) as DayLog)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const eligible =
      todayRow &&
      (todayRow.fastingSugar !== null || todayRow.meals.length > 0 || todayRow.medsTaken);

    if (!eligible) return { game, completed: false, xpGranted: 0 };

    game.totalXP += XP_REWARDS.quest_completed;
    game.healthCoins += Math.floor(XP_REWARDS.quest_completed / 10);
    game.activeQuest = null;
    const after = levelFromXP(game.totalXP);
    game.level = after.level;
    game.levelTitle = after.title;
    saveGame(context.userId, game);

    return { game, completed: true, xpGranted: XP_REWARDS.quest_completed };
  });
