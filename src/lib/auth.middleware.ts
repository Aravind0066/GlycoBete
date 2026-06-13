import { createMiddleware } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db/client.server";
import { users } from "@/lib/db/schema";
import { readSessionUserId, setSessionUserId } from "@/lib/session.server";

export const userMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const db = getDb();
  let userId = readSessionUserId();

  if (userId) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
    if (!existing) userId = null;
  }

  if (!userId) {
    userId = nanoid();
    db.insert(users).values({ id: userId, createdAt: new Date() }).run();
    setSessionUserId(userId);
  }

  return next({ context: { userId } });
});
