import { Song } from "../types/songs";

export type EntityType = "album" | "artist" | "playlist";
export type MiniType = "song" | EntityType;

export interface Mini {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: MiniType;
}

export interface SuggestResult {
  songs: Mini[];
  albums: Mini[];
  artists: Mini[];
  playlists: Mini[];
}

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

const namesOf = (a?: { primary?: { name: string }[] }) =>
  a?.primary?.map((x) => decode(x.name)).join(", ") ?? "";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Request failed");
  return json.data as T;
}

export const norm = (s: string) =>
    s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export function matchScore(text: string, q: string): number {
  const t = norm(text);
  const n = norm(q);
  if (!t || !n) return 0;
  if (t === n) return 100;
  if (t.startsWith(n)) return 85;
  if ((" " + t).includes(" " + n)) return 65;
  if (t.includes(n)) return 45;
  const tokens = n.split(" ");
  const hit = tokens.filter((k) => t.includes(k)).length;
  return Math.round((hit / tokens.length) * 40);
}

export function rankBy<T>(
  items: T[],
  q: string,
  title: (x: T) => string,
  sub?: (x: T) => string,
): T[] {
  return items
    .map((x, i) => ({
      x,
      i,
      s: matchScore(title(x), q) + (sub ? matchScore(sub(x), q) * 0.3 : 0),
    }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((o) => o.x);
}

const suggestCache = new Map<string, SuggestResult>();

export const peekSuggest = (q: string) => suggestCache.get(norm(q));

export async function fetchSuggest(q: string, signal?: AbortSignal): Promise<SuggestResult> {
  const key = norm(q);
  const hit = suggestCache.get(key);
  if (hit) return hit;

  const raw = await getJson<any>(
    `/api/discover?mode=suggest&q=${encodeURIComponent(q.trim())}`,
    signal,
  );

  const result: SuggestResult = {
    songs: (raw.songs ?? []).map((s: any) => ({
      id: String(s.id),
      title: decode(s.title),
      subtitle: decode(s.primaryArtists || s.singers || s.album),
      image: pickImage(s.image, "thumb"),
      type: "song" as const,
    })),
    artists: (raw.artists ?? []).map((a: any) => ({
      id: String(a.id),
      title: decode(a.title),
      subtitle: "Artist",
      image: pickImage(a.image, "thumb"),
      type: "artist" as const,
    })),
    albums: (raw.albums ?? []).map((a: any) => ({
      id: String(a.id),
      title: decode(a.title),
      subtitle: decode(a.artist) || "Album",
      image: pickImage(a.image, "thumb"),
      type: "album" as const,
    })),
    playlists: (raw.playlists ?? []).map((p: any) => ({
      id: String(p.id),
      title: decode(p.title),
      subtitle: "Playlist",
      image: pickImage(p.image, "thumb"),
      type: "playlist" as const,
    })),
  };

  suggestCache.set(key, result);
  if (suggestCache.size > 60) suggestCache.delete(suggestCache.keys().next().value as string);
  return result;
}


export async function searchSongs(q: string, page = 0, limit = 24) {
  const d = await getJson<{ results: Song[]; total: number }>(
    `/api/discover?mode=search&type=songs&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  );
  return { results: d.results ?? [], total: d.total ?? 0 };
}

export async function searchEntities(
  type: "albums" | "artists" | "playlists",
  q: string,
  limit = 12,
): Promise<Mini[]> {
  const d = await getJson<{ results: any[] }>(
    `/api/discover?mode=search&type=${type}&q=${encodeURIComponent(q)}&limit=${limit}`,
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
      return {
        id: String(r.id),
        title: decode(r.name),
        subtitle: "Artist",
        image: pickImage(r.image, "full"),
        type: "artist",
      };
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
    `/api/discover?mode=detail&type=${type}&id=${encodeURIComponent(id)}`,
  );
  return { songs: d.songs ?? [], name: d.name };
}

export async function getSongById(id: string): Promise<Song | null> {
  const d = await getJson<{ songs: Song[] }>(
    `/api/discover?mode=detail&type=songs&id=${encodeURIComponent(id)}`,
  );
  return d.songs?.[0] ?? null;
}
