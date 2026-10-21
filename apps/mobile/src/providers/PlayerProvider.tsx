import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import type { Song } from "../types/song";
import {
  getArtistName,
  getAudioUrl,
  getSongImage,
  getSongTitle,
  sameSong,
} from "../lib/songHelpers";
import { addRecentSong, hydrateRecent } from "../lib/recentSongs";

export type RepeatMode = "off" | "all" | "one";

type PlayerContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0..1
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  fullOpen: boolean;

  playSong: (song: Song, list?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFull: () => void;
  closeFull: () => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

/** replace() ke baad player volume/mute reset kar deta hai, isliye har baar dobara lagate hain */
function applyVolume(player: AudioPlayer, vol: number, muted: boolean) {
  if (Math.abs(player.volume - vol) > 0.001) player.volume = vol;
  if (player.muted !== muted) player.muted = muted;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [queue, setQueue] = useState<Song[]>([]);
  const [fullOpen, setFullOpen] = useState(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const historyRef = useRef<Song[]>([]);
  const volumeRef = useRef(0.85);
  const mutedRef = useRef(false);

  // "starting" = play dabaya gaya hai par audio abhi asli me shuru nahi hua.
  // Is dauran status updates ke `playing: false` ko ignore karte hain (button flicker fix).
  const startingRef = useRef(false);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markStarting = useCallback(() => {
    startingRef.current = true;
    if (startTimer.current) clearTimeout(startTimer.current);
    // safety: load fail ho jaye to button hamesha ke liye atka na rahe
    startTimer.current = setTimeout(() => {
      startingRef.current = false;
    }, 8000);
  }, []);

  const clearStarting = useCallback(() => {
    startingRef.current = false;
    if (startTimer.current) clearTimeout(startTimer.current);
  }, []);

  const live = useRef({ currentSong, isPlaying, currentTime, queue, isShuffle, repeatMode });
  live.current = { currentSong, isPlaying, currentTime, queue, isShuffle, repeatMode };

  const endedRef = useRef<() => void>(() => {});

  useEffect(() => {
    void hydrateRecent();
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});

    const player = createAudioPlayer(null);
    player.volume = 0.85;
    playerRef.current = player;

    const sub = player.addListener("playbackStatusUpdate", (s) => {
      applyVolume(player, volumeRef.current, mutedRef.current);

      // audio asli me chal pada (ya khatam hua) => "starting" khatam
      if (s.playing || s.didJustFinish) clearStarting();

      setCurrentTime(s.currentTime ?? 0);
      if (s.duration && s.duration > 0) setDuration(s.duration);
      setIsPlaying(startingRef.current ? true : !!s.playing);
      setIsBuffering(startingRef.current ? true : !!s.isBuffering);
      if (s.didJustFinish) endedRef.current();
    });

    return () => {
      sub.remove();
      if (startTimer.current) clearTimeout(startTimer.current);
      try {
        player.release();
      } catch {}
      playerRef.current = null;
    };
  }, [clearStarting]);

  const startTrack = useCallback(
    (song: Song, list?: Song[]) => {
      const player = playerRef.current;
      const url = getAudioUrl(song);
      if (!player || !url) return;

      player.replace({ uri: url });
      applyVolume(player, volumeRef.current, mutedRef.current);
      player.play();
      markStarting();

      try {
        player.setActiveForLockScreen(true, {
          title: getSongTitle(song),
          artist: getArtistName(song),
          artworkUrl: getSongImage(song) || undefined,
        });
      } catch {}

      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(Number(song.duration) || 0);
      setIsPlaying(true);
      setIsBuffering(true);
      addRecentSong(song);

      if (list && list.length > 0) {
        setQueue(list);
      } else {
        setQueue((prev) => (prev.some((s) => sameSong(s, song)) ? prev : [song, ...prev]));
      }
    },
    [markStarting]
  );

  const pickNext = useCallback((auto: boolean): Song | null => {
    const { currentSong: cur, queue: q, isShuffle: shuf, repeatMode: rep } = live.current;
    if (!cur || q.length === 0) return null;

    if (shuf && q.length > 1) {
      const others = q.filter((s) => !sameSong(s, cur));
      return others[Math.floor(Math.random() * others.length)] ?? null;
    }

    const idx = q.findIndex((s) => sameSong(s, cur));
    if (idx !== -1 && idx < q.length - 1) return q[idx + 1] ?? null;

    const wrap = auto ? rep === "all" : rep !== "off";
    return wrap ? q[0] ?? null : null;
  }, []);

  const goNext = useCallback(
    (auto: boolean) => {
      const next = pickNext(auto);
      const cur = live.current.currentSong;
      if (!next) {
        if (auto) setIsPlaying(false);
        return;
      }
      if (cur) historyRef.current.push(cur);
      if (historyRef.current.length > 50) historyRef.current.shift();
      startTrack(next, live.current.queue);
    },
    [pickNext, startTrack]
  );

  endedRef.current = () => {
    const player = playerRef.current;
    if (live.current.repeatMode === "one" && player) {
      void player.seekTo(0);
      player.play();
      return;
    }
    goNext(true);
  };

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player || !live.current.currentSong) return;

    if (live.current.isPlaying) {
      clearStarting();
      player.pause();
      setIsPlaying(false);
    } else {
      applyVolume(player, volumeRef.current, mutedRef.current);
      player.play();
      markStarting();
      setIsPlaying(true);
    }
  }, [clearStarting, markStarting]);

  const playSong = useCallback(
    (song: Song, list?: Song[]) => {
      if (sameSong(live.current.currentSong, song)) {
        togglePlay();
        return;
      }
      historyRef.current = [];
      startTrack(song, list);
    },
    [startTrack, togglePlay]
  );

  const nextSong = useCallback(() => goNext(false), [goNext]);

  const previousSong = useCallback(() => {
    const player = playerRef.current;
    const { currentSong: cur, queue: q, currentTime: t } = live.current;
    if (!player || !cur) return;

    if (t > 3) {
      void player.seekTo(0);
      setCurrentTime(0);
      return;
    }

    const fromHistory = historyRef.current.pop();
    if (fromHistory) {
      startTrack(fromHistory, q);
      return;
    }

    if (q.length === 0) return;
    const idx = q.findIndex((s) => sameSong(s, cur));
    const prev = q[idx > 0 ? idx - 1 : q.length - 1];
    if (prev) startTrack(prev, q);
  }, [startTrack]);

  const seek = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const max = player.duration > 0 ? player.duration : seconds;
    const clamped = Math.max(0, Math.min(seconds, max));
    void player.seekTo(clamped);
    setCurrentTime(clamped);
  }, []);

  const setVolume = useCallback((v: number) => {
    const player = playerRef.current;
    const clamped = Math.max(0, Math.min(1, v));
    if (player) {
      player.volume = clamped;
      player.muted = clamped === 0;
    }
    volumeRef.current = clamped;
    mutedRef.current = clamped === 0;
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const next = !player.muted;
    if (!next && player.volume === 0) player.volume = 0.6;
    player.muted = next;
    mutedRef.current = next;
    volumeRef.current = player.volume;
    setIsMuted(next);
    setVolumeState(player.volume);
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off")),
    []
  );

  const openFull = useCallback(() => setFullOpen(true), []);
  const closeFull = useCallback(() => setFullOpen(false), []);

  const closePlayer = useCallback(() => {
    clearStarting();
    playerRef.current?.pause();
    try {
      playerRef.current?.clearLockScreenControls();
    } catch {}
    setFullOpen(false);
    setCurrentSong(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
  }, [clearStarting]);

  const value = useMemo<PlayerContextType>(
    () => ({
      currentSong,
      isPlaying,
      isBuffering,
      currentTime,
      duration,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      queue,
      fullOpen,
      playSong,
      togglePlay,
      nextSong,
      previousSong,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      openFull,
      closeFull,
      closePlayer,
    }),
    [
      currentSong, isPlaying, isBuffering, currentTime, duration, volume, isMuted,
      isShuffle, repeatMode, queue, fullOpen, playSong, togglePlay, nextSong,
      previousSong, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat,
      openFull, closeFull, closePlayer,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}