import { z } from "zod";
import { assessDiabetesRisk } from "../ai/riskAssessmentAgent.js";
import { answerDiabetesCoach } from "../ai/diabetesCoachAgent.js";
import { analyzeMeal } from "../ai/mealAnalysisAgent.js";
import { generateHealthInsights } from "../ai/healthInsightAgent.js";
import { generateDailyDebrief } from "../ai/dailyDebriefAgent.js";

const riskAssessmentSchema = z.object({
  age: z.number().int().min(1).max(120),
  weightKg: z.number().min(1).max(400).optional(),
  heightCm: z.number().min(30).max(260).optional(),
  symptoms: z.array(z.string()).default([]),
  familyHistory: z.boolean().default(false),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .default("moderate"),
});

const coachSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000),
      }),
    )
    .default([]),
  profile: z.record(z.unknown()).optional(),
});

const mealAnalysisSchema = z.object({
  foodDescription: z.string().max(2000).optional(),
  image: z
    .object({
      base64: z.string().min(1),
      mimeType: z.enum(["image/jpeg", "image/jpg", "image/png"]),
    })
    .optional(),
});

const healthInsightsSchema = z.object({
  glucoseLogs: z.array(z.record(z.unknown())).default([]),
  mealLogs: z.array(z.record(z.unknown())).default([]),
});

const dailyDebriefSchema = z.object({
  name: z.string().min(1).max(120),
  diabetesType: z.string().min(1).max(120),
  fasting: z.number().int().min(20).max(600).nullable(),
  meals: z
    .array(
      z.object({
        description: z.string(),
        glycemicLevel: z.string(),
      }),
    )
    .default([]),
  symptoms: z.array(z.string()).default([]),
  medsTaken: z.boolean(),
});

function validate(schema, body, res) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid AI request", details: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
}

export function registerAiRoutes(app) {
  app.post("/api/ai/risk-assessment", async (req, res, next) => {
    const input = validate(riskAssessmentSchema, req.body, res);
    if (!input) return;
    try {
      res.json({ data: await assessDiabetesRisk(input) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/coach", async (req, res, next) => {
    const input = validate(coachSchema, req.body, res);
    if (!input) return;
    try {
      res.json({ data: await answerDiabetesCoach(input) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/meal-analysis", async (req, res, next) => {
    const input = validate(mealAnalysisSchema, req.body, res);
    if (!input) return;
    if (!input.foodDescription && !input.image) {
      res.status(400).json({ error: "Provide a food description or image" });
      return;
    }
    try {
      res.json({ data: await analyzeMeal(input) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/health-insights", async (req, res, next) => {
    const input = validate(healthInsightsSchema, req.body, res);
    if (!input) return;
    try {
      res.json({ data: await generateHealthInsights(input) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/daily-debrief", async (req, res, next) => {
    const input = validate(dailyDebriefSchema, req.body, res);
    if (!input) return;
    try {
      res.json({ data: await generateDailyDebrief(input) });
    } catch (error) {
      next(error);
    }
  });
}
