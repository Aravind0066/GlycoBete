import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.server";
import { dayLogs, gameStates, partyMembers, prescriptionMeds, profiles } from "@/lib/db/schema";
import { userMiddleware } from "@/lib/auth.middleware";

export const migrateLocalDataFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(
    z.object({
      profile: z
        .object({
          name: z.string(),
          mode: z.enum(["patient", "family"]),
          class: z.enum(["warrior", "mage", "healer"]),
          age: z.string(),
          gender: z.string(),
          medications: z.string(),
          diabetesType: z.string(),
        })
        .nullable(),
      game: z
        .object({
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
        })
        .nullable(),
      days: z.record(z.string(), z.unknown()).optional(),
      party: z
        .array(z.object({ id: z.string(), name: z.string(), relationship: z.string() }))
        .optional(),
      meds: z
        .array(
          z.object({
            name: z.string(),
            whatItDoes: z.string(),
            whyYouTakeIt: z.string(),
            sideEffects: z.string(),
            ifYouMissDose: z.string(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const db = getDb();
    const userId = context.userId;

    if (data.profile) {
      const existing = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
      const values = { ...data.profile, userId, theme: "midnight" as const };
      if (existing) {
        db.update(profiles).set(values).where(eq(profiles.userId, userId)).run();
      } else {
        db.insert(profiles).values(values).run();
      }
    }

    if (data.game) {
      const g = data.game;
      const values = {
        userId,
        totalXP: g.totalXP,
        level: g.level,
        levelTitle: g.levelTitle,
        streak: g.streak,
        lastCheckinDate: g.lastCheckinDate,
        healthCoins: g.healthCoins,
        achievements: JSON.stringify(g.achievements),
        bossDefeated: g.bossDefeated,
        bossWeekStart: g.bossWeekStart,
        activeQuest: g.activeQuest,
      };
      const existing = db.select().from(gameStates).where(eq(gameStates.userId, userId)).get();
      if (existing) {
        db.update(gameStates).set(values).where(eq(gameStates.userId, userId)).run();
      } else {
        db.insert(gameStates).values(values).run();
      }
    }

    if (data.days) {
      for (const day of Object.values(data.days)) {
        const d = day as { date: string };
        const rows = db.select().from(dayLogs).where(eq(dayLogs.userId, userId)).all();
        const existing = rows.find((r) => r.date === d.date);
        if (!existing) {
          db.insert(dayLogs)
            .values({ userId, date: d.date, data: JSON.stringify(day) })
            .run();
        }
      }
    }

    if (data.party?.length) {
      db.delete(partyMembers).where(eq(partyMembers.userId, userId)).run();
      for (const m of data.party) {
        db.insert(partyMembers).values({ ...m, userId }).run();
      }
    }

    if (data.meds?.length) {
      const existing = db
        .select()
        .from(prescriptionMeds)
        .where(eq(prescriptionMeds.userId, userId))
        .get();
      if (existing) {
        db.update(prescriptionMeds)
          .set({ meds: JSON.stringify(data.meds) })
          .where(eq(prescriptionMeds.userId, userId))
          .run();
      } else {
        db.insert(prescriptionMeds)
          .values({ userId, meds: JSON.stringify(data.meds) })
          .run();
      }
    }

    return { migrated: true };
  });
