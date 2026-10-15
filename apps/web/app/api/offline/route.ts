import { NextRequest, NextResponse } from "next/server";
import { db, offlineSongMeta } from "@repo/db";
import { and, desc, eq } from "drizzle-orm";
import type { Song } from "../../types/songs";
import { asRecord, fail, readJson, requireUser } from "../../lib/api/http";
import { sanitizeSong } from "../../lib/api/validation";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  try {
    const records = await db
      .select()
      .from(offlineSongMeta)
      .where(eq(offlineSongMeta.userId, user.id))
      .orderBy(desc(offlineSongMeta.createdAt));

    const offlineSongs: Song[] = records.map((r) =>
      r.songData && typeof r.songData === "object"
        ? (r.songData as Song)
        : { id: r.songId, name: "Offline Track" }
    );

    return NextResponse.json({
      success: true,
      offlineSongs,
      songIds: records.map((r) => r.songId),
      items: records.map((r) => ({
        songId: r.songId,
        status: r.status,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching offline song metadata:", error);
    return fail(500, "Failed to fetch offline songs");
  }
}

/** POST /api/offline  { song, sizeBytes? }  -- register / update (idempotent). */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = asRecord(await readJson(request));
  const song = sanitizeSong(body?.song);
  if (!song) return fail(400, "A valid song (with an id) is required", "INVALID_SONG");

  const rawSize = body?.sizeBytes;
  const sizeBytes =
    typeof rawSize === "number" && Number.isFinite(rawSize) && rawSize >= 0 && rawSize < 2 ** 31
      ? Math.round(rawSize)
      : null;

  try {
    await db
      .insert(offlineSongMeta)
      .values({ userId: user.id, songId: song.id, songData: song, status: "downloaded", sizeBytes })
      .onConflictDoUpdate({
        target: [offlineSongMeta.userId, offlineSongMeta.songId],
        set: { songData: song, status: "downloaded", sizeBytes, updatedAt: new Date() },
      });

    return NextResponse.json({ success: true, songId: song.id });
  } catch (error) {
    console.error("Error registering offline song:", error);
    return fail(500, "Failed to register offline song");
  }
}

/** DELETE /api/offline?songId=  (idempotent). */
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
      .delete(offlineSongMeta)
      .where(and(eq(offlineSongMeta.userId, user.id), eq(offlineSongMeta.songId, songId)));

    return NextResponse.json({ success: true, songId });
  } catch (error) {
    console.error("Error deleting offline song metadata:", error);
    return fail(500, "Failed to delete offline song metadata");
  }
}
