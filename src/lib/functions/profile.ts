import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.server";
import { gameStates, profiles } from "@/lib/db/schema";
import { userMiddleware } from "@/lib/auth.middleware";
import { weekStart } from "@/lib/gameEngine";
import type { AppTheme, UserProfile } from "@/lib/types";

const profileSchema = z.object({
  name: z.string(),
  mode: z.enum(["patient", "family"]),
  class: z.enum(["warrior", "mage", "healer"]),
  age: z.string(),
  gender: z.string(),
  diabetesType: z.string(),
  medications: z.string(),
  theme: z.enum(["midnight", "forest", "sunrise", "ocean"]).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  bloodGroup: z.string().optional(),
});

const emergencySchema = z.object({
  emergencyContact: z.string(),
  emergencyPhone: z.string(),
  doctorName: z.string(),
  doctorPhone: z.string(),
  bloodGroup: z.string(),
});

const themeSchema = z.object({
  theme: z.enum(["midnight", "forest", "sunrise", "ocean"]),
});

function rowToProfile(row: typeof profiles.$inferSelect): UserProfile {
  return {
    name: row.name,
    mode: row.mode,
    class: row.class,
    age: row.age,
    gender: row.gender,
    diabetesType: row.diabetesType,
    medications: row.medications,
    theme: row.theme as AppTheme,
    emergencyContact: row.emergencyContact ?? "",
    emergencyPhone: row.emergencyPhone ?? "",
    doctorName: row.doctorName ?? "",
    doctorPhone: row.doctorPhone ?? "",
    bloodGroup: row.bloodGroup ?? "",
  };
}

export const getProfileFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();
    return row ? rowToProfile(row) : null;
  });

export const saveProfileFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(profileSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const theme = data.theme ?? "midnight";
    const existing = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();

    if (existing) {
      db.update(profiles)
        .set({
          name: data.name,
          mode: data.mode,
          class: data.class,
          age: data.age,
          gender: data.gender,
          diabetesType: data.diabetesType,
          medications: data.medications,
          theme,
          emergencyContact: data.emergencyContact ?? existing.emergencyContact ?? "",
          emergencyPhone: data.emergencyPhone ?? existing.emergencyPhone ?? "",
          doctorName: data.doctorName ?? existing.doctorName ?? "",
          doctorPhone: data.doctorPhone ?? existing.doctorPhone ?? "",
          bloodGroup: data.bloodGroup ?? existing.bloodGroup ?? "",
        })
        .where(eq(profiles.userId, context.userId))
        .run();
    } else {
      db.insert(profiles)
        .values({
          userId: context.userId,
          name: data.name,
          mode: data.mode,
          class: data.class,
          age: data.age,
          gender: data.gender,
          diabetesType: data.diabetesType,
          medications: data.medications,
          theme,
          emergencyContact: data.emergencyContact ?? "",
          emergencyPhone: data.emergencyPhone ?? "",
          doctorName: data.doctorName ?? "",
          doctorPhone: data.doctorPhone ?? "",
          bloodGroup: data.bloodGroup ?? "",
        })
        .run();

      const gs = db.select().from(gameStates).where(eq(gameStates.userId, context.userId)).get();
      if (!gs) {
        db.insert(gameStates)
          .values({
            userId: context.userId,
            bossWeekStart: weekStart(),
            achievements: "[]",
          })
          .run();
      }
    }

    return rowToProfile({
      userId: context.userId,
      name: data.name,
      mode: data.mode,
      class: data.class,
      age: data.age,
      gender: data.gender,
      diabetesType: data.diabetesType,
      medications: data.medications,
      theme,
      emergencyContact: data.emergencyContact ?? "",
      emergencyPhone: data.emergencyPhone ?? "",
      doctorName: data.doctorName ?? "",
      doctorPhone: data.doctorPhone ?? "",
      bloodGroup: data.bloodGroup ?? "",
    });
  });

export const updateEmergencyFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(emergencySchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();

    if (!existing) throw new Error("Profile required");

    db.update(profiles)
      .set({
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        doctorName: data.doctorName,
        doctorPhone: data.doctorPhone,
        bloodGroup: data.bloodGroup,
      })
      .where(eq(profiles.userId, context.userId))
      .run();

    return rowToProfile({ ...existing, ...data });
  });

export const updateThemeFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(themeSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();

    if (!existing) {
      db.insert(profiles)
        .values({
          userId: context.userId,
          theme: data.theme,
        })
        .run();
    } else {
      db.update(profiles)
        .set({ theme: data.theme })
        .where(eq(profiles.userId, context.userId))
        .run();
    }

    return { theme: data.theme };
  });

export const hasProfileFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db
      .select({ name: profiles.name })
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();
    return { hasProfile: !!row?.name };
  });
