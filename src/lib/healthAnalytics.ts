import type { DayLog, UserProfile } from "./types";

export interface HealthMetrics {
  currentGlucose: number | null;
  weeklyAverage: number | null;
  highestReading: number | null;
  lowestReading: number | null;
  hba1cEstimate: number | null;
  daysInRange: number;
  totalDays: number;
  mealsLogged: number;
  medicationAdherence: number;
  exerciseMinutes: number;
  waterGlasses: number;
  healthScore: number;
  glucoseTrend: "improving" | "stable" | "worsening";
  monthImprovement: number;
}

export interface RiskPrediction {
  hypoglycemiaRisk: "low" | "medium" | "high";
  hyperglycemiaRisk: "low" | "medium" | "high";
  summary: string;
  factors: string[];
}

const GLUCOSE_MIN = 70;
const GLUCOSE_MAX = 140;

function fastingValues(days: DayLog[]): number[] {
  return days.map((d) => d.fastingSugar).filter((n): n is number => n !== null);
}

export function estimateHbA1c(avgGlucose: number): number {
  return Math.round((avgGlucose + 46.7) / 28.7 * 10) / 10;
}

export function computeHealthScore(days: DayLog[], profile: UserProfile | null): number {
  const sugars = fastingValues(days);
  if (sugars.length === 0) return 50;

  const inRange = sugars.filter((s) => s >= GLUCOSE_MIN && s <= GLUCOSE_MAX).length;
  const consistencyScore = (inRange / sugars.length) * 35;

  const stdDev = standardDeviation(sugars);
  const stabilityScore = Math.max(0, 25 - stdDev * 0.5);

  const medsDays = days.filter((d) => d.medsTaken).length;
  const medScore = days.length > 0 ? (medsDays / days.length) * 20 : 10;

  const mealDays = days.filter((d) => d.meals.length > 0).length;
  const loggingScore = days.length > 0 ? (mealDays / days.length) * 10 : 5;

  const sleepDays = days.filter((d) => d.sleepQuality && d.sleepQuality >= 3).length;
  const sleepScore = days.length > 0 ? (sleepDays / days.length) * 10 : 5;

  return Math.min(100, Math.round(consistencyScore + stabilityScore + medScore + loggingScore + sleepScore));
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeGlucoseTrend(days: DayLog[]): "improving" | "stable" | "worsening" {
  const sugars = days
    .filter((d) => d.fastingSugar !== null)
    .map((d) => ({ date: d.date, sugar: d.fastingSugar! }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sugars.length < 4) return "stable";

  const mid = Math.floor(sugars.length / 2);
  const firstHalf = sugars.slice(0, mid);
  const secondHalf = sugars.slice(mid);
  const avgFirst = firstHalf.reduce((s, d) => s + d.sugar, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, d) => s + d.sugar, 0) / secondHalf.length;
  const diff = avgFirst - avgSecond;

  if (diff > 8) return "improving";
  if (diff < -8) return "worsening";
  return "stable";
}

export function computeMonthImprovement(days: DayLog[]): number {
  if (days.length < 7) return 0;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const prior = sorted.slice(-14, -7);
  const recentAvg = fastingValues(recent);
  const priorAvg = fastingValues(prior);
  if (recentAvg.length === 0 || priorAvg.length === 0) return 0;
  const r = recentAvg.reduce((a, b) => a + b, 0) / recentAvg.length;
  const p = priorAvg.reduce((a, b) => a + b, 0) / priorAvg.length;
  if (p === 0) return 0;
  return Math.round(((p - r) / p) * 100);
}

export function predictRisk(days: DayLog[]): RiskPrediction {
  const sugars = fastingValues(days);
  const factors: string[] = [];

  if (sugars.length === 0) {
    return {
      hypoglycemiaRisk: "low",
      hyperglycemiaRisk: "medium",
      summary: "Not enough readings yet. Log your fasting sugar daily for accurate risk prediction.",
      factors: ["Insufficient glucose data"],
    };
  }

  const recent = sugars.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const lowCount = recent.filter((s) => s < 70).length;
  const highCount = recent.filter((s) => s > 180).length;
  const missedMeds = days.slice(-3).filter((d) => !d.medsTaken).length;

  let hypoRisk: RiskPrediction["hypoglycemiaRisk"] = "low";
  let hyperRisk: RiskPrediction["hyperglycemiaRisk"] = "low";

  if (lowCount >= 1 || avg < 80) {
    hypoRisk = lowCount >= 2 ? "high" : "medium";
    factors.push("Recent low fasting readings detected");
  }
  if (highCount >= 1 || avg > 160) {
    hyperRisk = highCount >= 2 ? "high" : "medium";
    factors.push("Elevated fasting glucose trend");
  }
  if (missedMeds >= 2) {
    hyperRisk = hyperRisk === "low" ? "medium" : hyperRisk;
    factors.push("Missed medication doses this week");
  }

  const highMeals = days.slice(-3).flatMap((d) => d.meals).filter((m) => m.glycemicLevel === "high").length;
  if (highMeals >= 2) {
    hyperRisk = hyperRisk === "low" ? "medium" : hyperRisk;
    factors.push("Multiple high-glycemic meals logged recently");
  }

  if (factors.length === 0) factors.push("Readings mostly in target range");

  const summary =
    hypoRisk === "high" || hyperRisk === "high"
      ? "Elevated risk detected — monitor closely and consult your doctor if symptoms persist."
      : hypoRisk === "medium" || hyperRisk === "medium"
        ? "Moderate risk tomorrow — stay consistent with meds and meals."
        : "Low risk tomorrow — keep up your current routine.";

  return { hypoglycemiaRisk: hypoRisk, hyperglycemiaRisk: hyperRisk, summary, factors };
}

export function buildHealthMetrics(days: DayLog[], profile: UserProfile | null): HealthMetrics {
  const sugars = fastingValues(days);
  const current = days.length > 0 ? days[days.length - 1]?.fastingSugar ?? null : null;
  const weeklyAvg = sugars.length ? Math.round(sugars.reduce((a, b) => a + b, 0) / sugars.length) : null;

  const medsDays = days.filter((d) => d.medsTaken).length;
  const adherence = days.length > 0 ? Math.round((medsDays / days.length) * 100) : 0;

  const exerciseMinutes = days.reduce((s, d) => {
    const walkQuest = d.eveningSummary?.tomorrowsQuest?.toLowerCase().includes("walk") ? 15 : 0;
    return s + walkQuest;
  }, 0);

  return {
    currentGlucose: current,
    weeklyAverage: weeklyAvg,
    highestReading: sugars.length ? Math.max(...sugars) : null,
    lowestReading: sugars.length ? Math.min(...sugars) : null,
    hba1cEstimate: weeklyAvg ? estimateHbA1c(weeklyAvg) : null,
    daysInRange: days.filter((d) => d.fastingSugar && d.fastingSugar >= GLUCOSE_MIN && d.fastingSugar <= GLUCOSE_MAX).length,
    totalDays: days.length,
    mealsLogged: days.reduce((s, d) => s + d.meals.length, 0),
    medicationAdherence: adherence,
    exerciseMinutes: Math.min(exerciseMinutes + days.filter((d) => d.fastingSugar).length * 5, 150),
    waterGlasses: days.filter((d) => d.fastingSugar).length * 6,
    healthScore: computeHealthScore(days, profile),
    glucoseTrend: computeGlucoseTrend(days),
    monthImprovement: computeMonthImprovement(days),
  };
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
