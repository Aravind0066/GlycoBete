import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getDb } from "./db/client.js";
import { registerAiRoutes } from "./routes/aiRoutes.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";
import { registerDataRoutes } from "./routes/dataRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8081;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const glucoseLogSchema = z.object({
  userId: z.string().uuid(),
  readingMgDl: z.number().int().min(20).max(600),
  readingContext: z
    .enum(["fasting", "before_meal", "after_meal", "bedtime", "random"])
    .default("fasting"),
  symptoms: z.array(z.string()).default([]),
  medsTaken: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

app.get("/health", (_req, res) => {
  let sqliteOk = false;
  try {
    getDb().prepare("SELECT 1").get();
    sqliteOk = true;
  } catch {
    sqliteOk = false;
  }

  res.json({
    ok: true,
    service: "glycobete-api",
    sqliteConfigured: sqliteOk,
    databaseConfigured: Boolean(getSupabaseAdmin()),
    grokConfigured: Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
  });
});

registerAuthRoutes(app);
registerDataRoutes(app);
registerAiRoutes(app);

app.post("/api/glucose-logs", async (req, res) => {
  const parsed = glucoseLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid glucose log", details: parsed.error.flatten() });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase is not configured" });
  }

  const { userId, readingMgDl, readingContext, symptoms, medsTaken, notes } = parsed.data;
  const { data, error } = await supabase
    .from("glucose_logs")
    .insert({
      user_id: userId,
      reading_mg_dl: readingMgDl,
      reading_context: readingContext,
      symptoms,
      meds_taken: medsTaken,
      notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ data });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "Unexpected GlycoBete API error" });
});

app.listen(port, () => {
  console.log(`GlycoBete API listening on port ${port}`);
});
