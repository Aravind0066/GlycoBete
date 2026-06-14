import {
  callGrokText,
  callGrokVision,
  GrokNotConfiguredError,
  parseJsonResponse,
} from "./grokClient.js";
import { MEDICAL_SAFETY_NOTE } from "./safety.js";

function fallbackExtract() {
  return {
    medicationsText:
      "Could not read the photo clearly. Type your medications manually or try a clearer, well-lit photo.",
    extractedItems: [],
    safetyDisclaimer: MEDICAL_SAFETY_NOTE,
    source: "fallback",
  };
}

export async function extractMedications(input) {
  const fallback = fallbackExtract();
  const system = `You are a prescription and medication label reader for Indian patients.
Return only JSON with keys:
- medicationsText string (plain list of med names, doses, frequency)
- extractedItems string[] (each item one medication line)
- safetyDisclaimer string
Use simple English. If unclear, say "Ask your doctor to clarify". Never guess drug names.`;

  const prompt = `Extract all visible medications from this image.
Format each as "Name dose — frequency".
Include this exact safety disclaimer: ${MEDICAL_SAFETY_NOTE}`;

  try {
    const text = input.image?.base64
      ? await callGrokVision({ system, prompt, image: input.image })
      : await callGrokText({ system, user: prompt });
    const parsed = parseJsonResponse(text, fallback);
    return {
      ...fallback,
      medicationsText: parsed.medicationsText || parsed.medications_text || fallback.medicationsText,
      extractedItems: parsed.extractedItems || parsed.extracted_items || fallback.extractedItems,
      safetyDisclaimer: parsed.safetyDisclaimer || MEDICAL_SAFETY_NOTE,
      source: "grok",
    };
  } catch (error) {
    if (error instanceof GrokNotConfiguredError) return fallback;
    console.error("Medication extract failed:", error.message);
    return fallback;
  }
}
