import { getToken } from "./authStore";

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://catch-music.vercel.app"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Options = RequestInit & { auth?: boolean };

export async function api<T>(path: string, { auth = true, headers, ...init }: Options = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0, "NETWORK");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.error || `Request failed (${res.status})`, res.status, json?.code);
  }
  return json as T;
}