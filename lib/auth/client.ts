import "client-only";

import type { AuthSession } from "./types";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const API_BASE = (configuredBase || "/api/v1").replace(/\/$/, "");

export const SESSION_HINT_KEY = "isi_stasiun_session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function endpoint(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers,
      cache: "no-store",
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      0,
      "Backend belum dapat dijangkau. Periksa NEXT_PUBLIC_API_BASE_URL dan koneksi server.",
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // A proxy/hosting error may return HTML. Keep the status-specific message.
  }

  if (!response.ok || !envelope?.success || envelope.data === null) {
    throw new ApiError(
      response.status,
      envelope?.message || `Permintaan gagal (${response.status})`,
    );
  }

  return envelope.data;
}

export function loginRequest(email: string, password: string) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(email: string, password: string) {
  return apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

let refreshInFlight: Promise<AuthSession> | null = null;

export function refreshSessionRequest(): Promise<AuthSession> {
  if (!refreshInFlight) {
    refreshInFlight = apiRequest<AuthSession>("/auth/refresh", {
      method: "POST",
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function logoutRequest() {
  return apiRequest<Record<string, never>>("/auth/logout", { method: "POST" });
}
