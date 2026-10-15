import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/authServer";
import { db, playlist, playlistSong } from "@repo/db";
import { eq, or, and, max } from "drizzle-orm";
import { Song } from "../../../../types/songs";

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
    if (p.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this playlist" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const song: Song = body.song;

    if (!song || !song.id) {
      return NextResponse.json(
        { success: false, error: "Song is required" },
        { status: 400 }
      );
    }

    const songId = String(song.id);

    // Check if song already exists in playlist
    const duplicate = await db
      .select({ id: playlistSong.id })
      .from(playlistSong)
      .where(and(eq(playlistSong.playListId, p.playlistId), eq(playlistSong.songId, songId)))
      .limit(1);

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, error: "Song is already in this playlist" },
        { status: 400 }
      );
    }

    // Get current max position
    const maxPosRes = await db
      .select({ maxPos: max(playlistSong.position) })
      .from(playlistSong)
      .where(eq(playlistSong.playListId, p.playlistId));

    const nextPosition = (maxPosRes[0]?.maxPos ?? -1) + 1;

    const inserted = await db
      .insert(playlistSong)
      .values({
        playListId: p.playlistId,
        songId,
        name: song.name || (song as any).title || "Untitled Track",
        position: nextPosition,
        songData: song,
      })
      .returning();

    // Update playlist updatedAt timestamp
    await db
      .update(playlist)
      .set({ updatedAt: new Date() })
      .where(eq(playlist.playlistId, p.playlistId));

    return NextResponse.json({
      success: true,
      song: inserted[0],
    });
  } catch (error: any) {
    console.error("Error adding song to playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add song to playlist" },
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

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: "Playlist not found" },
        { status: 404 }
      );
    }

    const p = existing[0]!;
    if (p.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this playlist" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let songId = searchParams.get("songId");

    if (!songId) {
      try {
        const body = await request.json();
        songId = body.songId;
      } catch {}
    }

    if (!songId) {
      return NextResponse.json(
        { success: false, error: "Song ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(playlistSong)
      .where(
        and(
          eq(playlistSong.playListId, p.playlistId),
          eq(playlistSong.songId, String(songId))
        )
      );

    await db
      .update(playlist)
      .set({ updatedAt: new Date() })
      .where(eq(playlist.playlistId, p.playlistId));

    return NextResponse.json({
      success: true,
      message: "Song removed from playlist",
    });
  } catch (error: any) {
    console.error("Error removing song from playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove song from playlist" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    if (p.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not own this playlist" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const songIds: string[] = body.songIds;

    if (!Array.isArray(songIds)) {
      return NextResponse.json(
        { success: false, error: "songIds array is required" },
        { status: 400 }
      );
    }

    // Update positions sequentially
    for (let i = 0; i < songIds.length; i++) {
      const sId = songIds[i];
      if (sId) {
        await db
          .update(playlistSong)
          .set({ position: i, updatedAt: new Date() })
          .where(
            and(
              eq(playlistSong.playListId, p.playlistId),
              eq(playlistSong.songId, String(sId))
            )
          );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Playlist songs reordered successfully",
    });
  } catch (error: any) {
    console.error("Error reordering playlist songs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder playlist songs" },
      { status: 500 }
    );
  }
}
