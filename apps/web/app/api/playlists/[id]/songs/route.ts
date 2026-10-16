import { NextRequest, NextResponse } from "next/server";
import { db, playlist, playlistSong } from "@repo/db";
import { and, asc, count, eq, inArray, max, sql } from "drizzle-orm";
import { asRecord, fail, readJson, requireUser } from "../../../../lib/api/http";
import { LIMITS, sanitizeSong } from "../../../../lib/api/validation";
import { loadOwnedPlaylist } from "../../../../lib/api/playlists";

type Ctx = { params: Promise<{ id: string }> };

const lockPlaylist = (tx: Pick<typeof db, "select">, playlistId: string) =>
  tx.select({ id: playlist.id }).from(playlist).where(eq(playlist.playlistId, playlistId)).for("update");

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const owned = await loadOwnedPlaylist(id, user.id);
    if ("response" in owned) return owned.response;
    const p = owned.playlist;

    const body = asRecord(await readJson(request));
    const song = sanitizeSong(body?.song);
    if (!song) return fail(400, "A valid song (with an id) is required", "INVALID_SONG");

    const outcome = await db.transaction(async (tx) => {
      await lockPlaylist(tx, p.playlistId);

      const [{ total } = { total: 0 }] = await tx
        .select({ total: count() })
        .from(playlistSong)
        .where(eq(playlistSong.playListId, p.playlistId));
      if (Number(total) >= LIMITS.maxSongsPerPlaylist) return "full" as const;

      const [{ maxPos } = { maxPos: null }] = await tx
        .select({ maxPos: max(playlistSong.position) })
        .from(playlistSong)
        .where(eq(playlistSong.playListId, p.playlistId));

      const inserted = await tx
        .insert(playlistSong)
        .values({
          playListId: p.playlistId,
          songId: song.id,
          name: song.name,
          position: (maxPos ?? -1) + 1,
          songData: song,
        })
        .onConflictDoNothing({ target: [playlistSong.playListId, playlistSong.songId] })
        .returning({ id: playlistSong.id });

      if (inserted.length === 0) return "duplicate" as const;

      await tx.update(playlist).set({ updatedAt: new Date() }).where(eq(playlist.playlistId, p.playlistId));
      return "added" as const;
    });

    if (outcome === "full") {
      return fail(409, `A playlist can hold at most ${LIMITS.maxSongsPerPlaylist} songs`, "PLAYLIST_FULL");
    }
    if (outcome === "duplicate") return fail(409, "Song is already in this playlist", "DUPLICATE_SONG");

    return NextResponse.json({ success: true, songId: song.id }, { status: 201 });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return fail(500, "Failed to add song to playlist");
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const owned = await loadOwnedPlaylist(id, user.id);
    if ("response" in owned) return owned.response;
    const p = owned.playlist;

    let songId = new URL(request.url).searchParams.get("songId");
    if (!songId) {
      const body = asRecord(await readJson(request));
      if (typeof body?.songId === "string" || typeof body?.songId === "number") songId = String(body.songId);
    }
    if (!songId || songId.length > 200) return fail(400, "Song ID is required", "INVALID_SONG");
    const targetSongId = songId;

    const removed = await db.transaction(async (tx) => {
      const rows = await tx
        .delete(playlistSong)
        .where(and(eq(playlistSong.playListId, p.playlistId), eq(playlistSong.songId, targetSongId)))
        .returning({ id: playlistSong.id });
      if (rows.length > 0) {
        await tx.update(playlist).set({ updatedAt: new Date() }).where(eq(playlist.playlistId, p.playlistId));
      }
      return rows.length;
    });

    return NextResponse.json({ ok: true, removed, message: "Song removed from playlist" });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    return fail(500, "Failed to remove song from playlist");
  }
}

/**
 * PUT /api/playlists/:id/songs  { songIds: string[] } -- owner only. Reorders atomically.
 * Unknown ids are ignored; songs missing from the list keep their relative order at the end,
 * so a stale client can never drop or duplicate songs.
 */
export async function PUT(request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const owned = await loadOwnedPlaylist(id, user.id);
    if ("response" in owned) return owned.response;
    const p = owned.playlist;

    const body = asRecord(await readJson(request));
    const requested = body?.songIds;
    if (!Array.isArray(requested) || requested.length > LIMITS.maxReorderIds) {
      return fail(400, "songIds must be an array of song ids", "INVALID_ORDER");
    }
    const wanted = requested.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 200);

    await db.transaction(async (tx) => {
      await lockPlaylist(tx, p.playlistId);

      const existing = await tx
        .select({ songId: playlistSong.songId })
        .from(playlistSong)
        .where(eq(playlistSong.playListId, p.playlistId))
        .orderBy(asc(playlistSong.position), asc(playlistSong.createdAt), asc(playlistSong.id));

      const existingIds = existing.map((r) => r.songId);
      const known = new Set(existingIds);
      const seen = new Set<string>();
      const order: string[] = [];
      for (const sid of wanted) {
        if (known.has(sid) && !seen.has(sid)) {
          seen.add(sid);
          order.push(sid);
        }
      }
      for (const sid of existingIds) if (!seen.has(sid)) order.push(sid);
      if (order.length === 0) return;

      const cases = order.map((sid, i) => sql`WHEN ${sid} THEN ${i}::int`);
      await tx
        .update(playlistSong)
        .set({
          position: sql`CASE ${playlistSong.songId} ${sql.join(cases, sql` `)} END`,
          updatedAt: new Date(),
        })
        .where(and(eq(playlistSong.playListId, p.playlistId), inArray(playlistSong.songId, order)));

      await tx.update(playlist).set({ updatedAt: new Date() }).where(eq(playlist.playlistId, p.playlistId));
    });

    return NextResponse.json({ success: true, message: "Playlist songs reordered successfully" });
  } catch (error) {
    console.error("Error reordering playlist songs:", error);
    return fail(500, "Failed to reorder playlist songs");
  }
}
