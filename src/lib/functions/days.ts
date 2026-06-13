import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.server";
import { dayLogs } from "@/lib/db/schema";
import { userMiddleware } from "@/lib/auth.middleware";
import { todayKey } from "@/lib/gameEngine";
import type { DayLog } from "@/lib/types";

function emptyDay(date: string): DayLog {
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

function parseDay(row: typeof dayLogs.$inferSelect): DayLog {
  return JSON.parse(row.data) as DayLog;
}

function saveDayRow(userId: string, day: DayLog) {
  const db = getDb();
  const existing = db
    .select()
    .from(dayLogs)
    .where(and(eq(dayLogs.userId, userId), eq(dayLogs.date, day.date)))
    .get();

  if (existing) {
    db.update(dayLogs)
      .set({ data: JSON.stringify(day) })
      .where(and(eq(dayLogs.userId, userId), eq(dayLogs.date, day.date)))
      .run();
  } else {
    db.insert(dayLogs).values({ userId, date: day.date, data: JSON.stringify(day) }).run();
  }
}

export const getTodayFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const key = todayKey();
    const row = db
      .select()
      .from(dayLogs)
      .where(and(eq(dayLogs.userId, context.userId), eq(dayLogs.date, key)))
      .get();

    if (!row) {
      const day = emptyDay(key);
      saveDayRow(context.userId, day);
      return day;
    }
    return parseDay(row);
  });

export const saveDayFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(
    z.object({
      date: z.string(),
      fastingSugar: z.number().nullable(),
      sleepQuality: z.number().nullable(),
      symptoms: z.array(z.string()),
      medsTaken: z.boolean(),
      meals: z.array(
        z.object({
          id: z.string(),
          time: z.string(),
          description: z.string(),
          mealType: z.string(),
          glycemicLevel: z.enum(["low", "medium", "high"]),
          explanation: z.string(),
          indianInsight: z.string(),
          xpEarned: z.number(),
        }),
      ),
      eveningSummary: z
        .object({
          controlStatus: z.enum(["controlled", "watch_out", "alert"]),
          patternDetected: z.string(),
          tomorrowsQuest: z.string(),
          bossProgress: z.boolean(),
        })
        .nullable(),
    }),
  )
  .handler(async ({ context, data }) => {
    saveDayRow(context.userId, data);
    return data;
  });

export const getLast7DaysFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const out: DayLog[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      const db = getDb();
      const row = db
        .select()
        .from(dayLogs)
        .where(and(eq(dayLogs.userId, context.userId), eq(dayLogs.date, key)))
        .get();
      out.push(row ? parseDay(row) : emptyDay(key));
    }
    return out;
  });

export const getDaysInRangeFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ startDate: z.string(), endDate: z.string() }))
  .handler(async ({ context, data }) => {
    const db = getDb();
    const rows = db
      .select()
      .from(dayLogs)
      .where(
        and(
          eq(dayLogs.userId, context.userId),
          gte(dayLogs.date, data.startDate),
          lte(dayLogs.date, data.endDate),
        ),
      )
      .all();

    const map: Record<string, DayLog> = {};
    for (const row of rows) {
      map[row.date] = parseDay(row);
    }
    return map;
  });
