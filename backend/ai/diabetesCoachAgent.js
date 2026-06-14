import { callGrokText, GrokNotConfiguredError, parseJsonResponse } from "./grokClient.js";
import { hasUrgentSymptoms, MEDICAL_SAFETY_NOTE, urgentWarning } from "./safety.js";

function fallbackCoach(input) {
  const urgent = hasUrgentSymptoms(input.message);
  return {
    reply: urgent
      ? urgentWarning()
      : "A steady diabetes routine usually starts with small repeatable habits: log your glucose, pair carbs with protein or fiber, hydrate well, and add a short walk after meals. Tell me your food, reading, or goal and I can make it more specific.",
    suggestedActions: urgent
      ? ["Seek urgent medical advice", "Share current glucose reading with a caregiver"]
      : ["Log today's glucose", "Take a 10-minute post-meal walk", "Choose a lower-sugar drink"],
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function answerDiabetesCoach(input) {
  const fallback = fallbackCoach(input);
  const system = `You are GlycoBete's AI Diabetes Coach.
You answer food, exercise, diabetes education, and glucose-understanding questions.
Return only JSON with keys: reply string, suggestedActions string[], safetyDisclaimer string.
Never diagnose, prescribe, or change medication. Escalate urgent symptoms.`;
  const user = `User profile:
${JSON.stringify(input.profile || {})}

Conversation history:
${JSON.stringify(input.history || [])}

User message:
${input.message}

Use context when helpful. Keep language simple for elderly users.
Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = await callGrokText({ system, user, temperature: 0.35, maxOutputTokens: 900 });
    return { ...fallback, ...parseJsonResponse(text, fallback), source: "grok" };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    console.error("Coach agent failed:", error.message);
    return fallback;
  }
}
