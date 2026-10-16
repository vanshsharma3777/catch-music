import { NextRequest, NextResponse } from "next/server";
import { db, playlist, savedPlaylist, users } from "@repo/db";
import { count, desc, eq, and } from "drizzle-orm";
import { asRecord, fail, readJson, requireUser } from "../../lib/api/http";
import { LIMITS, checkImage, checkText } from "../../lib/api/validation";
import {
  creatorOf,
  isPublicCondition,
  loadCountsAndPreviews,
  toSummary,
  type PlaylistSummaryDTO,
} from "../../lib/api/playlists";

const MAX_LIST = 200;

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const type = new URL(request.url).searchParams.get("type") || "all";
  if (!["created", "saved", "all"].includes(type)) {
    return fail(400, "type must be created, saved or all", "INVALID_TYPE");
  }
  const wantCreated = type === "created" || type === "all";
  const wantSaved = type === "saved" || type === "all";

  try {
    const [createdRows, savedRows] = await Promise.all([
      wantCreated
        ? db
            .select()
            .from(playlist)
            .where(eq(playlist.userId, user.id))
            .orderBy(desc(playlist.updatedAt))
            .limit(MAX_LIST)
        : Promise.resolve([]),
      wantSaved
        ? db
            .select({
              row: playlist,
              savedAt: savedPlaylist.createdAt,
              creatorName: users.name,
              creatorUsername: users.username,
              creatorImage: users.image,
            })
            .from(savedPlaylist)
            .innerJoin(playlist, eq(savedPlaylist.playlistId, playlist.playlistId))
            .leftJoin(users, eq(playlist.userId, users.id))
            // If an owner later makes a playlist private, it disappears from other people's libraries.
            .where(and(eq(savedPlaylist.userId, user.id), isPublicCondition))
            .orderBy(desc(savedPlaylist.createdAt))
            .limit(MAX_LIST)
        : Promise.resolve([]),
    ]);

    const ids = [...createdRows.map((p) => p.playlistId), ...savedRows.map((r) => r.row.playlistId)];
    const { counts, previews } = await loadCountsAndPreviews(ids);

    const ownerName = user.name || user.username || "You";
    const createdPlaylists: PlaylistSummaryDTO[] = createdRows.map((p) =>
      toSummary(p, {
        viewerId: user.id,
        isSaved: false,
        songCount: counts.get(p.playlistId) ?? 0,
        previewImage: previews.get(p.playlistId) ?? "",
        creatorName: ownerName,
        creatorImage: user.image,
      })
    );
    const savedPlaylists: PlaylistSummaryDTO[] = savedRows.map((r) =>
      toSummary(r.row, {
        viewerId: user.id,
        isSaved: true,
        songCount: counts.get(r.row.playlistId) ?? 0,
        previewImage: previews.get(r.row.playlistId) ?? "",
        creatorName: r.creatorName || r.creatorUsername,
        creatorImage: r.creatorImage,
        savedAt: r.savedAt,
      })
    );

    return NextResponse.json({
      success: true,
      createdPlaylists,
      savedPlaylists,
      playlists: type === "saved" ? savedPlaylists : createdPlaylists,
    });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return fail(500, "Failed to fetch playlists");
  }
}

/** POST /api/playlists  { name, description?, image?, isPublic? } */
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

  try {
    const [{ total } = { total: 0 }] = await db
      .select({ total: count() })
      .from(playlist)
      .where(eq(playlist.userId, user.id));
    if (Number(total) >= LIMITS.maxPlaylistsPerUser) {
      return fail(409, `You can have at most ${LIMITS.maxPlaylistsPerUser} playlists`, "LIMIT_REACHED");
    }

    const [created] = await db
      .insert(playlist)
      .values({
        playlistId: crypto.randomUUID(),
        name: name.value,
        description: description.value || null,
        image: image.value,
        isPublic: body.isPublic !== false,
        userId: user.id, // always the session user, never a client-supplied id
      })
      .returning();
    if (!created) return fail(500, "Failed to create playlist");

    const creator = await creatorOf(user.id);
    return NextResponse.json(
      {
        success: true,
        playlist: toSummary(created, {
          viewerId: user.id,
          isSaved: false,
          songCount: 0,
          previewImage: "",
          creatorName: creator.name,
          creatorImage: creator.image,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating playlist:", error);
    return fail(500, "Failed to create playlist");
  }
}
