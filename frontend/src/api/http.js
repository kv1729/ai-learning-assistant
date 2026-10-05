import { ApiError } from "./errors.js";

// All requests go to /api on the same origin; in development Vite proxies
// /api to the FastAPI server (see vite.config.js).
const BASE = "/api";

export async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("network_error", "Can't reach the server. Check your connection and try again.", true);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      error?.code ?? "http_error",
      error?.message ?? `The server responded with ${response.status}.`,
      error?.retryable ?? response.status >= 500,
    );
  }
  return data;
}
