import type { DayLog, GameState, MealLog } from "./types";
import { last7Days, storage } from "./gameEngine";
import { getQuestProgress } from "./questEngine";

export type DashboardMetrics = {
  healthScore: number;
  scoreLabel: string;
  scoreTone: "good" | "watch" | "alert";
  questProgress: ReturnType<typeof getQuestProgress>;
  recentLogs: { id: string; label: string; detail: string; tone: "good" | "watch" | "alert" }[];
  weeklySummary: {
    averageFasting: number | null;
    daysInRange: number;
    mealsLogged: number;
    checkins: number;
  };
};

function scoreFromFasting(reading: number | null) {
  if (!reading) return 8;
  if (reading >= 80 && reading <= 130) return 35;
  if (reading >= 70 && reading <= 160) return 24;
  return 10;
}

function mealScore(meals: MealLog[]) {
  if (meals.length === 0) return 8;
  const highMeals = meals.filter((meal) => meal.glycemicLevel === "high").length;
  return Math.max(8, 25 - highMeals * 8);
}

function streakScore(game: GameState) {
  return Math.min(20, game.streak * 4);
}

function engagementScore(today: DayLog) {
  let score = 0;
  if (today.fastingSugar) score += 8;
  if (today.medsTaken) score += 6;
  if (today.sleepQuality) score += 4;
  if (today.eveningSummary) score += 2;
  return score;
}

function scoreLabel(score: number) {
  if (score >= 78) return "Steady";
  if (score >= 55) return "Needs Attention";
  return "Build Momentum";
}

function scoreTone(score: number): DashboardMetrics["scoreTone"] {
  if (score >= 78) return "good";
  if (score >= 55) return "watch";
  return "alert";
}

function buildQuestProgress() {
  return getQuestProgress();
}

function buildRecentLogs(today: DayLog) {
  const logs: DashboardMetrics["recentLogs"] = [];
  if (today.fastingSugar) {
    const tone =
      today.fastingSugar >= 80 && today.fastingSugar <= 130
        ? "good"
        : today.fastingSugar <= 160
          ? "watch"
          : "alert";
    logs.push({
      id: `${today.date}-fasting`,
      label: "Fasting glucose",
      detail: `${today.fastingSugar} mg/dL`,
      tone,
    });
  }

  for (const meal of [...today.meals].reverse().slice(0, 3)) {
    logs.push({
      id: meal.id,
      label: meal.mealType,
      detail: meal.description,
      tone:
        meal.glycemicLevel === "low" ? "good" : meal.glycemicLevel === "medium" ? "watch" : "alert",
    });
  }

  return logs;
}

function buildWeeklySummary(days: DayLog[]) {
  const sugars = days
    .map((day) => day.fastingSugar)
    .filter((reading): reading is number => reading != null);
  const averageFasting = sugars.length
    ? Math.round(sugars.reduce((total, reading) => total + reading, 0) / sugars.length)
    : null;
  return {
    averageFasting,
    daysInRange: sugars.filter((reading) => reading >= 70 && reading <= 140).length,
    mealsLogged: days.reduce((total, day) => total + day.meals.length, 0),
    checkins: sugars.length,
  };
}

export function getDashboardMetrics(): DashboardMetrics {
  const game = storage.getGame();
  const today = storage.getToday();
  const week = last7Days();
  const healthScore = Math.min(
    100,
    scoreFromFasting(today.fastingSugar) +
      mealScore(today.meals) +
      streakScore(game) +
      engagementScore(today),
  );

  return {
    healthScore,
    scoreLabel: scoreLabel(healthScore),
    scoreTone: scoreTone(healthScore),
    questProgress: buildQuestProgress(),
    recentLogs: buildRecentLogs(today),
    weeklySummary: buildWeeklySummary(week),
  };
}
