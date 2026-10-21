import { api } from "./api";
import type { EntityType, Mini, Song, SuggestResult } from "../types/song";

const decode = (s?: string) =>
  (s ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

export function pickImage(img: any, pref: "thumb" | "full" = "full"): string {
  if (Array.isArray(img)) {
    if (img.length === 0) return "";
    const i = pref === "thumb" ? Math.min(1, img.length - 1) : img.length - 1;
    return img[i]?.url || img[img.length - 1]?.url || "";
  }
  return typeof img === "string" ? img : "";
}

export function formatDuration(sec?: number | string): string {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return "";
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const namesOf = (a?: { primary?: { name: string }[] }) =>
  a?.primary?.map((x) => decode(x.name)).join(", ") ?? "";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await api<{ success: boolean; data: T }>(url, { signal });
  return res.data;
}

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Full Song (from songs search) -> row model. */
export function songToMini(s: Song): Mini {
  const album = typeof s.album === "string" ? s.album : s.album?.name;
  return {
    id: String(s.id),
    title: decode(s.name || s.title),
    subtitle: decode(s.primaryArtists || namesOf(s.artists) || s.artistName || album),
    image: pickImage(s.image, "thumb"),
    type: "song",
    duration: Number(s.duration) || undefined,
  };
}

const suggestCache = new Map<string, SuggestResult>();
export const peekSuggest = (q: string) => suggestCache.get(norm(q));

export async function fetchSuggest(q: string, signal?: AbortSignal): Promise<SuggestResult> {
  const key = norm(q);
  const hit = suggestCache.get(key);
  if (hit) return hit;

  const raw = await getJson<any>(`/api/discover?mode=suggest&q=${encodeURIComponent(q.trim())}`, signal);

  const result: SuggestResult = {
    songs: (raw.songs ?? []).map((s: any): Mini => ({
      id: String(s.id),
      title: decode(s.title),
      subtitle: decode(s.primaryArtists || s.singers || s.album),
      image: pickImage(s.image, "thumb"),
      type: "song",
    })),
    artists: (raw.artists ?? []).map((a: any): Mini => ({
      id: String(a.id),
      title: decode(a.title),
      subtitle: "Artist",
      image: pickImage(a.image, "thumb"),
      type: "artist",
    })),
    albums: (raw.albums ?? []).map((a: any): Mini => ({
      id: String(a.id),
      title: decode(a.title),
      subtitle: decode(a.artist) || "Album",
      image: pickImage(a.image, "thumb"),
      type: "album",
    })),
    playlists: (raw.playlists ?? []).map((p: any): Mini => ({
      id: String(p.id),
      title: decode(p.title),
      subtitle: "Playlist",
      image: pickImage(p.image, "thumb"),
      type: "playlist",
    })),
  };

  suggestCache.set(key, result);
  if (suggestCache.size > 60) suggestCache.delete(suggestCache.keys().next().value as string);
  return result;
}

export async function searchSongs(q: string, page = 0, limit = 24, signal?: AbortSignal) {
  const d = await getJson<{ results: Song[]; total: number }>(
    `/api/discover?mode=search&type=songs&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
    signal
  );
  return { results: d.results ?? [], total: d.total ?? 0 };
}

export async function searchEntities(
  type: "albums" | "artists" | "playlists",
  q: string,
  limit = 24,
  signal?: AbortSignal
): Promise<Mini[]> {
  const d = await getJson<{ results: any[] }>(
    `/api/discover?mode=search&type=${type}&q=${encodeURIComponent(q)}&limit=${limit}`,
    signal
  );
  return (d.results ?? []).map((r: any): Mini => {
    if (type === "albums") {
      return {
        id: String(r.id),
        title: decode(r.name),
        subtitle: namesOf(r.artists) || String(r.year ?? "Album"),
        image: pickImage(r.image, "full"),
        type: "album",
      };
    }
    if (type === "artists") {
      return { id: String(r.id), title: decode(r.name), subtitle: "Artist", image: pickImage(r.image, "full"), type: "artist" };
    }
    return {
      id: String(r.id),
      title: decode(r.name),
      subtitle: r.songCount ? `${r.songCount} songs` : "Playlist",
      image: pickImage(r.image, "full"),
      type: "playlist",
    };
  });
}

export async function getDetail(type: EntityType, id: string) {
  const d = await getJson<{ songs: Song[]; name?: string }>(
    `/api/discover?mode=detail&type=${type}&id=${encodeURIComponent(id)}`
  );
  return { songs: d.songs ?? [], name: d.name };
}

/** A suggestion row only has light data; this fetches the playable song. */
export async function getSongById(id: string): Promise<Song | null> {
  const d = await getJson<Song[] | { songs: Song[] }>(
    `/api/discover?mode=detail&type=songs&id=${encodeURIComponent(id)}`
  );
  const list = Array.isArray(d) ? d : d?.songs;
  return list?.[0] ?? null;
}