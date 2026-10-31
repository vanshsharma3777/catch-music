"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Song } from "../../app/types/songs";
import { addRecentSong } from "../../app/lib/recentSongs";
import { fetchRecommendations } from "../../app/lib/recommendationsClient";

export type ScreenMode = "closed" | "mini" | "full";
export type RepeatMode = "off" | "all" | "one";
export type QueueMode = "recommend" | "list";

export interface PlayOptions {
  mode?: QueueMode;
}

export interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  screenMode: ScreenMode;
  playlist: Song[];
  currentIndex: number;
  nextSongCandidate: Song | null;
  audioElement: HTMLAudioElement | null;
  audioUrl: string;
  artworkUrl: string;
  artistName: string;
  playSong: (
    song: Song,
    fallbackList?: Song[],
    desiredScreenMode?: ScreenMode,
    options?: PlayOptions
  ) => void;
  appendRecommendations: (songs: Song[]) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  volumeUp: (step?: number) => void;
  volumeDown: (step?: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setScreenMode: (mode: ScreenMode) => void;
  openFullScreen: () => void;
  minimize: () => void;
  closePlayer: () => void;
  toggleScreenMode: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const REC_LIMIT = 10;
const PREFETCH_THRESHOLD = 2;
const MAX_ERROR_STREAK = 4;

const VOLUME_KEY = "fsp_volume";
const MUTED_KEY = "fsp_muted";
const SUGGESTIONS_KEY = "catchmusic_suggestions_v1";

const idOf = (s?: Song | null) => String(s?.id ?? "");

function readDefaultPool(): Song[] {
  try {
    const raw = sessionStorage.getItem(SUGGESTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed?.songs) ? parsed.songs : [];
  } catch {
    return [];
  }
}

function readSavedVolume(): { volume: number; muted: boolean } {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "");
    const volume = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.85;

    return {
      volume: volume > 0 ? volume : 0.85,
      muted: localStorage.getItem(MUTED_KEY) === "1",
    };
  } catch {
    return { volume: 0.85, muted: false };
  }
}

function uniqueById(list: Song[]): Song[] {
  const seen = new Set<string>();

  return list.filter((s) => {
    const id = idOf(s);

    if (!s || !id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

export function getAudioSource(song: Song | null): string {
  if (!song) return "";

  if (song.cacheKey) return song.cacheKey;

  if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
    return song.downloadUrl[song.downloadUrl.length - 1]?.url || "";
  }

  if (typeof song.downloadUrl === "string" && song.downloadUrl.trim()) {
    return song.downloadUrl;
  }

  return "";
}

export function getArtworkSource(song: Song | null): string {
  if (!song) return "/placeholder-music.png";

  if (song.imageCacheKey) return song.imageCacheKey;

  if (Array.isArray(song.image) && song.image.length > 0) {
    return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
  }

  if (typeof song.image === "string" && song.image.trim()) {
    return song.image;
  }

  return "/placeholder-music.png";
}

export function getArtistDisplayName(song: Song | null): string {
  if (!song) return "Unknown Artist";

  if (song.artistName) return song.artistName;

  if (song.primaryArtists) return song.primaryArtists;

  if (song.artists?.primary?.length) {
    return song.artists.primary.map((a) => a.name).join(", ");
  }

  return "Unknown Artist";
}

export function formatAudioTime(seconds?: number | string): string {
  if (seconds === undefined || seconds === null || isNaN(Number(seconds))) {
    return "0:00";
  }

  const secNum =
    typeof seconds === "string" ? parseInt(seconds, 10) : Math.floor(seconds);

  if (isNaN(secNum) || secNum < 0) return "0:00";

  const mins = Math.floor(secNum / 60);
  const secs = secNum % 60;

  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function PlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [prevVolume, setPrevVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [screenMode, setScreenMode] = useState<ScreenMode>("closed");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [audioElement, setAudioElement] =
    useState<HTMLAudioElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Song[]>([]);
  const currentRef = useRef<Song | null>(null);
  const fallbackRef = useRef<Song[]>([]);
  const playedRef = useRef<Set<string>>(new Set());
  const modeRef = useRef<QueueMode>("recommend");
  const seedToken = useRef(0);
  const errorStreak = useRef(0);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("off");

  const stateRef = useRef({
    isPlaying,
    currentTime,
    isMuted,
    screenMode,
  });

  const goNextRef = useRef<(auto: boolean) => Promise<void>>(
    async () => {}
  );

  useEffect(() => {
    shuffleRef.current = isShuffle;
    repeatRef.current = repeatMode;

    stateRef.current = {
      isPlaying,
      currentTime,
      isMuted,
      screenMode,
    };
  }, [isShuffle, repeatMode, isPlaying, currentTime, isMuted, screenMode]);

  const commitQueue = useCallback((q: Song[]) => {
    queueRef.current = q;
    setPlaylist(q);
  }, []);

  const fallbackUpcoming = useCallback((): Song[] => {
    const cur = currentRef.current;

    const pool = fallbackRef.current.filter(
      (s) => idOf(s) !== idOf(cur)
    );

    const fresh = pool.filter(
      (s) => !playedRef.current.has(idOf(s))
    );

    if (fresh.length > 0) return fresh;

    playedRef.current = new Set(cur ? [idOf(cur)] : []);

    return pool;
  }, []);

  const seedFrom = useCallback(
    async (seed: Song): Promise<boolean> => {
      const token = ++seedToken.current;

      const exclude = [
        ...new Set([
          ...playedRef.current,
          ...queueRef.current.map(idOf),
        ]),
      ];

      console.log("Fetching recommendations for:", seed.name);

      let recs: Song[] = [];

      try {
        recs = await fetchRecommendations(
          idOf(seed),
          exclude,
          REC_LIMIT
        );
      } catch (error) {
        console.error("Recommendation fetch failed:", error);
      }

      if (token !== seedToken.current) return false;

      const cur = currentRef.current;
      const q = queueRef.current;

      const curIdx = cur
        ? q.findIndex((s) => idOf(s) === idOf(cur))
        : -1;

      const head =
        curIdx >= 0
          ? q.slice(0, curIdx + 1)
          : cur
            ? [cur]
            : [];

      const inHead = new Set(head.map(idOf));

      let upcoming = uniqueById(
        recs.filter(
          (s) =>
            !inHead.has(idOf(s)) &&
            !playedRef.current.has(idOf(s))
        )
      );

      if (upcoming.length === 0) {
        console.log("No recommendations found. Using fallback songs.");

        upcoming = uniqueById(fallbackUpcoming()).filter(
          (s) => !inHead.has(idOf(s))
        );
      }

      console.log("New recommendations:", upcoming.length);

      commitQueue([...head, ...upcoming]);

      return upcoming.length > 0;
    },
    [commitQueue, fallbackUpcoming]
  );

  const startSong = useCallback(
    (song: Song, userInitiated = false): boolean => {
      const audio = audioRef.current;

      if (!audio) return false;

      const src = getAudioSource(song);

      if (!src) return false;

      audio.pause();
      audio.src = src;
      audio.currentTime = 0;

      audio.play().catch((err) => {
        console.warn("Playback interrupted:", err);
      });

      currentRef.current = song;
      playedRef.current.add(idOf(song));

      setCurrentSong(song);
      setIsPlaying(true);

      addRecentSong(song);

      if (!userInitiated && modeRef.current === "recommend") {
        const online =
          typeof navigator === "undefined" || navigator.onLine;

        const idx = queueRef.current.findIndex(
          (s) => idOf(s) === idOf(song)
        );

        const upcomingCount =
          idx >= 0 ? queueRef.current.length - idx - 1 : 0;

        console.log("Upcoming songs remaining:", upcomingCount);

        if (online && upcomingCount <= PREFETCH_THRESHOLD) {
          console.log("Prefetch threshold reached. Loading more songs.");

          void seedFrom(song);
        }
      }

      return true;
    },
    [seedFrom]
  );

  const goNext = useCallback(
    async (auto: boolean) => {
      const audio = audioRef.current;

      if (!audio || !currentRef.current) return;

      if (auto && repeatRef.current === "one") {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        return;
      }

      let refilled = false;

      for (let attempt = 0; attempt < 10; attempt++) {
        const cur = currentRef.current;
        let q = queueRef.current;

        const idx = q.findIndex(
          (s) => idOf(s) === idOf(cur)
        );

        let next: Song | undefined;

        if (
          shuffleRef.current &&
          idx >= 0 &&
          idx < q.length - 1
        ) {
          const upcoming = q.slice(idx + 1);

          const pick =
            upcoming[Math.floor(Math.random() * upcoming.length)];

          if (pick) {
            q = [
              ...q.slice(0, idx + 1),
              pick,
              ...upcoming.filter(
                (s) => idOf(s) !== idOf(pick)
              ),
            ];

            commitQueue(q);
            next = pick;
          }
        } else {
          next = q[idx + 1];
        }

        if (!next) {
          if (
            modeRef.current === "recommend" &&
            !refilled &&
            cur
          ) {
            refilled = true;
            await seedFrom(cur);
            continue;
          }

          if (
            q.length > 1 &&
            q[0] &&
            idOf(q[0]) !== idOf(cur)
          ) {
            if (startSong(q[0])) return;
          }

          setIsPlaying(false);
          return;
        }

        if (startSong(next)) return;

        currentRef.current = next;
      }

      setIsPlaying(false);
    },
    [commitQueue, seedFrom, startSong]
  );

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();

    audio.preload = "auto";

    const saved = readSavedVolume();

    audio.volume = saved.volume;
    audio.muted = saved.muted;

    audioRef.current = audio;

    setAudioElement(audio);
    setVolumeState(saved.volume);
    setPrevVolume(saved.volume);
    setIsMuted(saved.muted);

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onPlay = () => setIsPlaying(true);

    const onPlaying = () => {
      errorStreak.current = 0;
    };

    const onPause = () => setIsPlaying(false);

    const onVolumeChange = () => {
      setVolumeState(audio.volume);
      setIsMuted(audio.muted || audio.volume === 0);

      try {
        if (audio.volume > 0) {
          localStorage.setItem(
            VOLUME_KEY,
            String(audio.volume)
          );
        }

        localStorage.setItem(
          MUTED_KEY,
          audio.muted || audio.volume === 0 ? "1" : "0"
        );
      } catch {}
    };

    const onEnded = () => {
      void goNextRef.current(true);
    };

    const onError = (e: Event) => {
      console.warn("[Player Error]", e);

      errorStreak.current += 1;

      if (errorStreak.current <= MAX_ERROR_STREAK) {
        void goNextRef.current(true);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();

      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (stateRef.current.isPlaying) {
      audio.pause();
    } else {
      if (!audio.src && currentRef.current) {
        audio.src = getAudioSource(currentRef.current);
      }

      audio.play().catch(console.error);
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(console.error);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const appendRecommendations = useCallback(
    (songs: Song[]) => {
      const have = new Set(queueRef.current.map(idOf));

      const fresh = uniqueById(
        songs.filter((s) => s?.id && !have.has(idOf(s)))
      );

      if (fresh.length) {
        commitQueue([...queueRef.current, ...fresh]);
      }
    },
    [commitQueue]
  );

  const playSong = useCallback(
    (
      song: Song,
      fallbackList: Song[] = [],
      desiredScreenMode?: ScreenMode,
      options?: PlayOptions
    ) => {
      const showPlayer = () => {
        setScreenMode((current) => {
          if (desiredScreenMode) return desiredScreenMode;

          return current === "closed" ? "mini" : current;
        });
      };

      if (
        currentRef.current &&
        idOf(currentRef.current) === idOf(song)
      ) {
        togglePlay();
        showPlayer();
        return;
      }

      const offline =
        !!song.cacheKey ||
        (typeof navigator !== "undefined" && !navigator.onLine);

      const mode: QueueMode =
        options?.mode ?? (offline ? "list" : "recommend");

      const given = uniqueById(fallbackList.filter(Boolean));

      const pool =
        given.length > 0 ? given : readDefaultPool();

      ++seedToken.current;

      modeRef.current = mode;
      playedRef.current = new Set();
      errorStreak.current = 0;
      fallbackRef.current = pool.filter(
        (s) => idOf(s) !== idOf(song)
      );

      if (mode === "list") {
        const list = given.some(
          (s) => idOf(s) === idOf(song)
        )
          ? given
          : [song, ...given];

        commitQueue(list);
      } else {
        commitQueue([song]);
      }

      if (!startSong(song, true)) return;

      showPlayer();

      if (mode === "recommend") {
        void seedFrom(song);
      }
    },
    [commitQueue, seedFrom, startSong, togglePlay]
  );

  const nextSong = useCallback(() => {
    void goNext(false);
  }, [goNext]);

  const previousSong = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const q = queueRef.current;

    const idx = q.findIndex(
      (s) => idOf(s) === idOf(currentRef.current)
    );

    const prev = idx > 0 ? q[idx - 1] : undefined;

    if (prev) {
      startSong(prev, true);
    } else {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  }, [startSong]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;

    if (!audio) return;

    const clamped = Math.max(
      0,
      Math.min(seconds, audio.duration || seconds)
    );

    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current;

    if (!audio) return;

    const clamped = Math.max(0, Math.min(1, newVolume));

    audio.volume = clamped;
    audio.muted = clamped === 0;

    setVolumeState(clamped);
    setIsMuted(clamped === 0);
  }, []);

  const volumeUp = useCallback(
    (step = 0.05) =>
      setVolume((audioRef.current?.volume ?? 0) + step),
    [setVolume]
  );

  const volumeDown = useCallback(
    (step = 0.05) =>
      setVolume((audioRef.current?.volume ?? 0) - step),
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (stateRef.current.isMuted || audio.volume === 0) {
      const restored =
        prevVolume > 0 ? prevVolume : readSavedVolume().volume;

      audio.volume = restored;
      audio.muted = false;

      setVolumeState(restored);
      setIsMuted(false);
    } else {
      setPrevVolume(audio.volume);

      audio.volume = 0;
      audio.muted = true;

      setVolumeState(0);
      setIsMuted(true);
    }
  }, [prevVolume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((p) => !p);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off"
    );
  }, []);

  const openFullScreen = useCallback(() => {
    setScreenMode("full");
  }, []);

  const minimize = useCallback(() => {
    setScreenMode("mini");
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();

    setIsPlaying(false);
    setScreenMode("closed");

    seedToken.current++;
  }, []);

  const toggleScreenMode = useCallback(() => {
    setScreenMode((prev) =>
      prev === "full" ? "mini" : "full"
    );
  }, []);

  const currentIndex = useMemo(() => {
    if (!currentSong || !playlist.length) return -1;

    return playlist.findIndex(
      (s) => idOf(s) === idOf(currentSong)
    );
  }, [currentSong, playlist]);

  const nextSongCandidate = useMemo(
    () =>
      currentIndex >= 0
        ? playlist[currentIndex + 1] ?? null
        : null,
    [playlist, currentIndex]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (
        e.key === "Escape" &&
        stateRef.current.screenMode === "full"
      ) {
        e.preventDefault();
        setScreenMode("mini");
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();

        if (e.shiftKey || e.altKey) {
          nextSong();
        } else {
          seek(stateRef.current.currentTime + 5);
        }

        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();

        if (e.shiftKey || e.altKey) {
          previousSong();
        } else {
          seek(stateRef.current.currentTime - 5);
        }

        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        volumeUp(0.05);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        volumeDown(0.05);
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        cycleRepeat();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleScreenMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    togglePlay,
    nextSong,
    previousSong,
    seek,
    volumeUp,
    volumeDown,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleScreenMode,
  ]);

  useEffect(() => {
    document.body.style.overflow =
      screenMode === "full" ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [screenMode]);

  const value = useMemo<PlayerContextType>(
    () => ({
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      screenMode,
      playlist,
      currentIndex,
      nextSongCandidate,
      audioElement,
      audioUrl: getAudioSource(currentSong),
      artworkUrl: getArtworkSource(currentSong),
      artistName: getArtistDisplayName(currentSong),
      playSong,
      appendRecommendations,
      togglePlay,
      play,
      pause,
      nextSong,
      previousSong,
      seek,
      setVolume,
      volumeUp,
      volumeDown,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      setScreenMode,
      openFullScreen,
      minimize,
      closePlayer,
      toggleScreenMode,
    }),
    [
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      screenMode,
      playlist,
      currentIndex,
      nextSongCandidate,
      audioElement,
      playSong,
      appendRecommendations,
      togglePlay,
      play,
      pause,
      nextSong,
      previousSong,
      seek,
      setVolume,
      volumeUp,
      volumeDown,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      openFullScreen,
      minimize,
      closePlayer,
      toggleScreenMode,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used within a PlayerProvider"
    );
  }

  return context;
}

export default PlayerProvider;