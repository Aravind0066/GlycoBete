import { callGrokText, GrokNotConfiguredError, parseJsonResponse } from "./grokClient.js";
import { MEDICAL_SAFETY_NOTE } from "./safety.js";

function fallbackInsights(input) {
  const readings = (input.glucoseLogs || [])
    .map((log) => Number(log.readingMgDl ?? log.reading_mg_dl ?? log.reading))
    .filter(Number.isFinite);
  const average = readings.length
    ? Math.round(readings.reduce((sum, reading) => sum + reading, 0) / readings.length)
    : null;
  const highCount = readings.filter((reading) => reading > 180).length;
  const lowCount = readings.filter((reading) => reading < 70).length;

  return {
    trends: [
      average ? `Average glucose is around ${average} mg/dL.` : "Not enough glucose data yet.",
      `${readings.length} glucose readings were available for review.`,
    ],
    warnings: [
      ...(highCount ? [`${highCount} readings were above 180 mg/dL.`] : []),
      ...(lowCount ? [`${lowCount} readings were below 70 mg/dL.`] : []),
    ],
    weeklySummary:
      readings.length > 0
        ? "You are building a useful glucose history. Keep logging at consistent times for better pattern detection."
        : "Start with daily fasting glucose logs to unlock stronger weekly insights.",
    actionSuggestions: [
      "Log glucose at the same time daily.",
      "Add meal notes when readings are unusually high or low.",
      "Discuss repeated highs or lows with a clinician.",
    ],
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function generateHealthInsights(input) {
  const fallback = fallbackInsights(input);
  const system = `You are GlycoBete's Health Insight Agent.
Analyze glucose logs and meal logs.
Return only JSON with keys: trends string[], warnings string[], weeklySummary string, actionSuggestions string[], safetyDisclaimer string.
Be cautious, non-diagnostic, and elderly-friendly.`;
  const user = `Analyze this historical data:
${JSON.stringify(input)}
Rules:
- Mention trends and warnings.
- Suggest practical next actions.
- Avoid medication changes.
- Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = await callGrokText({ system, user, maxOutputTokens: 900 });
    return { ...fallback, ...parseJsonResponse(text, fallback), source: "grok" };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    throw error;
  }
}
