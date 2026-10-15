"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronUp,
  X,
  HardDriveDownload,
} from "lucide-react";
import { usePlayer, formatAudioTime } from "./PlayerContext";
import { Song } from "../../app/types/songs";

export interface MiniPlayerProps {
  currentSong?: Song | null;
  isPlaying?: boolean;
  audioElement?: HTMLAudioElement | null;
  isMuted?: boolean;
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleMute?: () => void;
  onExpand?: () => void;
  onClose?: () => void;
  getImageUrl?: (song: Song) => string;
}

export function MiniPlayer({
  currentSong: propSong,
  isPlaying: propIsPlaying,
  isMuted: propIsMuted,
  onTogglePlay: propOnTogglePlay,
  onNext: propOnNext,
  onPrevious: propOnPrevious,
  onToggleMute: propOnToggleMute,
  onExpand: propOnExpand,
  onClose: propOnClose,
  getImageUrl: propGetImageUrl,
}: MiniPlayerProps) {
  const player = usePlayer();

  const activeSong = propSong || player.currentSong;
  if (!activeSong) return null;

  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : player.isPlaying;
  const isMuted = propIsMuted !== undefined ? propIsMuted : player.isMuted;
  const coverUrl = propGetImageUrl
    ? propGetImageUrl(activeSong)
    : player.artworkUrl;
  const artist = player.artistName || activeSong.artistName || "Unknown Artist";

  const progressPercent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;

  const handleExpand = () => {
    if (propOnExpand) {
      propOnExpand();
    } else {
      player.openHalfScreen();
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnTogglePlay) propOnTogglePlay();
    else player.togglePlay();
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnPrevious) propOnPrevious();
    else player.previousSong();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnNext) propOnNext();
    else player.nextSong();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnToggleMute) propOnToggleMute();
    else player.toggleMute();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (propOnClose) propOnClose();
    else player.closePlayer();
  };

  return (
    <div
      onClick={handleExpand}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl bg-surface/95 backdrop-blur-2xl border border-border-light rounded-2xl p-2.5 sm:p-3 px-4 sm:px-6 shadow-[0_10px_35px_rgba(0,0,0,0.7)] z-40 flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.01] hover:border-accent/40 animate-in slide-in-from-bottom duration-300"
      role="region"
      aria-label="Mini music player"
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Artwork + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-border-light shrink-0 bg-bg">
            <img
              src={coverUrl}
              alt={activeSong.name || "Track cover"}
              className="w-full h-full object-cover"
            />
            {activeSong.cacheKey && (
              <span
                className="absolute top-1 left-1 p-0.5 rounded-full bg-accent text-bg shadow-sm"
                title="Downloaded offline song"
              >
                <HardDriveDownload size={10} />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-pri truncate">
              {activeSong.name || activeSong.title}
            </p>
            <p className="text-[11px] text-sec truncate">{artist}</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Previous */}
          <button
            onClick={handlePrevious}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block active:scale-95 cursor-pointer"
            aria-label="Previous track"
            title="Previous track"
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-bg flex items-center justify-center shadow-lg hover:brightness-110 active:scale-90 transition-all shrink-0 cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block active:scale-95 cursor-pointer"
            aria-label="Next track"
            title="Next track"
          >
            <SkipForward size={18} />
          </button>

          {/* Mute */}
          <button
            onClick={handleToggleMute}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block cursor-pointer"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={18} className="text-red-400" />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          {/* Open Full / Half View */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              player.openHalfScreen();
            }}
            className="p-2 text-sec hover:text-accent transition-colors ml-1 cursor-pointer"
            title="Expand Half View"
            aria-label="Expand player"
          >
            <ChevronUp size={18} />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-2 text-muted hover:text-red-400 transition-colors cursor-pointer"
            title="Close player"
            aria-label="Close player"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-border-light h-1 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default MiniPlayer;
