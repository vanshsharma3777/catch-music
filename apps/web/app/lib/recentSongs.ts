import { Song } from "../types/songs";

const RECENT_SONGS_KEY = "catchmusic_recent_songs";
const MAX_RECENT_SONGS = 25;

export function getRecentSongs(): Song[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(RECENT_SONGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read recent songs from localStorage:", err);
    return [];
  }
}

export function addRecentSong(song: Song): Song[] {
  if (typeof window === "undefined" || !song || !song.id) {
    return [];
  }

  try {
    const current = getRecentSongs();
    const songId = String(song.id);

    // Filter out if already in list to move it to the very top
    const filtered = current.filter((s) => String(s.id) !== songId);

    const updated = [song, ...filtered].slice(0, MAX_RECENT_SONGS);
    localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to save recent song to localStorage:", err);
    return [];
  }
}

export function clearRecentSongs(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SONGS_KEY);
  } catch (err) {
    console.error("Failed to clear recent songs:", err);
  }
}
