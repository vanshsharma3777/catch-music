import { NextResponse } from "next/server";
import { db, feedback } from "@repo/db";
import { eq } from "drizzle-orm";
import { fail, requireUser } from "../../../lib/api/http";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  try {
    const rows = await db
      .select({ id: feedback.id })
      .from(feedback)
      .where(eq(feedback.userId, user.id))
      .limit(1);

    return NextResponse.json({ success: true, userId: user.id, hasReviewed: rows.length > 0 });
  } catch (error) {
    console.error("Error checking user feedback:", error);
    return fail(500, "Failed to check feedback");
  }
}
