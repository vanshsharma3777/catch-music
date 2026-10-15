"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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

/* ------------------------------------------------------------------ */
/* Vertical volume slider (custom, pointer + keyboard accessible)      */
/* ------------------------------------------------------------------ */
function VerticalSlider({
  value,
  onChange,
  onInteractStart,
  onInteractEnd,
}: {
  value: number; // 0..1
  onChange: (v: number) => void;
  onInteractStart: () => void;
  onInteractEnd: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromPointer = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.min(1, Math.max(0, ratio)));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Volume"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="relative h-36 w-10 cursor-pointer touch-none select-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onInteractStart();
        setFromPointer(e.clientY);
      }}
      onPointerMove={(e) => dragging.current && setFromPointer(e.clientY)}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        onInteractEnd();
      }}
      onPointerCancel={() => {
        dragging.current = false;
        onInteractEnd();
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.1 : 0.05;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          onChange(Math.min(1, value + step));
          onInteractEnd();
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          onChange(Math.max(0, value - step));
          onInteractEnd();
        }
      }}
    >
      {/* rail */}
      <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 overflow-hidden rounded-full bg-white/20">
        <div
          className="absolute inset-x-0 bottom-0 rounded-full bg-white"
          style={{ height: `${value * 100}%` }}
        />
      </div>
      {/* thumb */}
      <div
        className="pointer-events-none absolute left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
        style={{ bottom: `${value * 100}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full screen player                                                  */
/* ------------------------------------------------------------------ */
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

  const [volOpen, setVolOpen] = useState(false);
  const volWrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Restore saved volume once */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fsp_volume");
      if (saved !== null && setVolume) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) setVolume(Math.min(1, Math.max(0, parsed)));
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-hide logic for the volume popover */
  const clearHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => setVolOpen(false), 2500);
  }, [clearHide]);

  useEffect(() => clearHide, [clearHide]);

  /* Close on outside click / Escape */
  useEffect(() => {
    if (!volOpen) return;
    const onDown = (e: PointerEvent) => {
      if (volWrapRef.current && !volWrapRef.current.contains(e.target as Node)) {
        clearHide();
        setVolOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearHide();
        setVolOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [volOpen, clearHide]);

  const toggleVolPanel = () => {
    if (volOpen) {
      clearHide();
      setVolOpen(false);
    } else {
      setVolOpen(true);
      scheduleHide();
    }
  };

  const handleVolumeChange = (v: number) => {
    if (isMuted && v > 0) toggleMute();
    setVolume(v);
    try {
      localStorage.setItem("fsp_volume", v.toString());
    } catch {
      /* ignore */
    }
  };

  if (!currentSong) return null;

  const title = currentSong.name || (currentSong as any).title || "Untitled";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVol = isMuted ? 0 : volume;
  const silent = isMuted || volume === 0;

  const nextImage =
    (Array.isArray(nextSongCandidate?.image) && nextSongCandidate!.image.at(-1)?.url) ||
    (typeof nextSongCandidate?.image === "string" ? nextSongCandidate.image : "") ||
    "/placeholder-music.png";

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
        .fsp-range{-webkit-appearance:none;appearance:none;width:100%;height:24px;background:transparent;cursor:pointer}
        .fsp-range::-webkit-slider-runnable-track{height:5px;border-radius:9999px;background:linear-gradient(to right,#fff var(--p),rgba(255,255,255,.18) var(--p))}
        .fsp-range::-moz-range-track{height:5px;border-radius:9999px;background:rgba(255,255,255,.18)}
        .fsp-range::-moz-range-progress{height:5px;border-radius:9999px;background:#fff}
        .fsp-range::-webkit-slider-thumb{-webkit-appearance:none;width:0;height:0;margin-top:0;box-shadow:none}
        .fsp-range::-moz-range-thumb{width:0;height:0;border:0;background:transparent}
        .fsp-range:hover::-webkit-slider-runnable-track,
        .fsp-range:focus-visible::-webkit-slider-runnable-track{height:7px}
        .fsp-range:hover::-webkit-slider-thumb,
        .fsp-range:focus-visible::-webkit-slider-thumb{width:14px;height:14px;margin-top:-4px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5)}
        .fsp-range:hover::-moz-range-thumb,
        .fsp-range:focus-visible::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff}
        .fsp-range:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:9999px}

        @keyframes fsp-breathe{0%,100%{transform:scale(1.35);opacity:.5}50%{transform:scale(1.55);opacity:.75}}
        @media (prefers-reduced-motion:no-preference){.fsp-breathe{animation:fsp-breathe 8s ease-in-out infinite}}
      `}</style>

      {/* Ambient background */}
      <img
        key={artworkUrl}
        src={artworkUrl}
        alt=""
        aria-hidden
        className={`fsp-breathe pointer-events-none absolute inset-0 h-full w-full object-cover blur-[100px] saturate-150 ${
          isPlaying ? "" : "[animation-play-state:paused]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/90" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-10">
        <button onClick={minimize} aria-label="Minimize player" className={ghost}>
          <ChevronDownIcon className="h-6 w-6" />
        </button>
        <p className="text-sm font-medium text-white/60">Now playing</p>
        <button onClick={closePlayer} aria-label="Close player" className={ghost}>
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-between overflow-y-auto px-6 pb-2 pt-2 sm:px-8">
        {/* Artwork — big */}
        <div className="flex w-full flex-1 items-center justify-center py-3">
          <div
            style={{ width: "min(88vw, max(150px, calc(100dvh - 480px)), 480px)" }}
            className={`relative aspect-square shrink-0 transition-transform duration-700 ease-out ${
              isPlaying ? "scale-100" : "scale-[0.92]"
            }`}
          >
            <img
              src={artworkUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full translate-y-6 scale-95 rounded-[2rem] object-cover opacity-60 blur-2xl"
            />
            <img
              key={artworkUrl}
              src={artworkUrl}
              alt={`Cover art for ${title}`}
              className="relative h-full w-full rounded-[2rem] object-cover shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/15"
            />
          </div>
        </div>

        {/* Title + artist */}
        <div className="w-full">
          <h2 className="line-clamp-2 text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 truncate text-base font-medium text-white/60">{artistName}</p>
        </div>

        {/* Seek */}
        <div className="mt-4 w-full">
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
          <div className="-mt-0.5 flex justify-between text-xs tabular-nums text-white/50">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="mt-3 flex w-full items-center justify-between">
          <button
            onClick={toggleShuffle}
            aria-label="Shuffle"
            aria-pressed={isShuffle}
            className={`${ghost} ${isShuffle ? "text-white" : "text-white/40"}`}
          >
            <ShuffleIcon className="h-5 w-5" />
          </button>

          <button onClick={previousSong} aria-label="Previous song" className={`${ghost} h-12 w-12`}>
            <PrevIcon className="h-7 w-7" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-neutral-950 shadow-[0_10px_36px_rgba(255,255,255,0.22)] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8 translate-x-0.5" />}
          </button>

          <button onClick={nextSong} aria-label="Next song" className={`${ghost} h-12 w-12`}>
            <NextIcon className="h-7 w-7" />
          </button>

          <button
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeatMode}`}
            className={`${ghost} relative ${repeatMode === "off" ? "text-white/40" : "text-white"}`}
          >
            <RepeatIcon className="h-5 w-5" />
            {repeatMode === "one" && (
              <span className="absolute right-1.5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white text-[9px] font-bold text-neutral-950">
                1
              </span>
            )}
          </button>
        </div>

        {/* Bottom row: Up next (left) + volume (right) */}
        <div className="mt-5 flex w-full items-center gap-3">
          {nextSongCandidate ? (
            <button
              onClick={() => playSong(nextSongCandidate, playlist)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2 text-left backdrop-blur-md transition hover:bg-white/[0.13] focus-visible:outline-2 focus-visible:outline-white"
            >
              <img src={nextImage} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-white/50">Up next</span>
                <span className="block truncate text-sm font-semibold">
                  {nextSongCandidate.name || (nextSongCandidate as any).title}
                </span>
              </span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {/* Volume: button + vertical popover */}
          <div ref={volWrapRef} className="relative shrink-0">
            <div
              aria-hidden={!volOpen}
              className={`absolute bottom-full right-1/2 mb-3 flex translate-x-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-neutral-900/80 px-1.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition duration-200 ${
                volOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
              onPointerEnter={clearHide}
              onPointerLeave={() => volOpen && scheduleHide()}
            >
              <span className="text-[11px] font-medium tabular-nums text-white/60">
                {Math.round(effectiveVol * 100)}
              </span>
              <VerticalSlider
                value={effectiveVol}
                onChange={handleVolumeChange}
                onInteractStart={clearHide}
                onInteractEnd={scheduleHide}
              />
              <button
                onClick={() => {
                  toggleMute();
                  scheduleHide();
                }}
                tabIndex={volOpen ? 0 : -1}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              >
                {silent ? <MuteIcon className="h-4 w-4" /> : <VolumeIcon className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={toggleVolPanel}
              aria-label="Volume"
              aria-expanded={volOpen}
              aria-haspopup="true"
              className={`grid h-12 w-12 place-items-center rounded-full border border-white/10 backdrop-blur-md transition active:scale-90 focus-visible:outline-2 focus-visible:outline-white ${
                volOpen ? "bg-white text-neutral-950" : "bg-white/[0.07] text-white hover:bg-white/[0.13]"
              }`}
            >
              {silent ? <MuteIcon className="h-5 w-5" /> : <VolumeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </main>

      <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}

export default FullScreenPlayer;
