// app/lib/singerSongsClient.ts
import axios from "axios";
import { Song } from "../types/songs";

const FETCH_LIMIT = 25; // same for every page so the server cache is shared
const FRESH_MS = 30 * 60 * 1000; // show instantly, skip network
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // still show instantly, refresh quietly
const PREFIX = "catchmusic_singer_songs:v1:";

type Entry = { savedAt: number; songs: Song[] };

const inflight = new Map<string, Promise<Song[]>>();

const keyFor = (name: string) => PREFIX + name.trim().toLowerCase();

function readEntry(name: string): Entry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(name));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    if (!Array.isArray(entry.songs) || Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeEntry(name: string, songs: Song[]) {
  try {
    localStorage.setItem(keyFor(name), JSON.stringify({ savedAt: Date.now(), songs }));
  } catch {
    // storage full or unavailable: skip, the network path still works
  }
}

function fetchFromNetwork(name: string): Promise<Song[]> {
  const key = keyFor(name);
  const existing = inflight.get(key);
  if (existing) return existing; // identical request already running: share it

  const p = axios
    .post("/api/search/songs", { query: name.trim(), limit: FETCH_LIMIT })
    .then((res) => {
      if (!res.data?.success || !Array.isArray(res.data.data)) return [];
      const songs: Song[] = res.data.data.map((s: Song) => ({ ...s, artistName: name }));
      if (songs.length > 0) writeEntry(name, songs);
      return songs;
    })
    .catch(() => [] as Song[])
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}

/**
 * Stale-while-revalidate:
 *  - cached copy is passed to onData immediately (no waiting)
 *  - if it is older than 30 min (or missing) a fresh copy is fetched and
 *    passed to onData again when it arrives.
 */
export async function getSingerSongs(
  name: string,
  onData?: (songs: Song[], source: "cache" | "network") => void,
): Promise<Song[]> {
  const cached = readEntry(name);
  if (cached) {
    onData?.(cached.songs, "cache");
    if (Date.now() - cached.savedAt < FRESH_MS) return cached.songs;
  }
  const fresh = await fetchFromNetwork(name);
  if (fresh.length > 0) {
    onData?.(fresh, "network");
    return fresh;
  }
  return cached?.songs ?? [];
}

/** Fire-and-forget: warm the browser + server caches before the next page needs them. */
export function prefetchSingerSongs(names: string[]) {
  names.forEach((n) => {
    if (n && n.trim()) void getSingerSongs(n);
  });
}
