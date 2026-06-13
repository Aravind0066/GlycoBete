import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client.server";
import { partyMembers, prescriptionMeds } from "@/lib/db/schema";
import { userMiddleware } from "@/lib/auth.middleware";
import type { PartyMember, PrescriptionMed } from "@/lib/types";

export const getPartyFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const rows = db
      .select()
      .from(partyMembers)
      .where(eq(partyMembers.userId, context.userId))
      .all();
    return rows.map(
      (r): PartyMember => ({
        id: r.id,
        name: r.name,
        relationship: r.relationship,
      }),
    );
  });

const partySchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    relationship: z.string(),
  }),
);

export const setPartyFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(partySchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    db.delete(partyMembers).where(eq(partyMembers.userId, context.userId)).run();
    for (const m of data) {
      db.insert(partyMembers)
        .values({
          id: m.id,
          userId: context.userId,
          name: m.name,
          relationship: m.relationship,
        })
        .run();
    }
    return data;
  });

export const getMedsFn = createServerFn({ method: "GET" })
  .middleware([userMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    const row = db
      .select()
      .from(prescriptionMeds)
      .where(eq(prescriptionMeds.userId, context.userId))
      .get();
    if (!row) return [] as PrescriptionMed[];
    return JSON.parse(row.meds) as PrescriptionMed[];
  });

const medsSchema = z.array(
  z.object({
    name: z.string(),
    whatItDoes: z.string(),
    whyYouTakeIt: z.string(),
    sideEffects: z.string(),
    ifYouMissDose: z.string(),
  }),
);

export const setMedsFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(medsSchema)
  .handler(async ({ context, data }) => {
    const db = getDb();
    const existing = db
      .select()
      .from(prescriptionMeds)
      .where(eq(prescriptionMeds.userId, context.userId))
      .get();

    if (existing) {
      db.update(prescriptionMeds)
        .set({ meds: JSON.stringify(data) })
        .where(eq(prescriptionMeds.userId, context.userId))
        .run();
    } else {
      db.insert(prescriptionMeds)
        .values({ userId: context.userId, meds: JSON.stringify(data) })
        .run();
    }
    return data;
  });
