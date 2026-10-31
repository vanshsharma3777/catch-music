import { NextRequest, NextResponse } from "next/server";
import { db, playlist, playlistSong } from "@repo/db";
import { count, eq } from "drizzle-orm";
import { asRecord, fail, readJson, requireUser } from "../../../lib/api/http";
import { LIMITS, checkImage, checkText, sanitizeSong } from "../../../lib/api/validation";
import { creatorOf, toSummary } from "../../../lib/api/playlists";
import type { Song } from "../../../types/songs";


export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const body = asRecord(await readJson(request));
  if (!body) return fail(400, "Invalid request body", "INVALID_BODY");

  const name = checkText(body.name, { label: "Playlist name", max: LIMITS.playlistName, required: true });
  if (!name.ok) return fail(400, name.error, "INVALID_NAME");

  const description = checkText(body.description, {
    label: "Description",
    max: LIMITS.playlistDescription,
    multiline: true,
  });
  if (!description.ok) return fail(400, description.error, "INVALID_DESCRIPTION");

  const image = checkImage(body.image);
  if (!image.ok) return fail(400, image.error, "INVALID_IMAGE");

  if (body.isPublic !== undefined && typeof body.isPublic !== "boolean") {
    return fail(400, "isPublic must be true or false", "INVALID_VISIBILITY");
  }

  if (!Array.isArray(body.songs)) return fail(400, "songs must be an array", "INVALID_SONGS");

  const seen = new Set<string>();
  const songs: Song[] = [];
  for (const raw of body.songs.slice(0, LIMITS.maxSongsPerPlaylist * 2)) {
    const s = sanitizeSong(raw);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    songs.push(s);
    if (songs.length >= LIMITS.maxSongsPerPlaylist) break;
  }
  if (songs.length === 0) return fail(400, "No valid songs to save", "INVALID_SONGS");

  try {
    const [{ total } = { total: 0 }] = await db
      .select({ total: count() })
      .from(playlist)
      .where(eq(playlist.userId, user.id));
    if (Number(total) >= LIMITS.maxPlaylistsPerUser) {
      return fail(409, `You can have at most ${LIMITS.maxPlaylistsPerUser} playlists`, "LIMIT_REACHED");
    }

    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(playlist)
        .values({
          playlistId: crypto.randomUUID(),
          name: name.value,
          description: description.value || null,
          image: image.value,
          isPublic: body.isPublic !== false,
          userId: user.id,
        })
        .returning();
      if (!row) throw new Error("Playlist insert failed");

      await tx
        .insert(playlistSong)
        .values(
          songs.map((s, i) => ({
            playListId: row.playlistId,
            songId: s.id,
            name: s.name,
            position: i,
            songData: s,
          }))
        )
        .onConflictDoNothing();

      return row;
    });

    const creator = await creatorOf(user.id);
    return NextResponse.json(
      {
        success: true,
        playlist: toSummary(created, {
          viewerId: user.id,
          isSaved: false,
          songCount: songs.length,
          previewImage: "",
          creatorName: creator.name,
          creatorImage: creator.image,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing playlist:", error);
    return fail(500, "Failed to save playlist");
  }
}