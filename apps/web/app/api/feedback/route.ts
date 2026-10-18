import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, feedback } from "@repo/db";
import { and, avg, count, desc, eq, gte } from "drizzle-orm";
import { asRecord, fail, readJson } from "../../lib/api/http";
import { getCurrentUser } from "../../lib/authServer";
import { LIMITS, checkText } from "../../lib/api/validation";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE = 20;
const MAX_PAGE = 50;
const MIN_MESSAGE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const LINK_RE = /(https?:\/\/|www\.)/i;

function ipHashOf(request: NextRequest): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  return createHash("sha256")
    .update(`${ip}:${process.env.NEXTAUTH_SECRET ?? ""}`)
    .digest("hex");
}
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const limit = Math.min(MAX_PAGE, Math.max(1, Number(params.get("limit")) || DEFAULT_PAGE));
  const offset = Math.max(0, Number(params.get("offset")) || 0);

  try {
    const [rows, stats] = await Promise.all([
      db
        .select({
          id: feedback.id,
          name: feedback.authorName,
          message: feedback.message,
          rating: feedback.rating,
          createdAt: feedback.createdAt,
        })
        .from(feedback)
        .where(eq(feedback.isVisible, true))
        .orderBy(desc(feedback.createdAt), desc(feedback.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count(), average: avg(feedback.rating) })
        .from(feedback)
        .where(eq(feedback.isVisible, true)),
    ]);

    const total = Number(stats[0]?.total ?? 0);
    const average = stats[0]?.average ? Number(Number(stats[0].average).toFixed(1)) : null;

    return NextResponse.json({
      success: true,
      feedback: rows,
      total,
      averageRating: average,
      hasMore: offset + rows.length < total,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return fail(500, "Failed to fetch feedback");
  }
}

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    return;
  }

  const body = asRecord(await readJson(request));
  if (!body) return fail(400, "Invalid request body", "INVALID_BODY");

  const message = checkText(body.message, {
    label: "Feedback",
    max: LIMITS.feedbackMessage,
    required: true,
    multiline: true,
  });
  if (!message.ok) return fail(400, message.error, "INVALID_MESSAGE");
  if (message.value.length < MIN_MESSAGE) {
    return fail(400, `Feedback must be at least ${MIN_MESSAGE} characters`, "INVALID_MESSAGE");
  }

  const name = checkText(body.name, { label: "Name", max: LIMITS.feedbackName });
  if (!name.ok) return fail(400, name.error, "INVALID_NAME");

  if (LINK_RE.test(message.value) || LINK_RE.test(name.value)) {
    return fail(400, "Links are not allowed in reviews", "LINKS_NOT_ALLOWED");
  }

  let rating: number | null = null;
  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return fail(400, "Rating must be a whole number from 1 to 5", "INVALID_RATING");
    }
    rating = body.rating;
  }

  const ipHash = ipHashOf(request);

  try {
    if (ipHash) {
      const since = new Date(Date.now() - DAY_MS);
      const recent = await db
        .select({ total: count() })
        .from(feedback)
        .where(and(eq(feedback.ipHash, ipHash), gte(feedback.createdAt, since)));
      if (Number(recent[0]?.total ?? 0) >= LIMITS.maxFeedbackPerIpPerDay) {
        return fail(429, "Too many reviews from your network today. Please try again later.", "RATE_LIMITED");
      }
    }

    if (user) {
      const mine = await db
        .select({ total: count() })
        .from(feedback)
        .where(eq(feedback.userId, user.id));
      if (Number(mine[0]?.total ?? 0) >= LIMITS.maxFeedbackPerUser) {
        return fail(429, "You have reached the review limit", "FEEDBACK_LIMIT");
      }
    }

    const [created] = await db
      .insert(feedback)
      .values({
        userId: user?.id ?? null,
        authorName: name.value || user?.name || user?.username || "Anonymous",
        message: message.value,
        rating,
        ipHash,
      })
      .returning({
        id: feedback.id,
        name: feedback.authorName,
        message: feedback.message,
        rating: feedback.rating,
        createdAt: feedback.createdAt,
      });

    return NextResponse.json({ success: true, feedback: created }, { status: 201 });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return fail(500, "Failed to submit feedback");
  }
}
