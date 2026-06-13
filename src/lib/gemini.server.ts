import type { PrescriptionMed, WeeklyInsights } from "@/lib/types";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function getKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
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

export async function analyzeMealServer(
  meal: string,
  diabetesType: string,
): Promise<MealAnalysis> {
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

export async function analyzeDayServer(args: {
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

export async function analyzeWeekServer(week: unknown): Promise<WeeklyInsights> {
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
    const parsed = JSON.parse(text);
    return {
      weeklyNarrative: parsed.weekly_narrative ?? parsed.weeklyNarrative ?? "",
      bestDay: parsed.best_day ?? parsed.bestDay ?? "",
      worstDay: parsed.worst_day ?? parsed.worstDay ?? "",
      topRecommendation: parsed.top_recommendation ?? parsed.topRecommendation ?? "",
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

export async function readPrescriptionServer(
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
      doctor_notes: "Demo result — add GEMINI_API_KEY to read real prescriptions.",
    };
  }
}

export async function chatAssistantServer(args: {
  message: string;
  diabetesType: string;
  name: string;
  recentGlucose: number | null;
  history: { role: string; content: string }[];
}): Promise<string> {
  const context = args.recentGlucose
    ? `Their latest fasting glucose was ${args.recentGlucose} mg/dL.`
    : "No recent glucose reading available.";

  const historyText = args.history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `You are GlycoBete, a friendly diabetes health assistant for Indian patients. Patient: ${args.name}, ${args.diabetesType}. ${context}

Previous conversation:
${historyText || "None"}

User question: ${args.message}

Rules:
- Answer in 2-4 sentences, simple English
- Reference Indian foods when relevant (idli, dosa, roti, dal, etc.)
- Never diagnose or prescribe — suggest consulting a doctor for medical decisions
- Be encouraging and practical
- If asked about food, give glycemic impact estimate`;

  try {
    return await callGemini([{ text: prompt }], 800);
  } catch {
    const lower = args.message.toLowerCase();
    if (/mango|fruit|sweet/.test(lower)) {
      return "Mango is high in natural sugars — enjoy a small portion (half a mango) after a meal, not on an empty stomach. Pair it with protein like curd to slow absorption. Monitor your sugar 2 hours after eating.";
    }
    if (/breakfast|morning/.test(lower)) {
      return "A diabetes-friendly Indian breakfast: 2 idlis with sambar (low GI), or moong dal chilla with vegetables. Avoid white bread and sweet chai — try unsweetened tea with a handful of nuts.";
    }
    if (/increas|high|spike|why/.test(lower)) {
      return "Sugar spikes often happen after high-carb meals (white rice, sweets) or missed medication. Check if you ate within 2 hours of your last reading, and whether you took your meds on time. A 15-minute walk after meals helps significantly.";
    }
    if (/exercise|walk|yoga/.test(lower)) {
      return "Walking 20-30 minutes after meals is one of the best ways to lower post-meal glucose. Even 10 minutes helps. Avoid intense exercise if your sugar is below 70 mg/dL.";
    }
    return `Thanks for asking, ${args.name}! Based on your ${args.diabetesType} profile, focus on consistent meal timing, medication adherence, and daily fasting sugar logs. For specific medical advice, please consult your doctor.`;
  }
}

export async function dietRecommendationsServer(args: {
  name: string;
  diabetesType: string;
  age: string;
  avgGlucose: number | null;
}): Promise<{ breakfast: string; lunch: string; dinner: string; tips: string[] }> {
  const prompt = `You are a diabetes dietitian for Indian patients. Respond ONLY in this JSON format, no markdown:
{
  "breakfast": "specific Indian breakfast recommendation",
  "lunch": "specific Indian lunch recommendation",
  "dinner": "specific Indian dinner recommendation",
  "tips": ["tip 1", "tip 2", "tip 3"]
}
Patient: ${args.name}, ${args.diabetesType}, age ${args.age}. Average fasting glucose: ${args.avgGlucose ?? "unknown"} mg/dL.
Rules: Use common Indian foods. Low glycemic index focus. Simple English.`;

  try {
    const text = await callGemini([{ text: prompt }]);
    return JSON.parse(text);
  } catch {
    return {
      breakfast: "2 idlis with sambar + a small bowl of curd. Avoid sweet chai — try unsweetened tea.",
      lunch: "2 rotis with dal and mixed sabzi. Add a cucumber salad. Skip white rice or limit to 1/2 cup.",
      dinner: "Grilled paneer or fish with sautéed vegetables and 1 millet roti. Eat before 8 PM.",
      tips: [
        "Swap white rice for brown rice or millet 3x a week",
        "Walk 15 minutes after every meal",
        "Keep a handful of almonds for emergency low-sugar snacks",
      ],
    };
  }
}
