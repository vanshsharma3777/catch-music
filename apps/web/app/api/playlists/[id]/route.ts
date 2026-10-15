import { NextRequest, NextResponse } from "next/server";
import { db, playlist, playlistSong, savedPlaylist } from "@repo/db";
import { and, asc, eq } from "drizzle-orm";
import type { Song } from "../../../types/songs";
import { asRecord, fail, readJson, requireUser } from "../../../lib/api/http";
import { LIMITS, checkImage, checkText } from "../../../lib/api/validation";
import {
  creatorOf,
  findPlaylist,
  loadCountsAndPreviews,
  loadOwnedPlaylist,
  toSummary,
} from "../../../lib/api/playlists";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/playlists/:id -- playlist + ordered songs. Private playlists are owner-only. */
export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const row = await findPlaylist(id);
    if (!row) return fail(404, "Playlist not found", "NOT_FOUND");

    const isOwner = row.userId === user.id;
    if (row.isPublic === false && !isOwner) return fail(403, "This playlist is private", "PRIVATE");

    const [creator, savedRows, songRows] = await Promise.all([
      creatorOf(row.userId),
      db
        .select({ id: savedPlaylist.id })
        .from(savedPlaylist)
        .where(and(eq(savedPlaylist.userId, user.id), eq(savedPlaylist.playlistId, row.playlistId)))
        .limit(1),
      db
        .select({ songId: playlistSong.songId, name: playlistSong.name, songData: playlistSong.songData })
        .from(playlistSong)
        .where(eq(playlistSong.playListId, row.playlistId))
        .orderBy(asc(playlistSong.position), asc(playlistSong.createdAt), asc(playlistSong.id)),
    ]);

    const songs: Song[] = songRows.map((r) =>
      r.songData && typeof r.songData === "object"
        ? (r.songData as Song)
        : { id: r.songId, name: r.name || "Untitled Track" }
    );

    return NextResponse.json({
      success: true,
      playlist: {
        ...toSummary(row, {
          viewerId: user.id,
          isSaved: savedRows.length > 0,
          songCount: songs.length,
          previewImage: "",
          creatorName: creator.name || (isOwner ? user.name : null),
          creatorImage: creator.image,
        }),
        songs,
      },
    });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return fail(500, "Failed to fetch playlist");
  }
}

/** PUT /api/playlists/:id  { name?, description?, image?, isPublic? } -- owner only. */
export async function PUT(request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const owned = await loadOwnedPlaylist(id, user.id);
    if ("response" in owned) return owned.response;
    const current = owned.playlist;

    const body = asRecord(await readJson(request));
    if (!body) return fail(400, "Invalid request body", "INVALID_BODY");

    const updates: Partial<typeof playlist.$inferInsert> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const name = checkText(body.name, { label: "Playlist name", max: LIMITS.playlistName, required: true });
      if (!name.ok) return fail(400, name.error, "INVALID_NAME");
      updates.name = name.value;
    }
    if (body.description !== undefined) {
      const description = checkText(body.description, {
        label: "Description",
        max: LIMITS.playlistDescription,
        multiline: true,
      });
      if (!description.ok) return fail(400, description.error, "INVALID_DESCRIPTION");
      updates.description = description.value || null;
    }
    if (body.image !== undefined) {
      const image = checkImage(body.image);
      if (!image.ok) return fail(400, image.error, "INVALID_IMAGE");
      updates.image = image.value;
    }
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== "boolean") {
        return fail(400, "isPublic must be true or false", "INVALID_VISIBILITY");
      }
      updates.isPublic = body.isPublic;
    }

    const [updated] = await db
      .update(playlist)
      .set(updates)
      .where(eq(playlist.playlistId, current.playlistId))
      .returning();
    if (!updated) return fail(404, "Playlist not found", "NOT_FOUND");

    const { counts, previews } = await loadCountsAndPreviews([updated.playlistId]);
    return NextResponse.json({
      success: true,
      playlist: toSummary(updated, {
        viewerId: user.id,
        isSaved: false,
        songCount: counts.get(updated.playlistId) ?? 0,
        previewImage: previews.get(updated.playlistId) ?? "",
        creatorName: user.name || user.username,
        creatorImage: user.image,
      }),
    });
  } catch (error) {
    console.error("Error updating playlist:", error);
    return fail(500, "Failed to update playlist");
  }
}

/**
 * DELETE /api/playlists/:id -- owner only.
 * FK cascades remove its songs and every user's saved-playlist link to it, and nothing else.
 */
export async function DELETE(_request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const owned = await loadOwnedPlaylist(id, user.id);
    if ("response" in owned) return owned.response;

    await db
      .delete(playlist)
      .where(and(eq(playlist.playlistId, owned.playlist.playlistId), eq(playlist.userId, user.id)));

    return NextResponse.json({ success: true, message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return fail(500, "Failed to delete playlist");
  }
}
