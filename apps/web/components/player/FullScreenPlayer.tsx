"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ChevronDown,
  Minimize2,
  X,
  Music2,
  HardDriveDownload,
  ListMusic,
  BookmarkCheck,
  BookmarkPlus,
  RefreshCw,
} from "lucide-react";
import { usePlayer, formatAudioTime } from "./PlayerContext";
import { Song } from "../../app/types/songs";
import { getCachedSongIds, toggleCacheSong } from "../../app/lib/cacheDb";
import { checkStorageQuota } from "../../app/lib/estimateStorage";

export interface FullScreenPlayerProps {
  song?: Song;
  onClose?: () => void;
  onMinimize?: () => void;
  onSwitchHalf?: () => void;
  // Backward compatibility overrides
  isPlaying?: boolean;
  audioElement?: HTMLAudioElement | null;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;
  isShuffle?: boolean;
  loopMode?: "off" | "all" | "one";
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (vol: number) => void;
  onToggleMute?: () => void;
  onToggleLoop?: () => void;
  onToggleShuffle?: () => void;
  getImageUrl?: (song: Song) => string;
}

export function FullScreenPlayer({
  song: directSong,
  onClose,
  onMinimize,
  onSwitchHalf,
  isPlaying: propIsPlaying,
  onTogglePlay: propOnTogglePlay,
  onNext: propOnNext,
  onPrevious: propOnPrevious,
  onSeek: propOnSeek,
  onVolumeChange: propOnVolumeChange,
  onToggleMute: propOnToggleMute,
  onToggleLoop: propOnToggleLoop,
  onToggleShuffle: propOnToggleShuffle,
  getImageUrl: propGetImageUrl,
}: FullScreenPlayerProps) {
  const player = usePlayer();

  const activeSong = directSong || player.currentSong;
  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : player.isPlaying;
  const coverUrl = propGetImageUrl
    ? activeSong ? propGetImageUrl(activeSong) : player.artworkUrl
    : player.artworkUrl;
  const artist = player.artistName || (activeSong ? (activeSong.artistName || "Unknown Artist") : "");
  const duration = player.duration;
  const currentTime = player.currentTime;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Offline Cache State
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isCaching, setIsCaching] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSong?.id) return;
    let isMounted = true;

    async function checkCachedStatus() {
      try {
        const cachedIds = await getCachedSongIds();
        if (isMounted) {
          setIsCached(cachedIds.includes(String(activeSong!.id)));
        }
      } catch (e) {
        console.warn("Could not check offline cached status:", e);
      }
    }

    checkCachedStatus();
    return () => {
      isMounted = false;
    };
  }, [activeSong?.id]);

  const handleToggleCache = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSong || isCaching) return;

    if (!isCached) {
      const quota = await checkStorageQuota();
      if (quota && quota.isLowStorage) {
        alert(
          `Cannot cache track. Device storage is below 3 MB (${quota.remainingMB} MB remaining).`
        );
        return;
      }
    }

    setIsCaching(true);
    try {
      const newStatus = await toggleCacheSong(activeSong, isCached);
      setIsCached(newStatus);
    } catch (err) {
      console.error("Failed to toggle offline song cache:", err);
    } finally {
      setIsCaching(false);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (propOnSeek) {
      propOnSeek(val);
    } else {
      player.seek(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (propOnVolumeChange) {
      propOnVolumeChange(val);
    } else {
      player.setVolume(val);
    }
  };

  const handleTogglePlay = () => {
    if (propOnTogglePlay) propOnTogglePlay();
    else player.togglePlay();
  };

  const handleNext = () => {
    if (propOnNext) propOnNext();
    else player.nextSong();
  };

  const handlePrevious = () => {
    if (propOnPrevious) propOnPrevious();
    else player.previousSong();
  };

  const handleToggleMute = () => {
    if (propOnToggleMute) propOnToggleMute();
    else player.toggleMute();
  };

  const handleToggleShuffle = () => {
    if (propOnToggleShuffle) propOnToggleShuffle();
    else player.toggleShuffle();
  };

  const handleToggleLoop = () => {
    if (propOnToggleLoop) propOnToggleLoop();
    else player.cycleRepeat();
  };

  const handleMinimize = () => {
    if (onMinimize) onMinimize();
    else player.minimize();
  };

  const handleSwitchHalf = () => {
    if (onSwitchHalf) onSwitchHalf();
    else player.openHalfScreen();
  };

  const handleClose = () => {
    if (onClose) onClose();
    else player.closePlayer();
  };

  if (!activeSong) return null;

  const effectiveVolume = player.isMuted ? 0 : player.volume;

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-3xl flex flex-col justify-between p-5 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 -z-10 opacity-30 blur-3xl scale-125 transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url(${coverUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg/70 via-bg/40 to-bg/90 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto z-10">
        <div className="flex items-center gap-2">
          {/* Minimize Button */}
          <button
            onClick={handleMinimize}
            className="p-2.5 rounded-2xl bg-surface/80 border border-border-light hover:bg-surface text-sec hover:text-pri transition-all active:scale-95 cursor-pointer shadow-md"
            title="Minimize to bottom bar (Esc)"
            aria-label="Minimize player"
          >
            <ChevronDown size={22} />
          </button>

          {/* Switch to Half Screen Button */}
          <button
            onClick={handleSwitchHalf}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface/80 border border-border-light hover:bg-surface text-xs font-semibold text-sec hover:text-pri transition-all active:scale-95 shadow-md cursor-pointer"
            title="Switch to Half-Screen View (F)"
          >
            <Minimize2 size={15} />
            <span>Half View</span>
          </button>
        </div>

        {/* Center Pill: Source & Artist */}
        <div className="text-center px-4 py-1.5 rounded-full bg-surface/60 border border-border-light backdrop-blur-md max-w-[200px] sm:max-w-xs truncate shadow-sm">
          <p className="text-[10px] tracking-widest uppercase font-bold text-muted">
            Now Playing
          </p>
          <p className="text-xs font-bold text-accent truncate">{artist}</p>
        </div>

        {/* Action Controls: Cache offline + Close */}
        <div className="flex items-center gap-2">
          {/* Offline Cache Bookmark Button */}
          <button
            onClick={handleToggleCache}
            disabled={isCaching}
            className={`p-2.5 rounded-2xl border transition-all active:scale-95 shadow-md cursor-pointer ${
              isCached
                ? "bg-accent text-bg border-accent/40 shadow-accent/20"
                : "bg-surface/80 border-border-light text-sec hover:text-pri hover:bg-surface"
            }`}
            title={
              isCaching
                ? "Saving track offline..."
                : isCached
                ? "Saved for offline listening"
                : "Download to offline cache"
            }
            aria-label="Toggle offline storage"
          >
            {isCaching ? (
              <RefreshCw size={19} className="animate-spin" />
            ) : isCached ? (
              <BookmarkCheck size={19} />
            ) : (
              <BookmarkPlus size={19} />
            )}
          </button>

          {/* Close Player */}
          <button
            onClick={handleClose}
            className="p-2.5 rounded-2xl bg-surface/80 border border-border-light hover:bg-red-500/20 text-muted hover:text-red-400 transition-all active:scale-95 shadow-md cursor-pointer"
            title="Stop & Close Player"
            aria-label="Close player"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* Main Cover Art Stage */}
      <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 my-auto min-h-0 z-10">
        <div className="relative group w-48 h-48 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-92 lg:h-92 aspect-square rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-border-light bg-card transition-all duration-500">
          <img
            src={coverUrl}
            alt={activeSong.name || "Track artwork"}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? "scale-105" : "scale-100"
            }`}
          />

          {/* Offline badge overlay */}
          {(isCached || activeSong.cacheKey) && (
            <div
              className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full bg-accent text-bg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-md"
              title="Available offline"
            >
              <HardDriveDownload size={11} />
              <span>Offline</span>
            </div>
          )}

          {/* Ambient center pulse animation */}
          {isPlaying && (
            <div className="absolute inset-0 bg-accent/5 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Up Next Snippet */}
        {player.nextSongCandidate && (
          <div className="flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full bg-surface/50 border border-border-light backdrop-blur-sm text-xs text-muted max-w-sm truncate shadow-sm">
            <ListMusic size={13} className="text-accent shrink-0" />
            <span className="truncate">
              Up Next:{" "}
              <strong className="text-sec font-semibold">
                {player.nextSongCandidate.name}
              </strong>
            </span>
          </div>
        )}
      </main>

      {/* Bottom Controls Stage */}
      <footer className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 z-10">
        {/* Track Title and Artist */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-pri tracking-tight truncate px-4">
            {activeSong.name || activeSong.title}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-accent truncate px-4">
            {artist}
          </p>
        </div>

        {/* Live Timeline Scrubber */}
        <div className="space-y-1.5 px-2">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              style={{
                background: `linear-gradient(to right, var(--accent, #eab308) ${progressPercent}%, var(--border, #374151) ${progressPercent}%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Seek time"
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-muted px-0.5">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Primary Playback Buttons */}
        <div className="flex items-center justify-center gap-5 sm:gap-8 py-1">
          {/* Shuffle Toggle */}
          <button
            onClick={handleToggleShuffle}
            className={`p-2.5 rounded-xl transition-all cursor-pointer relative active:scale-95 ${
              player.isShuffle
                ? "text-accent bg-accent/15"
                : "text-muted hover:text-pri"
            }`}
            title={player.isShuffle ? "Shuffle On (S)" : "Shuffle Off (S)"}
            aria-label="Toggle shuffle"
          >
            <Shuffle size={20} />
            {player.isShuffle && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
            )}
          </button>

          {/* Previous Track */}
          <button
            onClick={handlePrevious}
            className="p-3 text-sec hover:text-pri transition-all active:scale-90 cursor-pointer"
            title="Previous song (Shift + Left Arrow)"
            aria-label="Previous track"
          >
            <SkipBack size={26} />
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-bg flex items-center justify-center shadow-[0_10px_35px_rgba(212,175,55,0.4)] hover:brightness-110 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" className="ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={handleNext}
            className="p-3 text-sec hover:text-pri transition-all active:scale-90 cursor-pointer"
            title="Next song (Shift + Right Arrow)"
            aria-label="Next track"
          >
            <SkipForward size={26} />
          </button>

          {/* Loop Mode Toggle */}
          <button
            onClick={handleToggleLoop}
            className={`p-2.5 rounded-xl transition-all cursor-pointer relative active:scale-95 ${
              player.repeatMode !== "off"
                ? "text-accent bg-accent/15"
                : "text-muted hover:text-pri"
            }`}
            title={`Repeat mode: ${player.repeatMode} (R)`}
            aria-label="Toggle repeat mode"
          >
            {player.repeatMode === "one" ? (
              <Repeat1 size={20} />
            ) : (
              <Repeat size={20} />
            )}
            {player.repeatMode !== "off" && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* Volume & Shortcut Bar */}
        <div className="flex items-center justify-between pt-2 px-2 border-t border-border/40 text-muted">
          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={handleToggleMute}
              className="p-1.5 text-muted hover:text-accent transition-colors cursor-pointer"
              title={player.isMuted ? "Unmute (M)" : "Mute (M)"}
              aria-label={player.isMuted ? "Unmute" : "Mute"}
            >
              {player.isMuted || effectiveVolume === 0 ? (
                <VolumeX size={18} className="text-red-400" />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={effectiveVolume}
              onChange={handleVolumeChange}
              style={{
                background: `linear-gradient(to right, var(--accent, #eab308) ${
                  effectiveVolume * 100
                }%, var(--border, #374151) ${effectiveVolume * 100}%)`,
              }}
              className="w-20 sm:w-28 h-1.5 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          {/* Key Hints */}
          <div className="hidden md:flex items-center gap-3 text-[11px]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
                Space
              </kbd>{" "}
              Play/Pause
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
                Esc
              </kbd>{" "}
              Minimize
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
                F
              </kbd>{" "}
              Half View
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
                M
              </kbd>{" "}
              Mute
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default FullScreenPlayer;
