import { useSyncExternalStore } from "react";
import { api } from "./api";
import type { Song } from "../types/song";

let ids = new Set<string>();
let loaded = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();

const emit = () => {
  ids = new Set(ids);
  subs.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};

/** Loads every liked id once (the home screen's syncLikes also marks it loaded). */
export function ensureLikesLoaded(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= api<{ likedSongIds?: string[] }>("/api/likes?limit=1")
    .then((d) => {
      ids = new Set((d.likedSongIds ?? []).map(String));
      loaded = true;
      emit();
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Loads all liked ids + the latest liked songs. */
export async function syncLikes(limit = 12): Promise<Song[]> {
  const d = await api<{ likedSongs: Song[]; likedSongIds: string[] }>(`/api/likes?limit=${limit}`);
  ids = new Set((d.likedSongIds ?? []).map(String));
  loaded = true;
  emit();
  return d.likedSongs ?? [];
}

export function resetLikes() {
  ids = new Set();
  loaded = false;
  emit();
}

export const getLikedCount = () => ids.size;

export function useIsLiked(songId: string | number): boolean {
  const id = String(songId);
  return useSyncExternalStore(subscribe, () => ids.has(id), () => false);
}

export function useLikedCount(): number {
  return useSyncExternalStore(subscribe, () => ids.size, () => 0);
}

function mark(id: string, liked: boolean) {
  if (liked) ids.add(id);
  else ids.delete(id);
  emit();
}

export async function toggleLike(song: Song): Promise<boolean> {
  const id = String(song.id);
  const next = !ids.has(id);
  mark(id, next);
  try {
    if (next) await api("/api/likes", { method: "POST", body: JSON.stringify({ song }) });
    else await api(`/api/likes?songId=${encodeURIComponent(id)}`, { method: "DELETE" });
    return next;
  } catch (e) {
    mark(id, !next);
    throw e;
  }
}