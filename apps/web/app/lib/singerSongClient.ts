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

// ------------------------------------------------------------------
// Pagination (used by "Suggested for you" > See more)
// ------------------------------------------------------------------

// Ids already returned per singer. Used to drop repeats, and to stop paging
// if the server ignores `page` and keeps returning the same songs.
const pageSeen = new Map<string, Set<string>>();
const pageInflight = new Map<string, Promise<{ songs: Song[]; hasMore: boolean }>>();

/**
 * Page 1 reuses the cached getSingerSongs() path (instant on repeat visits).
 * Page 2+ always hits the network.
 * hasMore = the page came back full AND contained at least one new song.
 */
export async function getSingerSongsPage(
  name: string,
  page: number,
  limit: number = FETCH_LIMIT,
): Promise<{ songs: Song[]; hasMore: boolean }> {
  const nameKey = keyFor(name);

  if (page <= 1) {
    const songs = await getSingerSongs(name);
    pageSeen.set(nameKey, new Set(songs.map((s) => String(s.id))));
    // The route de-duplicates songs, so a page can be shorter than `limit`
    // even when more exist. Only stop when a page comes back empty.
    return { songs, hasMore: songs.length > 0 };
  }

  const reqKey = `${nameKey}:${page}`;
  const existing = pageInflight.get(reqKey);
  if (existing) return existing;

  const p = axios
    .post("/api/search/songs", { query: name.trim(), limit, page })
    .then((res) => {
      if (!res.data?.success || !Array.isArray(res.data.data)) {
        return { songs: [] as Song[], hasMore: false };
      }

      const raw: Song[] = res.data.data;
      const seen = pageSeen.get(nameKey) ?? new Set<string>();
      const songs: Song[] = [];

      for (const s of raw) {
        const id = String(s.id);
        if (!s.id || seen.has(id)) continue;
        seen.add(id);
        songs.push({ ...s, artistName: name });
      }
      pageSeen.set(nameKey, seen);

      // Keep going while pages still bring new songs. A page with nothing new
      // means the singer is exhausted (or the server ignored `page`).
      return { songs, hasMore: songs.length > 0 };
    })
    // No catch here on purpose: a failed request throws, so the caller keeps
    // hasMore = true and the user can press "See more" again.
    .finally(() => pageInflight.delete(reqKey));

  pageInflight.set(reqKey, p);
  return p;
}
