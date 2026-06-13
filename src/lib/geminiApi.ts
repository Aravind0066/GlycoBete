/** Client-safe AI response types. Calls go through `api` (server-side Gemini). */

export interface MealAnalysis {
  meal_name: string;
  glycemic_level: "low" | "medium" | "high";
  explanation: string;
  indian_insight: string;
  xp_earned: number;
}

export interface DailySummary {
  control_status: "controlled" | "watch_out" | "alert";
  pattern_detected: string;
  tomorrows_quest: string;
  boss_progress: boolean;
}
