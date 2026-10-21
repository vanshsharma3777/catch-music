import { useSyncExternalStore } from "react";

/* ================= CONFIG ================= */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://catch-music.vercel.app"
).replace(/\/$/, "");

export const PATHS = {
  playlists: "/api/playlists",
  playlistSongs: (id: string) => `/api/playlists/${encodeURIComponent(id)}/songs`,
  likes: "/api/likes", // ⚠️ web ke likedStore.ts se match karo (neeche note dekho)
};

/* ================= fetch helper ================= */
async function request(path: string, init?: RequestInit) {
  const res = await fetch(API_BASE + path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers as any) },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { ok: res.ok, status: res.status, data };
}

/* ================= Playlists ================= */
export type PlaylistLite = { id: string; name: string; isPublic: boolean; songCount: number };

export async function fetchMyPlaylists(): Promise<PlaylistLite[]> {
  const r = await request(`${PATHS.playlists}?type=created`);
  if (!r.ok || !r.data?.success) throw new Error("Couldn't load your playlists");
  return (r.data.createdPlaylists ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    isPublic: !!p.isPublic,
    songCount: p.songCount ?? 0,
  }));
}

export async function createPlaylist(name: string, isPublic: boolean): Promise<{ id: string; name: string }> {
  const r = await request(PATHS.playlists, {
    method: "POST",
    body: JSON.stringify({ name, isPublic }),
  });
  const p = r.data?.playlist ?? r.data?.createdPlaylist ?? r.data?.data ?? r.data;
  if (!r.ok || !p?.id) throw new Error(r.data?.error || "Couldn't create playlist");
  return { id: p.id, name: p.name ?? name };
}

export async function addSongToPlaylist(id: string, song: any): Promise<"added" | "duplicate"> {
  const r = await request(PATHS.playlistSongs(id), {
    method: "POST",
    body: JSON.stringify({ song }),
  });
  if (r.ok) return "added";
  if (r.data?.code === "DUPLICATE_SONG") return "duplicate";
  throw new Error(r.data?.error || "Couldn't add song");
}

/* ================= Liked songs store ================= */
let liked = new Set<string>();
let likesLoaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export async function ensureLikesLoaded() {
  if (likesLoaded) return;
  try {
    const r = await request(PATHS.likes);
    if (!r.ok) return;
    const list: any[] = r.data?.songs ?? r.data?.likedSongs ?? r.data?.likes ?? [];
    liked = new Set(list.map((s) => String(s.id ?? s.songId)));
    likesLoaded = true;
    emit();
  } catch {
    /* offline: baad me retry hoga */
  }
}

export function useIsLiked(id: string | number | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => liked.has(String(id)),
    () => false
  );
}

/** returns new liked state; throws agar server fail kare (state revert ho jata hai) */
export async function toggleLike(song: any): Promise<boolean> {
  const id = String(song.id);
  const next = !liked.has(id);

  // optimistic update
  liked = new Set(liked);
  next ? liked.add(id) : liked.delete(id);
  emit();

  try {
    const r = next
      ? await request(PATHS.likes, { method: "POST", body: JSON.stringify({ song }) })
      : await request(`${PATHS.likes}?songId=${encodeURIComponent(id)}`, {
          method: "DELETE",
          body: JSON.stringify({ songId: id }),
        });
    if (!r.ok) throw new Error(r.data?.error || "Like failed");
    return next;
  } catch (e) {
    liked = new Set(liked);
    next ? liked.delete(id) : liked.add(id);
    emit();
    throw e;
  }
}