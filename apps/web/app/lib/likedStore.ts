import { useSyncExternalStore } from "react";
import type { Song } from "../types/songs";

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

export function ensureLikesLoaded(): Promise<void> {
  if (loaded || typeof window === "undefined") return Promise.resolve();
  if (loading) return loading;
  loading = fetch("/api/likes?limit=1")
    .then((r) => r.json())
    .then((d) => {
      if (d?.success && Array.isArray(d.likedSongIds)) {
        ids = new Set(d.likedSongIds.map(String));
        loaded = true;
        emit();
      }
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Keep the store in sync when some other screen likes/unlikes. */
export function markLiked(songId: string | number, liked: boolean) {
  const id = String(songId);
  if (liked) ids.add(id);
  else ids.delete(id);
  emit();
}

export function useIsLiked(songId: string | number): boolean {
  const id = String(songId);
  return useSyncExternalStore(
    subscribe,
    () => ids.has(id),
    () => false
  );
}

/** Optimistic toggle. Throws (after reverting) if the API call fails. */
export async function toggleLike(song: Song): Promise<boolean> {
  const id = String(song.id);
  const next = !ids.has(id);
  markLiked(id, next);
  try {
    const res = next
      ? await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song }),
        })
      : await fetch(`/api/likes?songId=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Request failed");
    return next;
  } catch (e) {
    markLiked(id, !next);
    throw e;
  }
}
