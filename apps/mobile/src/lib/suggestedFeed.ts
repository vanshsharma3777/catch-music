import { useSyncExternalStore } from "react";
import type { Singer } from "../constants/singers";
import { fetchSingerPage } from "./singerSongs";
import { shuffle } from "./songHelpers";
import type { Song } from "../types/song";

type State = { songs: Song[]; loading: boolean };

let state: State = { songs: [], loading: true };
let key = "";
const listeners = new Set<() => void>();

const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

async function load(singers: Singer[]) {
  const lists = await Promise.all(singers.map((s) => fetchSingerPage(s.name, 1).catch(() => [] as Song[])));

  const mixed: Song[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    for (const idx of shuffle(lists.map((_, k) => k))) {
      const song = lists[idx]?.[i];
      if (song?.id && !seen.has(String(song.id))) {
        seen.add(String(song.id));
        mixed.push(song);
      }
    }
  }
  set({ songs: mixed.slice(0, 30), loading: false });
}

export const suggestedFeed = {
  /** Safe to call repeatedly: only reloads when the favourite artists change. */
  init(singers: Singer[]) {
    if (singers.length === 0) return;
    const k = singers.map((s) => s.id).join(",");
    if (k === key) return;
    key = k;
    set({ songs: [], loading: true });
    void load(singers);
  },
  refresh(singers: Singer[]) {
    key = "";
    this.init(singers);
  },
};

export function useSuggestedFeed(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}