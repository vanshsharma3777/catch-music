import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/authServer";
import { db, playlist, playlistSong, savedPlaylist, users } from "@repo/db";
import { eq, desc, inArray, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // "created", "saved", or "all"

  try {
    let createdList: any[] = [];
    let savedList: any[] = [];

    // 1. Fetch created playlists
    if (type === "created" || type === "all") {
      const createdPlaylists = await db
        .select()
        .from(playlist)
        .where(eq(playlist.userId, user.id))
        .orderBy(desc(playlist.createdAt));

      const playlistIds = createdPlaylists.map((p) => p.playlistId);

      // Get song counts
      const countsMap = new Map<string, number>();
      if (playlistIds.length > 0) {
        const counts = await db
          .select({
            playlistId: playlistSong.playListId,
            count: count(),
          })
          .from(playlistSong)
          .where(inArray(playlistSong.playListId, playlistIds))
          .groupBy(playlistSong.playListId);

        for (const c of counts) {
          if (c.playlistId) {
            countsMap.set(c.playlistId, Number(c.count));
          }
        }
      }

      createdList = createdPlaylists.map((p) => ({
        id: p.playlistId,
        uuid: p.id,
        name: p.name,
        description: p.description || "",
        image: p.image || "",
        isPublic: p.isPublic !== false,
        songCount: countsMap.get(p.playlistId) || 0,
        creatorName: user.name || "You",
        creatorId: user.id,
        isOwner: true,
        isSaved: false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    }

    // 2. Fetch saved playlists
    if (type === "saved" || type === "all") {
      const savedRecords = await db
        .select({
          savedId: savedPlaylist.id,
          savedAt: savedPlaylist.createdAt,
          playlistId: playlist.playlistId,
          uuid: playlist.id,
          name: playlist.name,
          description: playlist.description,
          image: playlist.image,
          isPublic: playlist.isPublic,
          creatorId: playlist.userId,
          creatorName: users.name,
          creatorImage: users.image,
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
        })
        .from(savedPlaylist)
        .innerJoin(playlist, eq(savedPlaylist.playlistId, playlist.playlistId))
        .leftJoin(users, eq(playlist.userId, users.id))
        .where(eq(savedPlaylist.userId, user.id))
        .orderBy(desc(savedPlaylist.createdAt));

      const savedPlaylistIds = savedRecords.map((r) => r.playlistId);

      const savedCountsMap = new Map<string, number>();
      if (savedPlaylistIds.length > 0) {
        const counts = await db
          .select({
            playlistId: playlistSong.playListId,
            count: count(),
          })
          .from(playlistSong)
          .where(inArray(playlistSong.playListId, savedPlaylistIds))
          .groupBy(playlistSong.playListId);

        for (const c of counts) {
          if (c.playlistId) {
            savedCountsMap.set(c.playlistId, Number(c.count));
          }
        }
      }

      savedList = savedRecords.map((r) => ({
        id: r.playlistId,
        uuid: r.uuid,
        name: r.name,
        description: r.description || "",
        image: r.image || "",
        isPublic: r.isPublic !== false,
        songCount: savedCountsMap.get(r.playlistId) || 0,
        creatorName: r.creatorName || "Unknown Artist",
        creatorId: r.creatorId,
        isOwner: false,
        isSaved: true,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    }

    return NextResponse.json({
      success: true,
      createdPlaylists: createdList,
      savedPlaylists: savedList,
      playlists: type === "saved" ? savedList : createdList,
    });
  } catch (error: any) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, image, isPublic } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Playlist name is required" },
        { status: 400 }
      );
    }

    const playlistId = crypto.randomUUID();

    const inserted = await db
      .insert(playlist)
      .values({
        playlistId,
        name: name.trim(),
        description: description ? String(description).trim() : null,
        image: image ? String(image).trim() : null,
        isPublic: isPublic !== false,
        userId: user.id,
      })
      .returning();

    const created = inserted[0];

    return NextResponse.json({
      success: true,
      playlist: {
        id: created!.playlistId,
        uuid: created!.id,
        name: created!.name,
        description: created!.description || "",
        image: created!.image || "",
        isPublic: created!.isPublic !== false,
        songCount: 0,
        creatorName: user.name || "You",
        creatorId: user.id,
        isOwner: true,
        isSaved: false,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
