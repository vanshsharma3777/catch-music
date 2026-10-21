import { api } from "./api";
import { readJson, writeJson } from "./storage";
import type { Song } from "../types/song";

const LIMIT = 25;
const FRESH_MS = 30 * 60 * 1000;
const PREFIX = "cm_singer_p1:v1:";

const memory = new Map<string, Song[]>();
const inflight = new Map<string, Promise<Song[]>>();

type Entry = { savedAt: number; songs: Song[] };

const keyOf = (name: string, page: number) => `${name.trim().toLowerCase()}|${page}`;

function unique(songs: Song[]): Song[] {
  const seen = new Set<string>();
  return songs.filter((s) => {
    if (!s?.id) return false;
    const id = String(s.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
export async function fetchSingerPage(name: string, page: number): Promise<Song[]> {
  const key = keyOf(name, page);

  const hit = memory.get(key);
  if (hit) return hit;

  let stale: Song[] | null = null;
  if (page === 1) {
    const stored = await readJson<Entry>(PREFIX + key);
    if (stored && Array.isArray(stored.songs) && stored.songs.length) {
      if (Date.now() - stored.savedAt < FRESH_MS) {
        memory.set(key, stored.songs);
        return stored.songs;
      }
      stale = stored.songs;
    }
  }

  const running = inflight.get(key);
  if (running) return running;

  const request = api<{ success: boolean; data: Song[] }>("/api/search/songs", {
    method: "POST",
    body: JSON.stringify({ query: name.trim(), limit: LIMIT, page }),
  })
    .then((res) => {
      const songs = unique(Array.isArray(res.data) ? res.data : []);
      if (songs.length) {
        memory.set(key, songs);
        if (page === 1) void writeJson(PREFIX + key, { savedAt: Date.now(), songs } satisfies Entry);
      }
      return songs;
    })
    .catch((err) => {
      if (stale) return stale; // offline or server hiccup: show what we had
      throw err;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}