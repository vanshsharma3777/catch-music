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

export type ScreenMode = "closed" | "mini" | "half" | "full";
export type RepeatMode = "off" | "all" | "one";

export interface PlayerContextType {
  // State
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

  // Helpers
  audioUrl: string;
  artworkUrl: string;
  artistName: string;

  // Actions
  playSong: (
    song: Song,
    playlistContext?: Song[],
    desiredScreenMode?: ScreenMode
  ) => void;
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
  openHalfScreen: () => void;
  openFullScreen: () => void;
  minimize: () => void;
  closePlayer: () => void;
  toggleScreenMode: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function getAudioSource(song: Song | null): string {
  if (!song) return "";
  if (song.cacheKey) return song.cacheKey;
  if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
    return song.downloadUrl[song.downloadUrl.length - 1]?.url || "";
  }
  if (typeof song.downloadUrl === "string" && song.downloadUrl.trim() !== "") {
    return song.downloadUrl;
  }
  if (typeof song.url === "string" && song.url.trim() !== "") {
    return song.url;
  }
  return "";
}

export function getArtworkSource(song: Song | null): string {
  if (!song) return "/placeholder-music.png";
  if (song.imageCacheKey) return song.imageCacheKey;
  if (Array.isArray(song.image) && song.image.length > 0) {
    return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
  }
  if (typeof song.image === "string" && song.image.trim() !== "") {
    return song.image;
  }
  return "/placeholder-music.png";
}

export function getArtistDisplayName(song: Song | null): string {
  if (!song) return "Unknown Artist";
  if (song.artistName) return song.artistName;
  if (song.primaryArtists) return song.primaryArtists;
  if (song.artists?.primary && song.artists.primary.length > 0) {
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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [prevVolume, setPrevVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [screenMode, setScreenMode] = useState<ScreenMode>("closed");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state ref for listeners
  const stateRef = useRef({
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
    audioElement: null as HTMLAudioElement | null,
  });

  useEffect(() => {
    stateRef.current = {
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
      audioElement,
    };
  }, [
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
    audioElement,
  ]);

  // Internal helper to switch track
  const playSongInternal = useCallback((song: Song, targetPlaylist?: Song[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const src = getAudioSource(song);
    if (!src) {
      console.error("Audio source unavailable for track:", song);
      return;
    }

    audio.pause();
    audio.src = src;
    audio.currentTime = 0;

    audio.play().catch((err) => {
      console.warn("Autoplay / playback interrupted:", err);
    });

    setCurrentSong(song);
    setIsPlaying(true);
    addRecentSong(song);

    if (targetPlaylist && targetPlaylist.length > 0) {
      setPlaylist(targetPlaylist);
    } else {
      setPlaylist((prev) => {
        if (!prev.some((s) => String(s.id) === String(song.id))) {
          return [song, ...prev];
        }
        return prev;
      });
    }
  }, []);

  // Initialize Audio element once on client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0.85;
    audioRef.current = audio;
    setAudioElement(audio);

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onVolumeChange = () => {
      setVolumeState(audio.volume);
      setIsMuted(audio.muted || audio.volume === 0);
    };

    const onEnded = () => {
      const { repeatMode, playlist, currentSong, isShuffle } = stateRef.current;
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }

      if (!playlist.length || !currentSong) return;

      if (isShuffle) {
        if (playlist.length > 1) {
          const others = playlist.filter(
            (s) => String(s.id) !== String(currentSong.id)
          );
          const next = others[Math.floor(Math.random() * others.length)];
          if (next) {
            playSongInternal(next, playlist);
            return;
          }
        }
      }

      const idx = playlist.findIndex(
        (s) => String(s.id) === String(currentSong.id)
      );
      if (idx !== -1 && idx < playlist.length - 1) {
        const nextTrack = playlist[idx + 1];
        if (nextTrack) playSongInternal(nextTrack, playlist);
      } else if (repeatMode === "all" && playlist.length > 0 && playlist[0]) {
        playSongInternal(playlist[0], playlist);
      } else {
        setIsPlaying(false);
      }
    };

    const onError = (e: Event) => {
      console.warn("[Player Error] Audio playback encountered an error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [playSongInternal]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stateRef.current.isPlaying) {
      audio.pause();
    } else {
      if (!audio.src && stateRef.current.currentSong) {
        audio.src = getAudioSource(stateRef.current.currentSong);
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

  // Public playSong method
  const playSong = useCallback(
    (
      song: Song,
      playlistContext?: Song[],
      desiredScreenMode?: ScreenMode
    ) => {
      if (
        stateRef.current.currentSong &&
        String(stateRef.current.currentSong.id) === String(song.id)
      ) {
        togglePlay();
        if (desiredScreenMode) {
          setScreenMode(desiredScreenMode);
        } else if (stateRef.current.screenMode === "closed") {
          setScreenMode("half");
        }
        return;
      }

      playSongInternal(song, playlistContext);

      setScreenMode((current) => {
        if (desiredScreenMode) return desiredScreenMode;
        if (current === "closed") return "half";
        return current;
      });
    },
    [playSongInternal, togglePlay]
  );

  const nextSong = useCallback(() => {
    const { currentSong, playlist, isShuffle, repeatMode } = stateRef.current;
    if (!playlist.length || !currentSong) return;

    if (isShuffle && playlist.length > 1) {
      const candidates = playlist.filter(
        (s) => String(s.id) !== String(currentSong.id)
      );
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      if (next) playSongInternal(next, playlist);
      return;
    }

    const currentIndex = playlist.findIndex(
      (s) => String(s.id) === String(currentSong.id)
    );
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      if (nextTrack) playSongInternal(nextTrack, playlist);
    } else if (repeatMode !== "off" && playlist.length > 0 && playlist[0]) {
      playSongInternal(playlist[0], playlist);
    }
  }, [playSongInternal]);

  const previousSong = useCallback(() => {
    const audio = audioRef.current;
    const { currentSong, playlist } = stateRef.current;
    if (!audio) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (!playlist.length || !currentSong) return;

    const currentIndex = playlist.findIndex(
      (s) => String(s.id) === String(currentSong.id)
    );
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    const prevTrack = playlist[prevIndex];
    if (prevTrack) playSongInternal(prevTrack, playlist);
  }, [playSongInternal]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || seconds));
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
    (step = 0.05) => {
      setVolume(stateRef.current.volume + step);
    },
    [setVolume]
  );

  const volumeDown = useCallback(
    (step = 0.05) => {
      setVolume(stateRef.current.volume - step);
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stateRef.current.isMuted || audio.volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.8;
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
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const openHalfScreen = useCallback(() => setScreenMode("half"), []);
  const openFullScreen = useCallback(() => setScreenMode("full"), []);
  const minimize = useCallback(() => setScreenMode("mini"), []);
  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setScreenMode("closed");
  }, []);

  const toggleScreenMode = useCallback(() => {
    setScreenMode((prev) => (prev === "full" ? "half" : "full"));
  }, []);

  // Calculate current index & next song preview
  const currentIndex = useMemo(() => {
    if (!currentSong || !playlist.length) return -1;
    return playlist.findIndex((s) => String(s.id) === String(currentSong.id));
  }, [currentSong, playlist]);

  const nextSongCandidate = useMemo(() => {
    if (!playlist.length || !currentSong) return null;
    if (isShuffle && playlist.length > 1) {
      const candidates = playlist.filter(
        (s) => String(s.id) !== String(currentSong.id)
      );
      return candidates[0] || null;
    }
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      return playlist[currentIndex + 1] || null;
    }
    if (repeatMode !== "off" && playlist.length > 0) {
      return playlist[0] || null;
    }
    return null;
  }, [playlist, currentSong, currentIndex, isShuffle, repeatMode]);

  // Centralized Global Keyboard Shortcuts
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

      // 1. ESCAPE: Exit full screen -> half screen -> mini
      if (e.key === "Escape") {
        const mode = stateRef.current.screenMode;
        if (mode === "full") {
          e.preventDefault();
          setScreenMode("half");
          return;
        } else if (mode === "half") {
          e.preventDefault();
          setScreenMode("mini");
          return;
        }
      }

      // 2. SPACE: Play / Pause
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      // 3. ARROW RIGHT: Seek +5s OR Next (with Shift/Alt)
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey || e.altKey) {
          nextSong();
        } else {
          seek(stateRef.current.currentTime + 5);
        }
        return;
      }

      // 4. ARROW LEFT: Seek -5s OR Previous (with Shift/Alt)
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey || e.altKey) {
          previousSong();
        } else {
          seek(stateRef.current.currentTime - 5);
        }
        return;
      }

      // 5. ARROW UP / DOWN: Volume controls
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

      // 6. KEY M: Mute
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
        return;
      }

      // 7. KEY S: Shuffle
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      // 8. KEY R: Repeat
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        cycleRepeat();
        return;
      }

      // 9. KEY F: Toggle Full-screen / Half-screen
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleScreenMode();
        return;
      }

      // 10. KEY H: Open Half-screen
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        openHalfScreen();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    openHalfScreen,
  ]);

  // Lock scroll only when Full-Screen is open
  useEffect(() => {
    if (screenMode === "full") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [screenMode]);

  const value = useMemo<PlayerContextType>(() => {
    return {
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
      openHalfScreen,
      openFullScreen,
      minimize,
      closePlayer,
      toggleScreenMode,
    };
  }, [
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
    openHalfScreen,
    openFullScreen,
    minimize,
    closePlayer,
    toggleScreenMode,
  ]);

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

export default PlayerProvider;
