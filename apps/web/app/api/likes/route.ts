import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/authServer";
import { db, likedSong } from "@repo/db";
import { eq, and, desc } from "drizzle-orm";
import { Song } from "../../types/songs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const records = await db
      .select()
      .from(likedSong)
      .where(eq(likedSong.userId, user.id))
      .orderBy(desc(likedSong.createdAt));

    const songs: Song[] = [];
    const likedSongIds: string[] = [];

    for (const record of records) {
      likedSongIds.push(record.songId);
      if (record.songData && typeof record.songData === "object") {
        songs.push(record.songData as Song);
      } else {
        songs.push({
          id: record.songId,
          name: "Untitled Track",
        });
      }
    }

    return NextResponse.json({
      success: true,
      likedSongs: songs,
      likedSongIds,
    });
  } catch (error: any) {
    console.error("Error fetching liked songs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch liked songs" },
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
    const song: Song = body.song;

    if (!song || !song.id) {
      return NextResponse.json(
        { success: false, error: "Song ID is required" },
        { status: 400 }
      );
    }

    const songId = String(song.id);

    // Check if already liked
    const existing = await db
      .select({ id: likedSong.id })
      .from(likedSong)
      .where(and(eq(likedSong.userId, user.id), eq(likedSong.songId, songId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(likedSong).values({
        userId: user.id,
        songId,
        songData: song,
      });
    } else {
      await db
        .update(likedSong)
        .set({
          songData: song,
          updatedAt: new Date(),
        })
        .where(eq(likedSong.id, existing[0]!.id));
    }

    return NextResponse.json({
      success: true,
      isLiked: true,
      songId,
    });
  } catch (error: any) {
    console.error("Error liking song:", error);
    return NextResponse.json(
      { success: false, error: "Failed to like song" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
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
      .delete(likedSong)
      .where(and(eq(likedSong.userId, user.id), eq(likedSong.songId, String(songId))));

    return NextResponse.json({
      success: true,
      isLiked: false,
      songId: String(songId),
    });
  } catch (error: any) {
    console.error("Error unliking song:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unlike song" },
      { status: 500 }
    );
  }
}
