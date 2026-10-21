import { useSyncExternalStore } from "react";
import { SINGER_DATABASE, type Singer } from "../constants/singers";
import { fetchSingerPage } from "./singerSongs";
import { shuffle } from "./songHelpers";
import type { Song } from "../types/song";

const START_SINGERS = 6; 
const MORE_SINGERS = 3; 
const MIN_BUFFER = 18;

type Pool = { singer: Singer; page: number; queue: Song[]; hasMore: boolean };

export type FeedState = {
  songs: Song[];
  loading: boolean; 
  fetching: boolean; 
  hasMore: boolean;
};

let state: FeedState = { songs: [], loading: true, fetching: false, hasMore: true };
let started = false;

const pools = new Map<string, Pool>();
const seen = new Set<string>();
const usedSingers = new Set<string>();
const listeners = new Set<() => void>();

const set = (patch: Partial<FeedState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

function pickSingers(n: number): Singer[] {
  const fresh = shuffle(SINGER_DATABASE.filter((s) => !usedSingers.has(s.id))).slice(0, n);
  fresh.forEach((s) => usedSingers.add(s.id));
  return fresh;
}

const computeHasMore = () =>
  [...pools.values()].some((p) => p.hasMore || p.queue.length > 0) ||
  usedSingers.size < SINGER_DATABASE.length;

function drain(): Song[] {
  const out: Song[] = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const pool of shuffle([...pools.values()])) {
      const song = pool.queue.shift();
      if (!song) continue;
      progressed = true;
      const id = String(song.id);
      if (!song.id || seen.has(id)) continue;
      seen.add(id);
      out.push(song);
    }
  }
  return out;
}

function publish() {
  const fresh = drain();
  if (fresh.length) set({ songs: [...state.songs, ...fresh] });
}

async function loadSingers(list: Singer[]) {
  await Promise.all(
    list.map(async (singer) => {
      const pool: Pool = { singer, page: 1, queue: [], hasMore: true };
      pools.set(singer.id, pool);
      try {
        const songs = await fetchSingerPage(singer.name, 1);
        pool.queue.push(...songs);
        pool.hasMore = songs.length > 0;
      } catch {
        pool.hasMore = false;
      }
      publish();
    })
  );
}

async function start() {
  set({ loading: true });
  await loadSingers(pickSingers(START_SINGERS));
  set({ loading: false, hasMore: computeHasMore() });
}

async function loadMore() {
  if (state.fetching) return;
  set({ fetching: true });
  try {
    const active = [...pools.values()].filter((p) => p.hasMore);

    if (active.length < MORE_SINGERS) await loadSingers(pickSingers(MORE_SINGERS));

    await Promise.all(
      active.map(async (pool) => {
        try {
          const songs = await fetchSingerPage(pool.singer.name, pool.page + 1);
          pool.page += 1;
          pool.queue.push(...songs.filter((s) => !seen.has(String(s.id))));
          pool.hasMore = songs.length > 0;
        } catch {
             }
      })
    );
    publish();
  } finally {
    set({ fetching: false, hasMore: computeHasMore() });
  }
}

export const discoverFeed = {
  init() {
    if (started) return;
    started = true;
    void start();
  },

  loadMore,
  ensureBuffer(shown: number) {
    if (state.fetching || state.loading || !state.hasMore) return;
    if (state.songs.length - shown < MIN_BUFFER) void loadMore();
  },

  refresh() {
    pools.clear();
    seen.clear();
    usedSingers.clear();
    state = { songs: [], loading: true, fetching: false, hasMore: true };
    listeners.forEach((l) => l());
    started = true;
    void start();
  },
};

export function useDiscoverFeed(): FeedState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}