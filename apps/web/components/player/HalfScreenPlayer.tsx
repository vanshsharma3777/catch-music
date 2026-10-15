"use client";

import React from "react";
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
  Maximize2,
  ChevronDown,
  X,
  Music2,
  HardDriveDownload,
  ListMusic,
} from "lucide-react";
import { usePlayer, formatAudioTime } from "./PlayerContext";
import { Song } from "../../app/types/songs";

export interface HalfScreenPlayerProps {
  song?: Song;
  onClose?: () => void;
  onExpandFull?: () => void;
}

export function HalfScreenPlayer({
  song: directSong,
  onClose,
  onExpandFull,
}: HalfScreenPlayerProps) {
  const player = usePlayer();

  const activeSong = directSong || player.currentSong;
  if (!activeSong) return null;

  const coverUrl = player.artworkUrl;
  const artist = player.artistName;
  const isPlaying = player.isPlaying;
  const progressPercent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    player.seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    player.setVolume(parseFloat(e.target.value));
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-between border-t border-border-light bg-surface/95 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 animate-in slide-in-from-bottom"
      style={{ height: "54vh", minHeight: "440px", maxHeight: "580px" }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-3.5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 border border-accent/30 text-accent">
            <Music2 size={13} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Half-Screen Player
          </span>
          <span className="hidden sm:inline-block text-[11px] text-muted">
            • Tap &apos;Full Screen&apos; or press [F]
          </span>
        </div>

        {/* Drag pill indicator */}
        <div className="hidden md:block w-12 h-1 rounded-full bg-border-light" />

        <div className="flex items-center gap-2">
          {/* Switch to Full Screen Button */}
          <button
            onClick={onExpandFull || player.openFullScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-bg font-bold text-xs hover:bg-accent-hover transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Switch to Full-Screen playback (F)"
          >
            <Maximize2 size={13} />
            <span>Full Screen</span>
          </button>

          {/* Minimize Button */}
          <button
            onClick={player.minimize}
            className="p-1.5 rounded-xl bg-bg-ter hover:bg-surface border border-border-light text-sec hover:text-pri transition-colors cursor-pointer"
            title="Minimize to bottom bar (Esc)"
          >
            <ChevronDown size={17} />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose || player.closePlayer}
            className="p-1.5 rounded-xl bg-bg-ter hover:bg-red-500/20 border border-border-light text-muted hover:text-red-400 transition-colors cursor-pointer"
            title="Stop & Close Player"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Player Stage: Responsive Split Grid */}
      <div className="flex-1 px-6 sm:px-12 py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center overflow-hidden">
        {/* Left Column: Artwork & Track Metadata */}
        <div className="md:col-span-5 flex items-center gap-5 min-w-0">
          <div className="relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-2xl overflow-hidden border border-border-light shadow-xl bg-bg group">
            <img
              src={coverUrl}
              alt={activeSong.name}
              className={`h-full w-full object-cover transition-transform duration-700 ${
                isPlaying ? "scale-105" : "scale-100"
              }`}
            />
            {activeSong.cacheKey && (
              <span
                className="absolute top-2 left-2 p-1 rounded-full bg-accent text-bg shadow-sm"
                title="Downloaded offline song"
              >
                <HardDriveDownload size={12} />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="text-lg sm:text-2xl font-black text-pri tracking-tight truncate">
              {activeSong.name || activeSong.title}
            </h2>
            <p className="text-sm font-semibold text-accent truncate">{artist}</p>
            {activeSong.label && (
              <p className="text-xs text-muted truncate">{activeSong.label}</p>
            )}

            {/* Up Next Snippet */}
            {player.nextSongCandidate && (
              <div className="hidden sm:flex items-center gap-1.5 pt-1 text-[11px] text-muted truncate">
                <ListMusic size={12} className="text-accent shrink-0" />
                <span className="truncate">
                  Up next:{" "}
                  <strong className="text-sec font-medium">
                    {player.nextSongCandidate.name}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controls, Scrub, Volume */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          {/* Timeline Scrubber */}
          <div className="space-y-1.5">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={player.duration || 100}
                value={player.currentTime}
                onChange={handleSeekChange}
                style={{
                  background: `linear-gradient(to right, var(--accent, #eab308) ${progressPercent}%, var(--border, #374151) ${progressPercent}%)`,
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-muted">
              <span>{formatAudioTime(player.currentTime)}</span>
              <span>{formatAudioTime(player.duration)}</span>
            </div>
          </div>

          {/* Primary Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
            {/* Playback Button Group */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Shuffle Toggle */}
              <button
                onClick={player.toggleShuffle}
                className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                  player.isShuffle
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:text-pri"
                }`}
                title={player.isShuffle ? "Shuffle On (S)" : "Shuffle Off (S)"}
              >
                <Shuffle size={18} />
                {player.isShuffle && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>

              {/* Previous Song */}
              <button
                onClick={player.previousSong}
                className="p-2 text-sec hover:text-pri transition-colors active:scale-95 cursor-pointer"
                title="Previous track (Shift + Left)"
              >
                <SkipBack size={22} />
              </button>

              {/* Big Play / Pause Button */}
              <button
                onClick={player.togglePlay}
                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-bg flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <Pause size={22} fill="currentColor" />
                ) : (
                  <Play size={22} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              {/* Next Song */}
              <button
                onClick={player.nextSong}
                className="p-2 text-sec hover:text-pri transition-colors active:scale-95 cursor-pointer"
                title="Next track (Shift + Right)"
              >
                <SkipForward size={22} />
              </button>

              {/* Repeat Mode Toggle */}
              <button
                onClick={player.cycleRepeat}
                className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                  player.repeatMode !== "off"
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:text-pri"
                }`}
                title={`Repeat: ${player.repeatMode} (R)`}
              >
                {player.repeatMode === "one" ? (
                  <Repeat1 size={18} />
                ) : (
                  <Repeat size={18} />
                )}
                {player.repeatMode !== "off" && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            </div>

            {/* Volume Control Group */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={player.toggleMute}
                className="p-1.5 text-muted hover:text-accent transition-colors cursor-pointer"
                title={player.isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {player.isMuted || player.volume === 0 ? (
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
                value={player.isMuted ? 0 : player.volume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, var(--accent, #eab308) ${
                    (player.isMuted ? 0 : player.volume) * 100
                  }%, var(--border, #374151) ${
                    (player.isMuted ? 0 : player.volume) * 100
                  }%)`,
                }}
                className="w-20 sm:w-28 h-1.5 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
                title="Volume slider (Up/Down)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="px-6 sm:px-10 py-2 border-t border-border/40 bg-bg-sec/40 flex items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-3 flex-wrap">
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
            Full Screen
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
              ← / →
            </kbd>{" "}
            Seek ±5s
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-pri font-mono text-[10px]">
              M
            </kbd>{" "}
            Mute
          </span>
        </div>

        <button
          onClick={onExpandFull || player.openFullScreen}
          className="text-accent hover:underline font-semibold cursor-pointer hidden md:inline"
        >
          Expand Full View →
        </button>
      </div>
    </div>
  );
}

export default HalfScreenPlayer;
