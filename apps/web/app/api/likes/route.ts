import { NextRequest, NextResponse } from "next/server";
import { db, likedSong } from "@repo/db";
import { and, count, desc, eq } from "drizzle-orm";
import type { Song } from "../../types/songs";
import { asRecord, fail, readJson, requireUser } from "../../lib/api/http";
import { sanitizeSong } from "../../lib/api/validation";

const DEFAULT_PAGE = 200;
const MAX_PAGE = 500;
const MAX_IDS = 20_000;

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const params = new URL(request.url).searchParams;
  const limit = Math.min(MAX_PAGE, Math.max(1, Number(params.get("limit")) || DEFAULT_PAGE));
  const offset = Math.max(0, Number(params.get("offset")) || 0);

  try {
    const [idRows, pageRows, totalRows] = await Promise.all([
      db
        .select({ songId: likedSong.songId })
        .from(likedSong)
        .where(eq(likedSong.userId, user.id))
        .orderBy(desc(likedSong.createdAt))
        .limit(MAX_IDS),
      db
        .select({ songId: likedSong.songId, songData: likedSong.songData })
        .from(likedSong)
        .where(eq(likedSong.userId, user.id))
        .orderBy(desc(likedSong.createdAt), desc(likedSong.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(likedSong).where(eq(likedSong.userId, user.id)),
    ]);

    const likedSongs: Song[] = pageRows.map((r) =>
      r.songData && typeof r.songData === "object"
        ? (r.songData as Song)
        : { id: r.songId, name: "Untitled Track" }
    );
    const total = Number(totalRows[0]?.total ?? 0);

    return NextResponse.json({
      success: true,
      likedSongs,
      likedSongIds: idRows.map((r) => r.songId),
      total,
      hasMore: offset + pageRows.length < total,
    });
  } catch (error) {
    console.error("Error fetching liked songs:", error);
    return fail(500, "Failed to fetch liked songs");
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = asRecord(await readJson(request));
  const song = sanitizeSong(body?.song);
  if (!song) return fail(400, "A valid song (with an id) is required", "INVALID_SONG");

  try {
    await db
      .insert(likedSong)
      .values({ userId: user.id, songId: song.id, songData: song })
      .onConflictDoUpdate({
        target: [likedSong.userId, likedSong.songId],
        set: { songData: song, updatedAt: new Date() },
      });

    return NextResponse.json({ success: true, isLiked: true, songId: song.id });
  } catch (error) {
    console.error("Error liking song:", error);
    return fail(500, "Failed to like song");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  let songId = new URL(request.url).searchParams.get("songId");
  if (!songId) {
    const body = asRecord(await readJson(request));
    if (typeof body?.songId === "string" || typeof body?.songId === "number") {
      songId = String(body.songId);
    }
  }
  if (!songId || songId.length > 200) return fail(400, "Song ID is required", "INVALID_SONG");

  try {
    await db
      .delete(likedSong)
      .where(and(eq(likedSong.userId, user.id), eq(likedSong.songId, songId)));

    return NextResponse.json({ success: true, isLiked: false, songId });
  } catch (error) {
    console.error("Error unliking song:", error);
    return fail(500, "Failed to unlike song");
  }
}
