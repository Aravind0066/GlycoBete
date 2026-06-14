import type { PrescriptionMed, WeeklyInsights } from "./types";
import {
  analyzeDayWithBackend,
  analyzeMealWithBackend,
  analyzeWeekWithBackend,
} from "./grokApi";

export interface MealAnalysis {
  meal_name: string;
  glycemic_level: "low" | "medium" | "high";
  explanation: string;
  indian_insight: string;
  xp_earned: number;
}

export async function analyzeMeal(meal: string, diabetesType: string): Promise<MealAnalysis> {
  try {
    const res = await analyzeMealWithBackend({
      foodDescription: `Patient type: ${diabetesType}. Meal: ${meal}`,
    });
    return {
      meal_name: meal.slice(0, 40) || "Mixed meal",
      glycemic_level: res.glycemicLevel,
      explanation: res.explanation,
      indian_insight: res.healthierAlternatives[0] || res.explanation,
      xp_earned: 30,
    };
  } catch {
    const lower = meal.toLowerCase();
    const high = /sugar|sweet|rice|jalebi|gulab|biryani|puri|samosa|chips|soda/.test(lower);
    const low = /salad|paneer|dal|sabzi|millet|ragi|moong/.test(lower);
    return {
      meal_name: meal.slice(0, 40) || "Mixed meal",
      glycemic_level: high ? "high" : low ? "low" : "medium",
      explanation:
        "Looks like a typical Indian meal. The carb load and fiber balance determines how quickly your sugar rises after eating.",
      indian_insight:
        "Try swapping white rice for millet (ragi or jowar) and add a side of curd to slow glucose absorption.",
      xp_earned: 30,
    };
  }
}

export interface DailySummary {
  control_status: "controlled" | "watch_out" | "alert";
  pattern_detected: string;
  tomorrows_quest: string;
  boss_progress: boolean;
}

export async function analyzeDay(args: {
  name: string;
  diabetesType: string;
  fasting: number | null;
  meals: { description: string; glycemicLevel: string }[];
  symptoms: string[];
  medsTaken: boolean;
}): Promise<DailySummary> {
  try {
    const res = await analyzeDayWithBackend(args);
    return {
      control_status: res.controlStatus,
      pattern_detected: res.patternDetected,
      tomorrows_quest: res.tomorrowsQuest,
      boss_progress: res.bossProgress,
    };
  } catch {
    const fasting = args.fasting ?? 0;
    const status: DailySummary["control_status"] = !args.fasting
      ? "watch_out"
      : fasting <= 140
        ? "controlled"
        : fasting > 180
          ? "alert"
          : "watch_out";
    const highMeal = args.meals.find((m) => m.glycemicLevel === "high");
    return {
      control_status: status,
      pattern_detected: highMeal
        ? `You ate ${highMeal.description.slice(0, 40)} which is a high glycemic meal — likely raised your sugar later.`
        : "Your day was balanced. Keep meal portions consistent for steady levels.",
      tomorrows_quest: "Walk for 15 minutes after lunch to flatten your post-meal sugar spike.",
      boss_progress: fasting >= 70 && fasting <= 140,
    };
  }
}

export async function analyzeWeek(week: unknown): Promise<WeeklyInsights> {
  const weekData = week as {
    days?: Array<{
      date: string;
      fastingSugar: number | null;
      meals: Array<{ description: string; glycemicLevel: string }>;
    }>;
  };

  const glucoseLogs = (weekData.days ?? []).map((day) => ({
    loggedAt: day.date,
    readingMgDl: day.fastingSugar,
  }));
  const mealLogs = (weekData.days ?? []).flatMap((day) =>
    day.meals.map((meal) => ({
      loggedAt: day.date,
      description: meal.description,
      glycemicLevel: meal.glycemicLevel,
    })),
  );

  try {
    const res = await analyzeWeekWithBackend({ glucoseLogs, mealLogs });
    return {
      weeklyNarrative: res.weeklySummary,
      bestDay: res.trends[0] || "Keep logging daily for clearer patterns.",
      worstDay: res.warnings[0] || "No major warning patterns this week.",
      topRecommendation: res.actionSuggestions[0] || "Log glucose at the same time daily.",
    };
  } catch {
    return {
      weeklyNarrative:
        "Your week shows steady tracking. Fasting numbers are mostly in range and your meal logging has been consistent — that consistency is the win.",
      bestDay: "Tuesday — fasting in range and balanced meals.",
      worstDay: "Friday — higher fasting reading after a heavier dinner.",
      topRecommendation: "Move dinner earlier and add a 10-minute walk after.",
    };
  }
}

export async function readPrescription(
  base64: string,
  mimeType: string,
): Promise<{ medications: PrescriptionMed[]; doctor_notes: string }> {
  try {
    const res = await analyzeMealWithBackend({
      image: {
        base64,
        mimeType: mimeType as "image/jpeg" | "image/jpg" | "image/png",
      },
      foodDescription:
        "This is a prescription image. Extract medication names, dosages, and doctor instructions.",
    });
    return {
      medications: [
        {
          name: "Prescription medication (review with doctor)",
          whatItDoes: res.explanation,
          whyYouTakeIt: "Follow your clinician's diabetes plan.",
          sideEffects: "Ask your doctor about common side effects.",
          ifYouMissDose: "Take as soon as you remember unless it is almost time for the next dose.",
        },
      ],
      doctor_notes: res.healthierAlternatives.join(" ") || res.explanation,
    };
  } catch {
    return {
      medications: [
        {
          name: "Metformin 500mg (example)",
          whatItDoes: "Helps your body use insulin better and lowers blood sugar.",
          whyYouTakeIt: "Most common first medication for Type 2 diabetes.",
          sideEffects: "Mild stomach upset, especially in the first week.",
          ifYouMissDose:
            "Take it as soon as you remember unless it's almost time for the next dose.",
        },
      ],
      doctor_notes: "Demo result — start the backend API to read real prescriptions.",
    };
  }
}
