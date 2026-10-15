import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/authServer";
import { db, users, likedSong, playlist, savedPlaylist, offlineSongMeta } from "@repo/db";
import { eq, and, ne, count } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const [likesRes, createdRes, savedRes, offlineRes] = await Promise.all([
      db.select({ value: count() }).from(likedSong).where(eq(likedSong.userId, user.id)),
      db.select({ value: count() }).from(playlist).where(eq(playlist.userId, user.id)),
      db.select({ value: count() }).from(savedPlaylist).where(eq(savedPlaylist.userId, user.id)),
      db.select({ value: count() }).from(offlineSongMeta).where(eq(offlineSongMeta.userId, user.id)),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "Music Lover",
        username: user.username || "",
        email: user.email,
        image: user.image || "",
        createdAt: user.createdAt,
      },
      stats: {
        likedSongsCount: Number(likesRes[0]?.value || 0),
        createdPlaylistsCount: Number(createdRes[0]?.value || 0),
        savedPlaylistsCount: Number(savedRes[0]?.value || 0),
        offlineSongsCount: Number(offlineRes[0]?.value || 0),
      },
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, username, image } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Full name cannot be empty" },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: "Full name cannot exceed 100 characters" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (username !== undefined && username !== null && username.trim() !== "") {
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return NextResponse.json(
          {
            success: false,
            error: "Username must be 3-30 characters (letters, numbers, underscores only)",
          },
          { status: 400 }
        );
      }

      // Check uniqueness
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, cleanUsername), ne(users.id, user.id)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: "Username is already taken" },
          { status: 400 }
        );
      }

      updates.username = cleanUsername;
    } else if (username === "") {
      updates.username = null;
    }

    if (image !== undefined) {
      if (image !== null && typeof image === "string") {
        updates.image = image.trim();
      } else {
        updates.image = null;
      }
    }

    const updatedUsers = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();

    const updated = updatedUsers[0];

    return NextResponse.json({
      success: true,
      user: {
        id: updated?.id || user.id,
        name: updated?.name || user.name,
        username: updated?.username || "",
        email: updated?.email || user.email,
        image: updated?.image || "",
        createdAt: updated?.createdAt || user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
