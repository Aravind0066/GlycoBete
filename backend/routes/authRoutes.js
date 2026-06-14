import { z } from "zod";
import { createUser, readSessionUserId, requireUser, SESSION_COOKIE } from "../middleware/session.js";
import { getDb } from "../db/client.js";

const loginSchema = z.object({
  name: z.string().min(1).max(80),
});

export function registerAuthRoutes(app) {
  app.post("/api/auth/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Enter a valid name" });
    }

    const user = createUser(parsed.data.name);
    res.cookie(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({
      data: {
        id: user.id,
        displayName: user.display_name,
        hasProfile: Boolean(
          db.prepare("SELECT name FROM profiles WHERE user_id = ? AND name != ''").get(user.id)?.name,
        ),
      },
    });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.json({ data: { ok: true } });
  });

  app.get("/api/auth/me", (req, res) => {
    const userId = readSessionUserId(req);
    if (!userId) {
      return res.json({ data: { authenticated: false } });
    }

    const db = getDb();
    const user = db.prepare("SELECT id, display_name FROM users WHERE id = ?").get(userId);
    if (!user) {
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      return res.json({ data: { authenticated: false } });
    }

    const profile = db
      .prepare("SELECT name FROM profiles WHERE user_id = ?")
      .get(userId);

    return res.json({
      data: {
        authenticated: true,
        id: user.id,
        displayName: user.display_name,
        hasProfile: Boolean(profile?.name),
      },
    });
  });

  app.get("/api/auth/session", requireUser, (req, res) => {
    res.json({
      data: {
        id: req.user.id,
        displayName: req.user.display_name,
      },
    });
  });
}
