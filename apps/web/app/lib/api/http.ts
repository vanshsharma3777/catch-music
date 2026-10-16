import { NextResponse } from "next/server";
import { getCurrentUser } from "../authServer";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Uniform error body: `{ success:false, error, code? }`. */
export function fail(status: number, error: string, code?: string) {
  return NextResponse.json({ success: false, error, ...(code ? { code } : {}) }, { status });
}

export async function requireUser(): Promise<{ user: CurrentUser } | { response: NextResponse }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { response: fail(401, "Unauthorized", "UNAUTHORIZED") };
    return { user };
  } catch (error) {
    console.error("Auth lookup failed:", error);
    return { response: fail(500, "Could not verify your session", "AUTH_ERROR") };
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** True for a Postgres unique-violation (SQLSTATE 23505), including errors wrapped by drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}
