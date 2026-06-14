import { postJson } from "./apiClient";

type CoachMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type CoachResponse = {
  reply: string;
  suggestedActions: string[];
  safetyDisclaimer: string;
  source: "grok" | "fallback";
};

export function extractMedicationsFromImage(args: {
  image: { base64: string; mimeType: "image/jpeg" | "image/jpg" | "image/png" };
}) {
  return postJson<{
    medicationsText: string;
    extractedItems: string[];
    safetyDisclaimer: string;
    source: "grok" | "fallback";
  }>("/api/ai/extract-medications", args);
}

export function askGlycoBeteCoach(args: {
  message: string;
  history: CoachMessage[];
  profile?: Record<string, unknown>;
}) {
  return postJson<CoachResponse>("/api/ai/coach", args);
}

export type MealAnalysisResponse = {
  estimatedCarbs: string;
  sugarImpact: string;
  glycemicLevel: "low" | "medium" | "high";
  healthierAlternatives: string[];
  explanation: string;
  safetyDisclaimer: string;
  source: "grok" | "fallback";
};

export function analyzeMealWithBackend(args: {
  foodDescription?: string;
  image?: { base64: string; mimeType: "image/jpeg" | "image/jpg" | "image/png" };
}) {
  return postJson<MealAnalysisResponse>("/api/ai/meal-analysis", args);
}

export type DailyDebriefResponse = {
  controlStatus: "controlled" | "watch_out" | "alert";
  patternDetected: string;
  tomorrowsQuest: string;
  bossProgress: boolean;
  safetyDisclaimer: string;
  source: "grok" | "fallback";
};

export function analyzeDayWithBackend(args: {
  name: string;
  diabetesType: string;
  fasting: number | null;
  meals: { description: string; glycemicLevel: string }[];
  symptoms: string[];
  medsTaken: boolean;
}) {
  return postJson<DailyDebriefResponse>("/api/ai/daily-debrief", args);
}

export type HealthInsightsResponse = {
  trends: string[];
  warnings: string[];
  weeklySummary: string;
  actionSuggestions: string[];
  safetyDisclaimer: string;
  source: "grok" | "fallback";
};

export function analyzeWeekWithBackend(args: {
  glucoseLogs: Record<string, unknown>[];
  mealLogs: Record<string, unknown>[];
}) {
  return postJson<HealthInsightsResponse>("/api/ai/health-insights", args);
}
