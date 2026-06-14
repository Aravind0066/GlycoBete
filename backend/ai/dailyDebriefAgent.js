import { callGrokText, GrokNotConfiguredError, parseJsonResponse } from "./grokClient.js";
import { MEDICAL_SAFETY_NOTE } from "./safety.js";

function fallbackDebrief(args) {
  const fasting = args.fasting ?? 0;
  const status = !args.fasting
    ? "watch_out"
    : fasting <= 140
      ? "controlled"
      : fasting > 180
        ? "alert"
        : "watch_out";
  const highMeal = (args.meals || []).find((meal) => meal.glycemicLevel === "high");

  return {
    controlStatus: status,
    patternDetected: highMeal
      ? `You ate ${highMeal.description.slice(0, 40)} which is a high glycemic meal — likely raised your sugar later.`
      : "Your day was balanced. Keep meal portions consistent for steady levels.",
    tomorrowsQuest: "Walk for 15 minutes after lunch to flatten your post-meal sugar spike.",
    bossProgress: fasting >= 70 && fasting <= 140,
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function generateDailyDebrief(args) {
  const fallback = fallbackDebrief(args);
  const system = `You are GlycoBete's daily diabetes debrief agent for Indian patients.
Return only JSON with keys: controlStatus "controlled"|"watch_out"|"alert", patternDetected string, tomorrowsQuest string, bossProgress boolean, safetyDisclaimer string.
Use simple language. Never diagnose or change medication.`;
  const user = `Patient: ${args.name}, ${args.diabetesType}.
Today: fasting sugar ${args.fasting ?? "not logged"}, meals ${JSON.stringify(args.meals || [])}, symptoms ${JSON.stringify(args.symptoms || [])}, meds taken ${args.medsTaken}.
Reference actual foods when possible.
Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = await callGrokText({ system, user, maxOutputTokens: 700 });
    const parsed = parseJsonResponse(text, fallback);
    return {
      ...fallback,
      controlStatus: parsed.controlStatus ?? parsed.control_status ?? fallback.controlStatus,
      patternDetected: parsed.patternDetected ?? parsed.pattern_detected ?? fallback.patternDetected,
      tomorrowsQuest: parsed.tomorrowsQuest ?? parsed.tomorrows_quest ?? fallback.tomorrowsQuest,
      bossProgress: parsed.bossProgress ?? parsed.boss_progress ?? fallback.bossProgress,
      safetyDisclaimer: parsed.safetyDisclaimer ?? MEDICAL_SAFETY_NOTE,
      source: "grok",
    };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    console.error("Daily debrief agent failed:", error.message);
    return fallback;
  }
}
