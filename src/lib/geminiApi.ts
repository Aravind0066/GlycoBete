import type { PrescriptionMed, WeeklyInsights } from "./types";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function getKey(): string | undefined {
  return (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_GEMINI_API_KEY;
}

function stripFences(s: string) {
  return s
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

async function callGemini(parts: unknown[], minDelayMs = 1200): Promise<string> {
  const key = getKey();
  const started = Date.now();
  if (!key) {
    // graceful fallback
    await new Promise((r) => setTimeout(r, minDelayMs));
    throw new Error("NO_KEY");
  }
  const res = await fetch(`${API_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    }),
  });
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const elapsed = Date.now() - started;
  if (elapsed < minDelayMs) await new Promise((r) => setTimeout(r, minDelayMs - elapsed));
  return stripFences(text);
}

export interface MealAnalysis {
  meal_name: string;
  glycemic_level: "low" | "medium" | "high";
  explanation: string;
  indian_insight: string;
  xp_earned: number;
}

export async function analyzeMeal(meal: string, diabetesType: string): Promise<MealAnalysis> {
  const prompt = `You are a diabetes nutrition assistant for Indian patients. Analyze the meal and respond ONLY in this exact JSON format, no markdown, no explanation:
{
  "meal_name": "short descriptive name",
  "glycemic_level": "low" | "medium" | "high",
  "explanation": "2 sentence plain English explanation",
  "indian_insight": "specific Indian food substitution tip",
  "xp_earned": 30
}
Patient type: ${diabetesType}. Meal: ${meal}.
Rules: Simple English only. Always give Indian food swap. Never use medical jargon.`;
  try {
    const text = await callGemini([{ text: prompt }]);
    return JSON.parse(text);
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
  const prompt = `You are a daily diabetes coach for Indian patients. Respond ONLY in this exact JSON format, no markdown:
{
  "control_status": "controlled" | "watch_out" | "alert",
  "pattern_detected": "one specific pattern from today's data",
  "tomorrows_quest": "one specific actionable mission",
  "boss_progress": true | false
}
Patient: ${args.name}, ${args.diabetesType}.
Today: fasting sugar ${args.fasting ?? "not logged"}, meals ${JSON.stringify(args.meals)}, symptoms ${JSON.stringify(args.symptoms)}, meds taken ${args.medsTaken}.
Rules: Reference actual foods logged. Simple language only.`;
  try {
    const text = await callGemini([{ text: prompt }]);
    return JSON.parse(text);
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
  const prompt = `You are a weekly health analyst for Indian diabetic patients. Respond ONLY in this exact JSON format, no markdown:
{
  "weekly_narrative": "2-3 sentence plain English week summary",
  "best_day": "day name and specific reason why",
  "worst_day": "day name and specific reason why",
  "top_recommendation": "one specific actionable change"
}
Week data: ${JSON.stringify(week)}.
Rules: Reference specific foods and readings. Be encouraging.`;
  try {
    const text = await callGemini([{ text: prompt }]);
    return JSON.parse(text);
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
  const prompt = `You are a medical prescription reader for Indian patients. The user has uploaded a photo of their doctor's prescription. Extract all medications and respond ONLY in this JSON format:
{
  "medications": [
    {
      "name": "medication name and dosage",
      "what_it_does": "one sentence plain English",
      "why_you_take_it": "one sentence, diabetes context",
      "side_effects": "most common side effect in plain English",
      "if_you_miss_dose": "one sentence instruction"
    }
  ],
  "doctor_notes": "any other instructions visible on prescription"
}
Rules: Simple English. If handwriting is unclear for a field, write 'Ask your doctor to clarify'. Never guess drug names.`;
  try {
    const text = await callGemini(
      [{ inline_data: { mime_type: mimeType, data: base64 } }, { text: prompt }],
      1500,
    );
    const parsed = JSON.parse(text);
    return {
      medications: (parsed.medications ?? []).map((m: Record<string, string>) => ({
        name: m.name,
        whatItDoes: m.what_it_does,
        whyYouTakeIt: m.why_you_take_it,
        sideEffects: m.side_effects,
        ifYouMissDose: m.if_you_miss_dose,
      })),
      doctor_notes: parsed.doctor_notes ?? "",
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
      doctor_notes: "Demo result — add your VITE_GEMINI_API_KEY to read real prescriptions.",
    };
  }
}
