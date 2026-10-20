import { API_URL } from "../config/env";
import { getToken } from "./authStore";

type Options = RequestInit & { auth?: boolean };

export async function api<T>(path: string, { auth = true, headers, ...init }: Options = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}