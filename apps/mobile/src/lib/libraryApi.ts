import { api, ApiError } from "./api";
import type { Song } from "../types/song";

export type PlaylistLite = { id: string; name: string; isPublic: boolean; songCount: number };

export async function fetchMyPlaylists(): Promise<PlaylistLite[]> {
  const d = await api<{ createdPlaylists?: any[] }>("/api/playlists?type=created");
  return (d.createdPlaylists ?? []).map((p) => ({
    id: String(p.id), // public playlistId, used by every /api/playlists/:id route
    name: String(p.name ?? "Untitled"),
    isPublic: p.isPublic !== false,
    songCount: Number(p.songCount ?? 0),
  }));
}

export async function createPlaylist(
  name: string,
  isPublic: boolean
): Promise<{ id: string; name: string }> {
  const d = await api<{ playlist?: { id: string; name: string } }>("/api/playlists", {
    method: "POST",
    body: JSON.stringify({ name, isPublic }),
  });
  if (!d.playlist?.id) throw new Error("Couldn't create playlist");
  return { id: d.playlist.id, name: d.playlist.name ?? name };
}

export async function addSongToPlaylist(playlistId: string, song: Song): Promise<"added" | "duplicate"> {
  try {
    await api(`/api/playlists/${encodeURIComponent(playlistId)}/songs`, {
      method: "POST",
      body: JSON.stringify({ song }),
    });
    return "added";
  } catch (e) {
    if (e instanceof ApiError && e.code === "DUPLICATE_SONG") return "duplicate";
    throw e;
  }
}

export async function removeSongFromPlaylist(playlistId: string, songId: string | number) {
  await api(
    `/api/playlists/${encodeURIComponent(playlistId)}/songs?songId=${encodeURIComponent(String(songId))}`,
    { method: "DELETE" }
  );
}