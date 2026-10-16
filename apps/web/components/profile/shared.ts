import type { Song } from "../../app/types/songs";

export interface FavoriteSinger {
  id: string;
  name: string;
  image?: string;
  genre?: string;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  createdAt?: string;
  favoriteSingers: FavoriteSinger[];
}

export interface PlaylistItem {
  id: string; // public playlistId, used by every /api/playlists/:id route
  name: string;
  description: string;
  image: string;
  previewImage: string;
  isPublic: boolean;
  songCount: number;
  creatorName: string;
  isOwner: boolean;
  isSaved: boolean;
}

export type PlaylistWithSongs = PlaylistItem & { songs: Song[] };

export interface Remote<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export const errMsg = (e: unknown) =>
  e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.";

/** fetch wrapper that understands the `{ success, error }` shape every Catch Music route returns. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}
