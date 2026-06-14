import {
  callGrokText,
  callGrokVision,
  GrokNotConfiguredError,
  parseJsonResponse,
} from "./grokClient.js";
import { MEDICAL_SAFETY_NOTE } from "./safety.js";

function fallbackMeal(input) {
  const description = input.foodDescription || "meal image";
  const high = /sugar|sweet|juice|soda|rice|biryani|puri|paratha|dessert|cake/i.test(description);
  const low = /salad|dal|paneer|curd|egg|fish|chicken|sprouts|millet|ragi|jowar/i.test(description);
  return {
    estimatedCarbs: high ? "45-75g" : low ? "15-35g" : "30-55g",
    sugarImpact: high ? "likely high" : low ? "likely low to moderate" : "likely moderate",
    glycemicLevel: high ? "high" : low ? "low" : "medium",
    healthierAlternatives: [
      "Add protein or curd to slow glucose rise.",
      "Keep rice or roti portions moderate.",
      "Walk 10 minutes after eating.",
    ],
    explanation:
      "This estimate is based on visible or described carbs, fiber, protein, and typical portion size.",
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function analyzeMeal(input) {
  const fallback = fallbackMeal(input);
  const system = `You are GlycoBete's Meal Analysis Agent.
Return only JSON with keys: estimatedCarbs string, sugarImpact string, glycemicLevel "low"|"medium"|"high", healthierAlternatives string[], explanation string, safetyDisclaimer string.
Prefer Indian food context when relevant. Do not diagnose.`;
  const prompt = `Analyze this meal for a diabetes-management app.
Food description: ${input.foodDescription || "No text description provided"}
Return practical estimates, not exact medical claims.
Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = input.image?.base64
      ? await callGrokVision({ system, prompt, image: input.image })
      : await callGrokText({ system, user: prompt });
    return { ...fallback, ...parseJsonResponse(text, fallback), source: "grok" };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    console.error("Meal agent failed:", error.message);
    return fallback;
  }
}
