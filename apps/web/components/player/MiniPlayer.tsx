"use client";

import React from "react";
import { usePlayer } from "./PlayerContext";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PrevIcon,
  ExpandIcon,
  CloseIcon,
} from "./Icons";

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    artworkUrl,
    artistName,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    openFullScreen,
    closePlayer,
  } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const title = currentSong.name || (currentSong as any).title || "Untitled";

  const btn =
    "grid place-items-center rounded-full text-white/80 transition hover:text-white hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
      role="region"
      aria-label="Now playing"
    >
      <style>{`
        /* Interactive mini-player seek track */
        .mp-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          background: transparent;
          cursor: pointer;
          display: block;
        }
        .mp-range::-webkit-slider-runnable-track {
          height: 3px;
          background: linear-gradient(to right, #fff var(--p), rgba(255, 255, 255, 0.15) var(--p));
          transition: height 0.15s ease;
        }
        .mp-range::-moz-range-track {
          height: 3px;
          background: rgba(255, 255, 255, 0.15);
        }
        .mp-range::-moz-range-progress {
          height: 3px;
          background: #fff;
        }
        .mp-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          margin-top: -3.5px;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .mp-range:hover::-webkit-slider-runnable-track {
          height: 5px;
        }
        .mp-range:hover::-webkit-slider-thumb {
          opacity: 1;
          transform: scale(1.2);
        }
        .mp-range::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border: 0;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .mp-range:hover::-moz-range-thumb {
          opacity: 1;
        }
      `}</style>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/85 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        {/* Ambient glow from artwork */}
        <img
          src={artworkUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -left-10 top-1/2 h-40 w-72 -translate-y-1/2 scale-150 object-cover opacity-35 blur-3xl"
        />

        <div className="relative flex items-center gap-3 p-2.5 pr-3">
          {/* Song Info & Artwork */}
          <button
            onClick={openFullScreen}
            aria-label="Open full screen player"
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-white"
          >
            <span className="relative block h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <img
                src={artworkUrl}
                alt=""
                className={`h-full w-full rounded-full object-cover shadow-lg ring-1 ring-white/20 motion-safe:animate-[spin_14s_linear_infinite] ${
                  isPlaying ? "" : "[animation-play-state:paused]"
                }`}
              />
              {/* Spindle hole */}
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 ring-1 ring-white/30" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white sm:text-base">
                {title}
              </span>
              <span className="block truncate text-xs text-white/60 sm:text-sm">
                {artistName}
              </span>
            </span>
          </button>

          {/* Action & Transport Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={previousSong}
              aria-label="Previous song"
              className={`${btn} h-9 w-9`}
            >
              <PrevIcon className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-neutral-950 shadow-lg transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5 translate-x-px" />
              )}
            </button>
            <button
              onClick={nextSong}
              aria-label="Next song"
              className={`${btn} h-9 w-9`}
            >
              <NextIcon className="h-5 w-5" />
            </button>
            <button
              onClick={openFullScreen}
              aria-label="Expand player"
              className={`${btn} hidden h-9 w-9 sm:grid`}
            >
              <ExpandIcon className="h-5 w-5" />
            </button>
            <button
              onClick={closePlayer}
              aria-label="Close player"
              className={`${btn} h-9 w-9`}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Interactive Timeline / Progress Bar */}
        <div className="relative w-full px-0">
          <input
            type="range"
            className="mp-range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ ["--p" as any]: `${progress}%` }}
            aria-label="Seek track position"
          />
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;
