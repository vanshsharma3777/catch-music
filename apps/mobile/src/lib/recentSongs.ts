import { useSyncExternalStore } from "react";
import type { Song } from "../types/song";
import { readJson, writeJson, removeKey } from "./storage";

const KEY = "catchmusic_recent_songs";
const MAX = 30;

let list: Song[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export async function hydrateRecent() {
  if (hydrated) return;
  hydrated = true;
  const stored = await readJson<Song[]>(KEY);
  if (Array.isArray(stored)) {
    const known = new Set(list.map((s) => String(s.id)));
    list = [...list, ...stored.filter((s) => s && s.id && !known.has(String(s.id)))].slice(0, MAX);
    emit();
  }
}

export function addRecentSong(song: Song) {
  if (!song?.id) return;
  const id = String(song.id);
  list = [song, ...list.filter((s) => String(s.id) !== id)].slice(0, MAX);
  emit();
  void writeJson(KEY, list);
}

export function clearRecentSongs() {
  list = [];
  emit();
  void removeKey(KEY);
}

export function useRecentSongs(): Song[] {
  return useSyncExternalStore(subscribe, () => list, () => list);
}