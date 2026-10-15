import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/authServer";
import { db, playlist, playlistSong, savedPlaylist, users } from "@repo/db";
import { eq, or, and, asc } from "drizzle-orm";
import { Song } from "../../../types/songs";

export async function GET(
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
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Playlist ID is required" },
      { status: 400 }
    );
  }

  try {
    const playlists = await db
      .select({
        id: playlist.playlistId,
        uuid: playlist.id,
        name: playlist.name,
        description: playlist.description,
        image: playlist.image,
        isPublic: playlist.isPublic,
        userId: playlist.userId,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        creatorName: users.name,
        creatorImage: users.image,
      })
      .from(playlist)
      .leftJoin(users, eq(playlist.userId, users.id))
      .where(or(eq(playlist.playlistId, id), eq(playlist.id, id as any)))
      .limit(1);

    if (playlists.length === 0) {
      return NextResponse.json(
        { success: false, error: "Playlist not found" },
        { status: 404 }
      );
    }

    const p = playlists[0]!;
    const isOwner = p.userId === user.id;

    if (!p.isPublic && !isOwner) {
      return NextResponse.json(
        { success: false, error: "This playlist is private" },
        { status: 403 }
      );
    }

    // Check if saved by current user
    const saved = await db
      .select({ id: savedPlaylist.id })
      .from(savedPlaylist)
      .where(and(eq(savedPlaylist.userId, user.id), eq(savedPlaylist.playlistId, p.id)))
      .limit(1);

    const isSaved = saved.length > 0;

    // Fetch songs
    const songRecords = await db
      .select()
      .from(playlistSong)
      .where(eq(playlistSong.playListId, p.id))
      .orderBy(asc(playlistSong.position), asc(playlistSong.createdAt));

    const songs: Song[] = [];
    for (const record of songRecords) {
      if (record.songData && typeof record.songData === "object") {
        songs.push(record.songData as Song);
      } else {
        songs.push({
          id: record.songId,
          name: record.name || "Untitled Track",
        });
      }
    }

    return NextResponse.json({
      success: true,
      playlist: {
        id: p.id,
        uuid: p.uuid,
        name: p.name,
        description: p.description || "",
        image: p.image || "",
        isPublic: p.isPublic !== false,
        creatorId: p.userId,
        creatorName: p.creatorName || (isOwner ? user.name || "You" : "Unknown Artist"),
        creatorImage: p.creatorImage || "",
        isOwner,
        isSaved,
        songCount: songs.length,
        songs,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch playlist" },
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
    const { name, description, image, isPublic } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Playlist name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? String(description).trim() : null;
    }

    if (image !== undefined) {
      updates.image = image ? String(image).trim() : null;
    }

    if (isPublic !== undefined) {
      updates.isPublic = Boolean(isPublic);
    }

    const updatedList = await db
      .update(playlist)
      .set(updates)
      .where(eq(playlist.playlistId, p.playlistId))
      .returning();

    return NextResponse.json({
      success: true,
      playlist: updatedList[0],
    });
  } catch (error: any) {
    console.error("Error updating playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update playlist" },
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

    await db.delete(playlist).where(eq(playlist.playlistId, p.playlistId));

    return NextResponse.json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
