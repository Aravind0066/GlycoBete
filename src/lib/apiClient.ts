type ApiEnvelope<T> = { data: T } | { error: string; details?: unknown };

export function getApiBaseUrl(): string {
  const configured = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_API_BASE_URL;
  if (configured?.trim()) return configured.replace(/\/$/, "");
  // Dev: same-origin requests are proxied to the Express API (see vite.config.ts).
  if (import.meta.env.DEV) return "";
  return "http://localhost:8081";
}

const fetchOptions: RequestInit = {
  credentials: "include",
};

const API_TIMEOUT_MS = 8000;
const API_UNREACHABLE =
  "Could not reach the GlycoBete API. Run `npm run dev:full` and open http://localhost:8080/login";

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...fetchOptions, ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "GlycoBete API timed out. Run `npm run dev:full` and open http://localhost:8080/login",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function postJson<T>(path: string, body: unknown = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(API_UNREACHABLE);
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

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(API_UNREACHABLE);
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`GlycoBete API returned an invalid response (${response.status}).`);
  }

  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload ? payload.error : "API request failed");
  }
  return payload.data;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch {
    throw new Error(API_UNREACHABLE);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (response.ok && payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  if (!response.ok) {
    const err = payload as { error?: string };
    throw new Error(err.error || "API request failed");
  }
  return payload as T;
}
