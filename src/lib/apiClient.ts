type ApiEnvelope<T> = { data: T } | { error: string; details?: unknown };

export function getApiBaseUrl(): string {
  const configured = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_API_BASE_URL;
  if (configured?.trim()) return configured.replace(/\/$/, "");
  // Dev: same-origin requests are proxied to the Express API (see vite.config.ts).
  if (import.meta.env.DEV) return "";
  return "http://localhost:8081";
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Could not reach the GlycoBete API. Run `npm run backend:dev` and ensure VITE_API_BASE_URL is set or use the Vite dev proxy.",
    );
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`GlycoBete API returned an invalid response (${response.status}).`);
  }

  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload ? payload.error : "AI request failed");
  }
  return payload.data;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not reach the GlycoBete API.");
  }
  return (await response.json()) as T;
}
