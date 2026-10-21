import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../lib/audioEngine";
import { registerPlayHandler } from "../lib/playerBridge";
import type { Song } from "../types/song";
import type { EngineStatus, RepeatMode } from "../types/player";
import { getAudioUrl } from "../lib/songMeta";
import { getArtist, getImage, getTitle } from "../types/songMeta";
import { addRecentSong } from "../lib/recentSongs";
type PlayerState = {
  currentSong: Song | null;
  upNext: Song[];
  isPlaying: boolean;
  isBuffering: boolean;
  isShuffle: boolean;
  repeat: RepeatMode;
  expanded: boolean;
  hasNext: boolean;
  hasPrev: boolean;

  volume: number;
  isMuted: boolean;
};


type PlayerActions = {
  playSong: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  open: () => void;
  close: () => void;

  setVolume: (volume: number) => void;
  toggleMute: () => void;
};

type Progress = { position: number; duration: number };

const StateCtx = createContext<(PlayerState & PlayerActions) | null>(null);
const ProgressCtx = createContext<Progress>({ position: 0, duration: 0 });

const sameId = (a: Song, b: Song) => String(a.id) === String(b.id);

function makeOrder(len: number, shuffle: boolean, first: number): number[] {
  const idx = Array.from({ length: len }, (_, i) => i);
  if (!shuffle) return idx;
  const rest = idx.filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return [first, ...rest];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isShuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState<Progress>({ position: 0, duration: 0 });
  const [volume, setVolumeState] = useState(() => engine.getVolume());

const [isMuted, setIsMuted] = useState(false);

const previousVolume = useRef(volume > 0 ? volume : 1);

  const live = useRef({ queue, order, pos, repeat, isShuffle, position: 0 });
  live.current = { queue, order, pos, repeat, isShuffle, position: progress.position };
  const endedGuard = useRef(false);

  const currentSong = queue[order[pos] ?? -1] ?? null;

  const startAt = useCallback((q: Song[], o: number[], p: number) => {
    const song = q[o[p] ?? -1];
    if (!song) return;
    const url = getAudioUrl(song);
    setQueue(q);
    setOrder(o);
    setPos(p);
    setProgress({ position: 0, duration: Number(song.duration) || 0 });
    endedGuard.current = false;
    if (!url) {
      setIsPlaying(false);
      return;
    }
    engine.load(url, { title: getTitle(song), artist: getArtist(song), artwork: getImage(song) });
  }, []);

  const playSong = useCallback(
    (song: Song, list: Song[] = [song]) => {
      let q = list;
      let idx = q.findIndex((s) => sameId(s, song));
      if (idx === -1) {
        q = [song, ...list];
        idx = 0;
      }
      const shuffle = live.current.isShuffle;
      const o = makeOrder(q.length, shuffle, idx);
      startAt(q, o, shuffle ? 0 : idx);
    },
    [startAt]
  );

  const next = useCallback(
    (auto = false) => {
      const { queue: q, order: o, pos: p, repeat: r } = live.current;
      if (q.length === 0) return;
      if (p + 1 < o.length) return startAt(q, o, p + 1);
      if (r === "all") return startAt(q, o, 0);
      if (auto) {
        engine.stop();
        setIsPlaying(false);
      }
    },
    [startAt]
  );

  const prev = useCallback(() => {
    const { queue: q, order: o, pos: p, repeat: r, position } = live.current;
    if (q.length === 0) return;
    if (position > 3) return void engine.seek(0);
    if (p > 0) return startAt(q, o, p - 1);
    if (r === "all") return startAt(q, o, o.length - 1);
    engine.seek(0);
  }, [startAt]);

  const toggle = useCallback(() => {
    if (!live.current.queue.length) return;
    if (isPlaying) engine.pause();
    else engine.play();
  }, [isPlaying]);

  const seek = useCallback((s: number) => {
    engine.seek(s);
    setProgress((p) => ({ ...p, position: s }));
  }, []);

  const toggleShuffle = useCallback(() => {
    const { queue: q, order: o, pos: p, isShuffle: on } = live.current;
    const nowIdx = o[p] ?? 0;
    const turnOn = !on;
    setShuffle(turnOn);
    if (q.length === 0) return;
    setOrder(makeOrder(q.length, turnOn, nowIdx));
    setPos(turnOn ? 0 : nowIdx);
  }, []);

  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  );

  useEffect(() => {
    engine.onStatus((st: EngineStatus) => {
      setIsPlaying(st.playing);
      setIsBuffering(st.buffering);
      setProgress((p) => ({
        position: st.position,
        duration: st.duration > 0 ? st.duration : p.duration,
      }));

      if (st.ended && !endedGuard.current) {
        endedGuard.current = true;
        if (live.current.repeat === "one") {
          engine.seek(0);
          engine.play();
          setTimeout(() => (endedGuard.current = false), 800);
        } else {
          next(true);
        }
      }
    });
    return () => engine.onStatus(null);
  }, [next]);

  useEffect(() => {
  if (currentSong) {
    addRecentSong(currentSong);
  }
}, [currentSong]);

  useEffect(() => {
    registerPlayHandler((song, q) => playSong(song, q));
    return () => registerPlayHandler(null);
  }, [playSong]);

  const upNext = useMemo(
    () => order.slice(pos + 1, pos + 6).map((i) => queue[i]).filter(Boolean) as Song[],
    [order, pos, queue]
  );
  const setVolume = useCallback((value: number) => {
  const nextVolume = Math.max(0, Math.min(1, value));

  engine.setVolume(nextVolume);
  setVolumeState(nextVolume);
  setIsMuted(nextVolume === 0);

  if (nextVolume > 0) {
    previousVolume.current = nextVolume;
  }
}, []);

const toggleMute = useCallback(() => {
  if (isMuted || volume === 0) {
    const restoredVolume = previousVolume.current || 1;

    engine.setVolume(restoredVolume);
    setVolumeState(restoredVolume);
    setIsMuted(false);
  } else {
    previousVolume.current = volume;

    engine.setVolume(0);
    setVolumeState(0);
    setIsMuted(true);
  }
}, [isMuted, volume]);
  const value = useMemo(
  () => ({
    currentSong,
    upNext,
    isPlaying,
    isBuffering,
    isShuffle,
    repeat,
    expanded,

    hasNext: pos + 1 < order.length || repeat === "all",
    hasPrev: pos > 0 || repeat === "all",

    playSong,
    toggle,
    next: () => next(false),
    prev,
    seek,
    toggleShuffle,
    cycleRepeat,

    open: () => setExpanded(true),
    close: () => setExpanded(false),

    volume,
    isMuted,
    setVolume,
    toggleMute,
  }),
  [
    currentSong,
    upNext,
    isPlaying,
    isBuffering,
    isShuffle,
    repeat,
    expanded,
    pos,
    order.length,
    playSong,
    toggle,
    next,
    prev,
    seek,
    toggleShuffle,
    cycleRepeat,
    volume,
    isMuted,
    setVolume,
    toggleMute,
  ]
);

  return (
    <StateCtx.Provider value={value}>
      <ProgressCtx.Provider value={progress}>{children}</ProgressCtx.Provider>
    </StateCtx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export const usePlayerProgress = () => useContext(ProgressCtx);