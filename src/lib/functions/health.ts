import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { userMiddleware } from "@/lib/auth.middleware";
import { getDb } from "@/lib/db/client.server";
import { dayLogs, profiles } from "@/lib/db/schema";
import { buildHealthMetrics, predictRisk } from "@/lib/healthAnalytics";
import type { DayLog } from "@/lib/types";

function parseDay(row: typeof dayLogs.$inferSelect): DayLog {
  return JSON.parse(row.data) as DayLog;
}

export const getHealthDashboardFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const profile = db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId))
      .get();

    const rows = db
      .select()
      .from(dayLogs)
      .where(eq(dayLogs.userId, context.userId))
      .all()
      .map(parseDay)
      .sort((a, b) => a.date.localeCompare(b.date));

    const last30 = rows.slice(-30);
    const last7 = rows.slice(-7);

    const p = profile
      ? {
          name: profile.name,
          mode: profile.mode as "patient" | "family",
          class: profile.class as "warrior" | "mage" | "healer",
          age: profile.age,
          gender: profile.gender,
          diabetesType: profile.diabetesType,
          medications: profile.medications,
          theme: profile.theme as "midnight" | "forest" | "sunrise" | "ocean",
          emergencyContact: profile.emergencyContact ?? "",
          emergencyPhone: profile.emergencyPhone ?? "",
          doctorName: profile.doctorName ?? "",
          doctorPhone: profile.doctorPhone ?? "",
          bloodGroup: profile.bloodGroup ?? "",
        }
      : null;

    return {
      metrics: buildHealthMetrics(last7, p),
      risk: predictRisk(last7),
      days: last7,
      monthDays: last30,
    };
  });
