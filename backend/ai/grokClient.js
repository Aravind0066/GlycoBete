const XAI_BASE_URL = "https://api.x.ai/v1";

export class GrokNotConfiguredError extends Error {
  constructor() {
    super("XAI_API_KEY or GROK_API_KEY is not configured");
    this.name = "GrokNotConfiguredError";
  }
}

function getApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY;
}

function getTextModel() {
  return process.env.XAI_MODEL || process.env.GROK_MODEL || "grok-2-1212";
}

function getVisionModel() {
  return process.env.XAI_VISION_MODEL || process.env.GROK_VISION_MODEL || "grok-2-vision-1212";
}

function stripJsonFences(value) {
  return value
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

export function parseJsonResponse(text, fallback) {
  try {
    return JSON.parse(stripJsonFences(text));
  } catch {
    return fallback;
  }
}

export async function callGrokText({ system, user, temperature = 0.25, maxOutputTokens = 800 }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new GrokNotConfiguredError();

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getTextModel(),
      temperature,
      max_tokens: maxOutputTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Grok request failed");
  }

  return payload?.choices?.[0]?.message?.content ?? "";
}

export async function callGrokVision({
  system,
  prompt,
  image,
  temperature = 0.2,
  maxOutputTokens = 900,
}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new GrokNotConfiguredError();

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getVisionModel(),
      temperature,
      max_tokens: maxOutputTokens,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${image.mimeType};base64,${image.base64}`,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Grok vision request failed");
  }

  return payload?.choices?.[0]?.message?.content ?? "";
}
