import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3002",
  "http://127.0.0.1:3002",
]);

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.has(origin);

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? corsHeaders : { Vary: "Origin" },
    });
  }

  const res = NextResponse.next();
  if (allowed) {
    for (const [key, value] of Object.entries(corsHeaders)) res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};