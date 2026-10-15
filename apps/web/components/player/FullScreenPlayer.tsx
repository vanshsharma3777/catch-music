"use client";

import React from "react";
import { usePlayer, formatAudioTime } from "./PlayerContext";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PrevIcon,
  ShuffleIcon,
  RepeatIcon,
  ChevronDownIcon,
  CloseIcon,
  VolumeIcon,
  MuteIcon,
} from "./Icons";

export function FullScreenPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    artworkUrl,
    artistName,
    nextSongCandidate,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    minimize,
    closePlayer,
    playSong,
    playlist,
  } = usePlayer();

  if (!currentSong) return null;

  const title = currentSong.name || (currentSong as any).title || "Untitled";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const vol = isMuted ? 0 : volume * 100;

  const ghost =
    "grid h-11 w-11 place-items-center rounded-full transition active:scale-90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-neutral-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      <style>{`
        .fsp-range{-webkit-appearance:none;appearance:none;width:100%;height:20px;background:transparent;cursor:pointer}
        .fsp-range::-webkit-slider-runnable-track{height:5px;border-radius:9999px;background:linear-gradient(to right,#fff var(--p),rgba(255,255,255,.18) var(--p))}
        .fsp-range::-moz-range-track{height:5px;border-radius:9999px;background:rgba(255,255,255,.18)}
        .fsp-range::-moz-range-progress{height:5px;border-radius:9999px;background:#fff}
        .fsp-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;margin-top:-4.5px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5);transition:transform .15s}
        .fsp-range::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:#fff}
        .fsp-range:hover::-webkit-slider-thumb{transform:scale(1.3)}
        .fsp-range:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:9999px}
        @keyframes fsp-breathe{0%,100%{transform:scale(1.35);opacity:.55}50%{transform:scale(1.55);opacity:.8}}
        @media (prefers-reduced-motion:no-preference){.fsp-breathe{animation:fsp-breathe 6s ease-in-out infinite}}
      `}</style>

      {/* Ambient background: the artwork itself becomes the palette */}
      <img
        key={artworkUrl}
        src={artworkUrl}
        alt=""
        aria-hidden
        className={`fsp-breathe pointer-events-none absolute inset-0 h-full w-full object-cover blur-[90px] saturate-150 ${
          isPlaying ? "" : "[animation-play-state:paused]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <button onClick={minimize} aria-label="Minimize player" className={ghost}>
          <ChevronDownIcon className="h-6 w-6" />
        </button>
        <p className="text-sm font-medium text-white/70">Now playing</p>
        <button onClick={closePlayer} aria-label="Close player" className={ghost}>
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Main */}
      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-6 py-4 lg:flex-row lg:gap-16">
        {/* Cover */}
        <div className="relative w-full max-w-[min(78vw,42vh)] shrink-0 lg:max-w-[min(32vw,60vh)]">
          <div
            className={`relative aspect-square w-full transition-transform duration-700 ease-out ${
              isPlaying ? "scale-100" : "scale-[0.88]"
            }`}
          >
            <img
              src={artworkUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full translate-y-6 scale-95 rounded-[2rem] object-cover opacity-70 blur-2xl"
            />
            <img
              key={artworkUrl}
              src={artworkUrl}
              alt={`Cover art for ${title}`}
              className="relative h-full w-full rounded-[2rem] object-cover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/15"
            />
          </div>
        </div>

        {/* Info + controls */}
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="mb-5 text-center lg:text-left">
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-1.5 truncate text-base text-white/65 sm:text-lg">{artistName}</p>
          </div>

          {/* Seek */}
          <div>
            <input
              type="range"
              className="fsp-range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ ["--p" as any]: `${progress}%` }}
              aria-label="Seek"
            />
            <div className="mt-1 flex justify-between text-xs tabular-nums text-white/60">
              <span>{formatAudioTime(currentTime)}</span>
              <span>{formatAudioTime(duration)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={isShuffle}
              className={`${ghost} ${isShuffle ? "text-white" : "text-white/45"}`}
            >
              <ShuffleIcon className="h-5 w-5" />
            </button>
            <button onClick={previousSong} aria-label="Previous song" className={`${ghost} h-14 w-14`}>
              <PrevIcon className="h-7 w-7" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-neutral-950 shadow-[0_10px_40px_-5px_rgba(255,255,255,0.35)] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8 translate-x-0.5" />}
            </button>
            <button onClick={nextSong} aria-label="Next song" className={`${ghost} h-14 w-14`}>
              <NextIcon className="h-7 w-7" />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeatMode}`}
              className={`${ghost} relative ${repeatMode === "off" ? "text-white/45" : "text-white"}`}
            >
              <RepeatIcon className="h-5 w-5" />
              {repeatMode === "one" && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-neutral-950">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="mt-4 flex items-center gap-3">
            <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className="text-white/70 transition hover:text-white">
              {isMuted || volume === 0 ? <MuteIcon className="h-5 w-5" /> : <VolumeIcon className="h-5 w-5" />}
            </button>
            <input
              type="range"
              className="fsp-range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ ["--p" as any]: `${vol}%` }}
              aria-label="Volume"
            />
          </div>

          {/* Up next */}
          {nextSongCandidate && (
            <button
              onClick={() => playSong(nextSongCandidate, playlist)}
              className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2.5 text-left backdrop-blur-md transition hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-white"
            >
              <img
                src={
                  (Array.isArray(nextSongCandidate.image) && nextSongCandidate.image.at(-1)?.url) ||
                  (typeof nextSongCandidate.image === "string" ? nextSongCandidate.image : "") ||
                  "/placeholder-music.png"
                }
                alt=""
                className="h-11 w-11 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-white/55">Up next</span>
                <span className="block truncate text-sm font-semibold">
                  {nextSongCandidate.name || (nextSongCandidate as any).title}
                </span>
              </span>
            </button>
          )}
        </div>
      </main>

      <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}

export default FullScreenPlayer;
