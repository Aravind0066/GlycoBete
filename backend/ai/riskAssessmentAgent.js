import { callGrokText, GrokNotConfiguredError, parseJsonResponse } from "./grokClient.js";
import { MEDICAL_SAFETY_NOTE } from "./safety.js";

function fallbackRiskAssessment(input) {
  const bmi =
    input.heightCm && input.weightKg ? input.weightKg / Math.pow(input.heightCm / 100, 2) : null;
  let score = 15;
  if (input.age >= 45) score += 15;
  if (bmi && bmi >= 25) score += 15;
  if (bmi && bmi >= 30) score += 10;
  if (input.familyHistory) score += 18;
  if (input.activityLevel === "sedentary") score += 15;
  if ((input.symptoms || []).length >= 2) score += 12;
  score = Math.min(100, score);

  return {
    riskScore: score,
    riskLevel: score >= 70 ? "high" : score >= 40 ? "moderate" : "low",
    explanation:
      "This estimate uses common diabetes risk signals such as age, weight, family history, symptoms, and activity level.",
    recommendations: [
      "Book an HbA1c or fasting glucose test if you have not tested recently.",
      "Walk for 10-15 minutes after your largest meal.",
      "Choose high-fiber carbs and pair them with protein.",
    ],
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function assessDiabetesRisk(input) {
  const fallback = fallbackRiskAssessment(input);
  const system = `You are GlycoBete's Diabetes Risk Assessment Agent.
Return only JSON with keys: riskScore number 0-100, riskLevel "low"|"moderate"|"high", explanation string, recommendations string[], safetyDisclaimer string.
Be careful, practical, and non-diagnostic.`;
  const user = `Assess diabetes risk from this profile:
${JSON.stringify(input)}
Rules:
- Do not diagnose.
- Mention what factors increased or lowered risk.
- Keep recommendations concrete and friendly.
- Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = await callGrokText({ system, user });
    return { ...fallback, ...parseJsonResponse(text, fallback), source: "grok" };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    console.error("Risk agent failed:", error.message);
    return fallback;
  }
}
