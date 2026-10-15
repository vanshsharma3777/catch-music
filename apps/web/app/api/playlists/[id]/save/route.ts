import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/authServer";
import { db, playlist, savedPlaylist } from "@repo/db";
import { eq, or, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select()
      .from(playlist)
      .where(or(eq(playlist.playlistId, id), eq(playlist.id, id as any)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Playlist not found" },
        { status: 404 }
      );
    }

    const p = existing[0]!;
    if (p.userId === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot save your own playlist" },
        { status: 400 }
      );
    }

    if (!p.isPublic) {
      return NextResponse.json(
        { success: false, error: "Private playlists cannot be saved" },
        { status: 403 }
      );
    }

    // Check if already saved
    const alreadySaved = await db
      .select({ id: savedPlaylist.id })
      .from(savedPlaylist)
      .where(and(eq(savedPlaylist.userId, user.id), eq(savedPlaylist.playlistId, p.playlistId)))
      .limit(1);

    if (alreadySaved.length === 0) {
      await db.insert(savedPlaylist).values({
        userId: user.id,
        playlistId: p.playlistId,
      });
    }

    return NextResponse.json({
      success: true,
      isSaved: true,
      message: "Playlist saved to your library",
    });
  } catch (error: any) {
    console.error("Error saving playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save playlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const existing = await db
      .select()
      .from(playlist)
      .where(or(eq(playlist.playlistId, id), eq(playlist.id, id as any)))
      .limit(1);

    const playlistId = existing[0]?.playlistId || id;

    await db
      .delete(savedPlaylist)
      .where(and(eq(savedPlaylist.userId, user.id), eq(savedPlaylist.playlistId, playlistId)));

    return NextResponse.json({
      success: true,
      isSaved: false,
      message: "Playlist removed from saved playlists",
    });
  } catch (error: any) {
    console.error("Error removing saved playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove saved playlist" },
      { status: 500 }
    );
  }
}
