import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/authServer";
import { db, offlineSongMeta } from "@repo/db";
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
      .from(offlineSongMeta)
      .where(eq(offlineSongMeta.userId, user.id))
      .orderBy(desc(offlineSongMeta.createdAt));

    const songs: Song[] = [];
    const songIds: string[] = [];

    for (const record of records) {
      songIds.push(record.songId);
      if (record.songData && typeof record.songData === "object") {
        songs.push(record.songData as Song);
      } else {
        songs.push({
          id: record.songId,
          name: "Offline Track",
        });
      }
    }

    return NextResponse.json({
      success: true,
      offlineSongs: songs,
      songIds,
    });
  } catch (error: any) {
    console.error("Error fetching offline song metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offline songs" },
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

    const existing = await db
      .select({ id: offlineSongMeta.id })
      .from(offlineSongMeta)
      .where(
        and(
          eq(offlineSongMeta.userId, user.id),
          eq(offlineSongMeta.songId, songId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(offlineSongMeta).values({
        userId: user.id,
        songId,
        songData: song,
      });
    } else {
      await db
        .update(offlineSongMeta)
        .set({
          songData: song,
        })
        .where(eq(offlineSongMeta.id, existing[0]!.id));
    }

    return NextResponse.json({
      success: true,
      songId,
    });
  } catch (error: any) {
    console.error("Error registering offline song:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register offline song" },
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
      .delete(offlineSongMeta)
      .where(
        and(
          eq(offlineSongMeta.userId, user.id),
          eq(offlineSongMeta.songId, String(songId))
        )
      );

    return NextResponse.json({
      success: true,
      songId: String(songId),
    });
  } catch (error: any) {
    console.error("Error deleting offline song metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete offline song metadata" },
      { status: 500 }
    );
  }
}
