"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { Song } from "../app/types/songs";

interface SmallScreenPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  isMuted: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleMute: () => void;
  onExpand: () => void;
  getImageUrl: (song: Song) => string;
}

export default function SmallScreenPlayer({
  currentSong,
  isPlaying,
  audioElement,
  isMuted,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleMute,
  onExpand,
  getImageUrl,
}: SmallScreenPlayerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Sync progress bar directly with audio element events
  useEffect(() => {
    if (!audioElement) return;

    const updateProgress = () => {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    };

    audioElement.addEventListener("timeupdate", updateProgress);
    audioElement.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audioElement.removeEventListener("timeupdate", updateProgress);
      audioElement.removeEventListener("loadedmetadata", updateProgress);
    };
  }, [audioElement]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onExpand}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl bg-surface/95 backdrop-blur-xl border border-border-light rounded-2xl p-3 px-6 shadow-2xl z-40 flex flex-col gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={getImageUrl(currentSong)}
            alt={currentSong.name}
            className="w-11 h-11 rounded-xl object-cover border border-border-light shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-pri truncate">
              {currentSong.name}
            </p>
            <p className="text-[11px] text-sec truncate">
              {currentSong.artistName || "Artist"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block"
            aria-label="Previous track"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="h-10 w-10 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg hover:bg-accent-hover transition-all active:scale-95 shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block"
            aria-label="Next track"
          >
            <SkipForward size={18} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="p-2 text-sec hover:text-pri transition-colors hidden sm:block ml-2"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      <div className="w-full bg-border-light h-1 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
