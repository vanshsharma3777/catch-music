import { Singer } from "../constants/singers";
import { HomeUser, Song } from "../types/song";
import { api } from "./api";

/** Same route the website uses: POST /api/search/songs */
export async function fetchSingerSongs(name: string, page = 1, limit = 20): Promise<Song[]> {
  const res = await api<{ data?: Song[] }>("/api/search/songs", {
    method: "POST",
    body: JSON.stringify({ query: name, limit, page }),
  });
  return Array.isArray(res.data) ? res.data.filter((s) => s && s.id) : [];
}

export async function fetchPreferences(): Promise<{ singers: Singer[]; user: HomeUser | null }> {
  const res = await api<{ favoriteSingers?: Singer[]; user?: HomeUser }>("/api/user/preferences");
  return { singers: res.favoriteSingers ?? [], user: res.user ?? null };
}

/** Round-robin across lists so every artist shows up, no duplicates. */
export function mixSongs(lists: Song[][], limit: number): Song[] {
  const out: Song[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      const song = list[i];
      if (song && !seen.has(String(song.id))) {
        seen.add(String(song.id));
        out.push(song);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}