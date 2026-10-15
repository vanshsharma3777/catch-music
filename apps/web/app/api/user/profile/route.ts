import { NextRequest, NextResponse } from "next/server";
import { db, users, likedSong, playlist, savedPlaylist, offlineSongMeta } from "@repo/db";
import { and, count, eq, ne } from "drizzle-orm";
import { asRecord, fail, isUniqueViolation, readJson, requireUser, type CurrentUser } from "../../../lib/api/http";
import { LIMITS, checkImage, checkText, checkUsername } from "../../../lib/api/validation";
import { isPublicCondition } from "../../../lib/api/playlists";

function publicProfile(u: Pick<CurrentUser, "id" | "name" | "username" | "email" | "image" | "createdAt" | "favoriteSingers">) {
  return {
    id: u.id,
    name: u.name || "Music Lover",
    username: u.username || "",
    email: u.email,
    image: u.image || "",
    createdAt: u.createdAt,
    favoriteSingers: u.favoriteSingers ?? [],
  };
}

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  try {
    const [likesRes, createdRes, savedRes, offlineRes] = await Promise.all([
      db.select({ value: count() }).from(likedSong).where(eq(likedSong.userId, user.id)),
      db.select({ value: count() }).from(playlist).where(eq(playlist.userId, user.id)),
      // Count only playlists that are still visible, matching what the Saved tab lists.
      db
        .select({ value: count() })
        .from(savedPlaylist)
        .innerJoin(playlist, eq(savedPlaylist.playlistId, playlist.playlistId))
        .where(and(eq(savedPlaylist.userId, user.id), isPublicCondition)),
      db.select({ value: count() }).from(offlineSongMeta).where(eq(offlineSongMeta.userId, user.id)),
    ]);

    return NextResponse.json({
      success: true,
      user: publicProfile(user),
      stats: {
        likedSongsCount: Number(likesRes[0]?.value ?? 0),
        createdPlaylistsCount: Number(createdRes[0]?.value ?? 0),
        savedPlaylistsCount: Number(savedRes[0]?.value ?? 0),
        offlineSongsCount: Number(offlineRes[0]?.value ?? 0),
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return fail(500, "Failed to fetch profile");
  }
}

/** PUT /api/user/profile  { name?, username?, image? }  -- always edits the *session* user. */
export async function PUT(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = asRecord(await readJson(request));
  if (!body) return fail(400, "Invalid request body", "INVALID_BODY");

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (body.name !== undefined) {
    const name = checkText(body.name, { label: "Full name", max: LIMITS.userName, required: true });
    if (!name.ok) return fail(400, name.error, "INVALID_NAME");
    updates.name = name.value;
  }

  if (body.username !== undefined) {
    const username = checkUsername(body.username);
    if (!username.ok) return fail(400, username.error, "INVALID_USERNAME");
    if (username.value) {
      const taken = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, username.value), ne(users.id, user.id)))
        .limit(1);
      if (taken.length > 0) return fail(409, "Username is already taken", "USERNAME_TAKEN");
    }
    updates.username = username.value; // null clears it
  }

  if (body.image !== undefined) {
    const image = checkImage(body.image);
    if (!image.ok) return fail(400, image.error, "INVALID_IMAGE");
    updates.image = image.value;
  }

  try {
    const updated = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();
    const row = updated[0];
    if (!row) return fail(404, "User not found", "NOT_FOUND");
    return NextResponse.json({ success: true, user: publicProfile(row) });
  } catch (error) {
    // Two requests can both pass the pre-check; the unique index is the real guard.
    if (isUniqueViolation(error)) return fail(409, "Username is already taken", "USERNAME_TAKEN");
    console.error("Error updating profile:", error);
    return fail(500, "Failed to update profile");
  }
}
