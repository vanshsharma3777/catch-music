import { NextRequest, NextResponse } from "next/server";
import { db, savedPlaylist } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { fail, requireUser } from "../../../../lib/api/http";
import { findPlaylist } from "../../../../lib/api/playlists";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/playlists/:id/save -- save someone else's public playlist (idempotent). */
export async function POST(_request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const row = await findPlaylist(id);
    if (!row) return fail(404, "Playlist not found", "NOT_FOUND");

    if (row.userId === user.id) {
      return fail(400, "You can't save your own playlist - it's already in your library", "OWN_PLAYLIST");
    }
    if (row.isPublic === false) return fail(403, "Private playlists cannot be saved", "PRIVATE");

    // The unique (user, playlist) index makes concurrent double-saves harmless.
    await db
      .insert(savedPlaylist)
      .values({ userId: user.id, playlistId: row.playlistId })
      .onConflictDoNothing({ target: [savedPlaylist.userId, savedPlaylist.playlistId] });

    return NextResponse.json({ success: true, isSaved: true, message: "Playlist saved to your library" });
  } catch (error) {
    console.error("Error saving playlist:", error);
    return fail(500, "Failed to save playlist");
  }
}

/** DELETE /api/playlists/:id/save -- removes ONLY the caller's link; the playlist itself is untouched. */
export async function DELETE(_request: NextRequest, context: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { id } = await context.params;

  try {
    const row = await findPlaylist(id);
    // Works even if the playlist was deleted/hidden in the meantime: just drop the caller's link.
    const playlistId = row?.playlistId ?? id;

    await db
      .delete(savedPlaylist)
      .where(and(eq(savedPlaylist.userId, user.id), eq(savedPlaylist.playlistId, playlistId)));

    return NextResponse.json({ success: true, isSaved: false, message: "Playlist removed from saved playlists" });
  } catch (error) {
    console.error("Error removing saved playlist:", error);
    return fail(500, "Failed to remove saved playlist");
  }
}
