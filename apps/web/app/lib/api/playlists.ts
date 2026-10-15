import { db, playlist, playlistSong, users } from "@repo/db";
import { asc, eq, inArray, isNull, or, count, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { fail } from "./http";
import { isUuid, songImageUrl } from "./validation";

export type PlaylistRow = typeof playlist.$inferSelect;

/**
 * Finds a playlist by its public `playlistId` or (when the id is a valid UUID) its row id.
 * Querying the uuid column with a non-UUID string makes Postgres throw, which used to surface as a 500.
 */
export async function findPlaylist(id: string): Promise<PlaylistRow | null> {
  const trimmed = (id ?? "").trim();
  if (!trimmed || trimmed.length > 200) return null;

  const match: SQL = isUuid(trimmed)
    ? (or(eq(playlist.playlistId, trimmed), eq(playlist.id, trimmed)) as SQL)
    : eq(playlist.playlistId, trimmed);

  const rows = await db.select().from(playlist).where(match).limit(1);
  return rows[0] ?? null;
}

/** `is_public` is nullable (default true): treat NULL as public. */
export const isPublicCondition = or(isNull(playlist.isPublic), eq(playlist.isPublic, true)) as SQL;

export interface PlaylistSummaryDTO {
  id: string;
  uuid: string;
  name: string;
  description: string;
  image: string;
  previewImage: string;
  isPublic: boolean;
  songCount: number;
  creatorName: string;
  creatorId: string | null;
  creatorImage: string;
  isOwner: boolean;
  isSaved: boolean;
  savedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Song counts and first-song artwork for many playlists in 2 queries total (no N+1). */
export async function loadCountsAndPreviews(playlistIds: string[]) {
  const counts = new Map<string, number>();
  const previews = new Map<string, string>();
  if (playlistIds.length === 0) return { counts, previews };

  const countRows = await db
    .select({ playlistId: playlistSong.playListId, total: count() })
    .from(playlistSong)
    .where(inArray(playlistSong.playListId, playlistIds))
    .groupBy(playlistSong.playListId);
  for (const row of countRows) if (row.playlistId) counts.set(row.playlistId, Number(row.total));

  const firstRows = await db
    .selectDistinctOn([playlistSong.playListId], {
      playlistId: playlistSong.playListId,
      songData: playlistSong.songData,
    })
    .from(playlistSong)
    .where(inArray(playlistSong.playListId, playlistIds))
    .orderBy(playlistSong.playListId, asc(playlistSong.position), asc(playlistSong.createdAt));
  for (const row of firstRows) {
    if (row.playlistId) previews.set(row.playlistId, songImageUrl(row.songData));
  }

  return { counts, previews };
}

export function toSummary(
  row: PlaylistRow,
  ctx: {
    viewerId: string;
    isSaved: boolean;
    songCount: number;
    previewImage: string;
    creatorName: string | null;
    creatorImage?: string | null;
    savedAt?: Date;
  }
): PlaylistSummaryDTO {
  const isOwner = row.userId === ctx.viewerId;
  return {
    id: row.playlistId,
    uuid: row.id,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
    previewImage: ctx.previewImage,
    isPublic: row.isPublic !== false,
    songCount: ctx.songCount,
    creatorName: ctx.creatorName || (isOwner ? "You" : "Unknown creator"),
    creatorId: row.userId,
    creatorImage: ctx.creatorImage ?? "",
    isOwner,
    isSaved: ctx.isSaved,
    ...(ctx.savedAt ? { savedAt: ctx.savedAt } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function creatorOf(userId: string | null) {
  if (!userId) return { name: null as string | null, image: null as string | null };
  const rows = await db
    .select({ name: users.name, username: users.username, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const u = rows[0];
  return { name: u?.name || u?.username || null, image: u?.image ?? null };
}


/**
 * Loads a playlist and verifies the caller owns it.
 * Non-owners get 403 for public playlists and 404 for private ones (don't leak existence).
 */
export async function loadOwnedPlaylist(
  id: string,
  userId: string
): Promise<{ playlist: PlaylistRow } | { response: NextResponse }> {
  const row = await findPlaylist(id);
  if (!row) return { response: fail(404, "Playlist not found", "NOT_FOUND") };
  if (row.userId !== userId) {
    return {
      response:
        row.isPublic === false
          ? fail(404, "Playlist not found", "NOT_FOUND")
          : fail(403, "You do not own this playlist", "FORBIDDEN"),
    };
  }
  return { playlist: row };
}
