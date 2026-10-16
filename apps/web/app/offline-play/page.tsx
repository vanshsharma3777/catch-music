"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  HardDrive,
  Clock,
  Pause,
  Play,
  Search,
  Shuffle,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { usePlayer, formatAudioTime } from "../../components/player";
import { useConnectivity } from "../../components/connectivity/ConnectivityProvider";
import { CoverImage } from "../../components/CoverImage";
import { AmbientBackground } from "../../components/AmbientBackground";
import SongMenu from "../../components/SongMenu";

import { getAllSongs } from "../lib/cacheDb";
import type { OfflineSong } from "../types/OfflineSong";
import type { Song } from "../types/songs";

const MUSIC_CACHE_NAME = "catchmusic-music-v1";

const toPlayable = (s: OfflineSong): Song => ({
  id: s.id,
  name: s.name,
  artistName: s.artistName,
  image: s.image,
  duration: s.duration,
  label: s.label,
  cacheKey: s.cacheKey,
  imageCacheKey: s.imageCacheKey,
});

function Equalizer() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-label="Playing">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function OfflinePlayPage() {
  const router = useRouter();
  const { isOnline, getReturnPath } = useConnectivity();
  const { playSong, currentSong, isPlaying, isShuffle, toggleShuffle } = usePlayer();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let valid: OfflineSong[] = [];
      try {
        valid = await getAllSongs();
      } catch {
        valid = [];
      }

      try {
        const cache = await caches.open(MUSIC_CACHE_NAME);
        const checks = await Promise.all(valid.map((s) => cache.match(s.cacheKey)));
        valid = valid.filter((_, i) => checks[i]);
      } catch {
        // Cache API unavailable: fall back to the manifest as-is.
      }

      if (!cancelled) {
        setSongs(valid.map(toPlayable));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => `${s.name} ${s.artistName ?? ""}`.toLowerCase().includes(q));
  }, [songs, query]);

  const totalSeconds = useMemo(
    () => songs.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
    [songs]
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const playAll = () => {
    if (filtered[0]) playSong(filtered[0], filtered);
  };

  const shuffleAll = () => {
    if (!filtered.length) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)]!;
    if (!isShuffle) toggleShuffle();
    playSong(pick, filtered);
  };

  const goBack = () => router.push(getReturnPath());

  const pill =
    "flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.12] active:scale-95";
  const stat =
    "inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-sec backdrop-blur-xl";

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-bg px-4 pb-40 pt-[max(1.25rem,env(safe-area-inset-top))] text-pri sm:px-8 sm:pt-8 lg:px-16">
      <style>{`
        @keyframes eq{0%,100%{height:25%}50%{height:100%}}
        .eq-bar{height:30%;animation:eq .9s ease-in-out infinite}
        @keyframes ring{0%{transform:scale(.85);opacity:.6}100%{transform:scale(2);opacity:0}}
        .sig-ring{animation:ring 2.8s ease-out infinite}
        @media (prefers-reduced-motion:reduce){
          .eq-bar{animation:none;height:60%}
          .sig-ring{animation:none;opacity:0}
        }
      `}</style>

      <AmbientBackground />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-8 sm:space-y-10">
        {/* Header: same brand block as home */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-[1px] shadow-[0_8px_30px_-8px_var(--accent)] sm:h-11 sm:w-11">
              <img
                src="/cm circular.png"
                alt="CatchMusic Logo"
                className="h-full w-full rounded-[15px] object-cover"
              />
            </div>
            <span className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              CatchMusic
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold backdrop-blur-xl ${
                isOnline ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden min-[380px]:inline">{isOnline ? "Online" : "Offline"}</span>
            </span>

            {isOnline && (
              <button onClick={goBack} className={pill} aria-label="Back to app">
                <ArrowLeft size={14} className="text-accent" />
                <span className="hidden sm:inline">Back to app</span>
              </button>
            )}
          </div>
        </header>

        {/* Hero */}
        <section className="flex items-center gap-4 sm:gap-6">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center sm:h-24 sm:w-24">
            {!isOnline && (
              <>
                <span className="sig-ring absolute inset-0 rounded-full ring-2 ring-accent/40" />
                <span
                  className="sig-ring absolute inset-0 rounded-full ring-2 ring-accent/30"
                  style={{ animationDelay: "1.4s" }}
                />
              </>
            )}
            <div className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-bg shadow-[0_8px_30px_-8px_var(--accent)]">
              {isOnline ? (
                <Wifi className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={1.75} />
              ) : (
                <WifiOff className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={1.75} />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-sec">
              {isOnline ? "You're back online" : "You're offline"}
            </p>
            <h1 className="mt-1 text-balance text-3xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              {isOnline ? (
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                  Connection restored
                </span>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                    No signal.
                  </span>{" "}
                  Still vibing.
                </>
              )}
            </h1>
          </div>
        </section>

        <div className="-mt-3 space-y-4 sm:-mt-4">
          <p className="max-w-md text-sm text-sec">
            {isOnline
              ? "Keep listening to your downloads here, or go back to the full app."
              : "Your downloaded songs play straight from this device. No internet needed."}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className={stat}>
              <HardDrive size={14} className="text-accent" />
              {songs.length} {songs.length === 1 ? "song" : "songs"} saved
            </span>
            {totalSeconds > 0 && (
              <span className={stat}>
                <Clock size={14} className="text-accent" />
                {hours > 0 ? `${hours} hr ` : ""}
                {minutes} min
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        {songs.length > 0 && (
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <button
                onClick={playAll}
                disabled={!filtered.length}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-bg shadow-[0_8px_30px_-10px_var(--accent)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <Play size={16} fill="currentColor" />
                Play all
              </button>

              <button
                onClick={shuffleAll}
                disabled={!filtered.length}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold backdrop-blur-xl transition active:scale-95 disabled:opacity-50 ${
                  isShuffle
                    ? "bg-accent/20 text-accent"
                    : "bg-white/[0.06] text-pri hover:bg-white/[0.12]"
                }`}
              >
                <Shuffle size={16} className={isShuffle ? "" : "text-accent"} />
                Shuffle
              </button>
            </div>

            <label className="relative sm:ml-auto sm:w-80">
              <span className="sr-only">Search downloaded songs</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search downloads"
                className="h-12 w-full rounded-full border border-input-border bg-input pl-11 pr-11 text-base text-pri backdrop-blur-xl placeholder:text-muted focus:border-input-focus focus:outline-none sm:text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:text-pri"
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </section>
        )}

        {/* Songs */}
        <section aria-label="Downloaded songs">
          {loading ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-[76px] animate-pulse rounded-3xl bg-white/[0.04]" />
              ))}
            </ul>
          ) : songs.length === 0 ? (
            <div className="mx-auto max-w-md space-y-3 rounded-3xl bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-10">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Download size={26} />
              </span>
              <h2 className="text-lg font-extrabold">Nothing downloaded yet</h2>
              <p className="text-sm text-sec">
                Tap the bookmark on any song while you&apos;re online. Saved songs show up here.
              </p>
              {isOnline && (
                <button
                  onClick={goBack}
                  className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg transition hover:brightness-110 active:scale-95"
                >
                  <ArrowLeft size={16} />
                  Back to app
                </button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-sec">
              No downloads match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((song) => {
                const active = !!currentSong && String(currentSong.id) === String(song.id);
                const playingNow = active && isPlaying;

                return (
                  <li key={song.id} className="relative">
                    {/* SongMenu stays outside the button to avoid nested interactives */}
                    <button
                      onClick={() => playSong(song, filtered)}
                      aria-label={`${playingNow ? "Pause" : "Play"} ${song.name}`}
                      className={`group flex min-h-[76px] w-full items-center gap-3 rounded-3xl p-2.5 pr-14 text-left backdrop-blur-xl transition duration-300 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent sm:hover:-translate-y-0.5 ${
                        active ? "bg-white/[0.09]" : "bg-white/[0.05] hover:bg-white/[0.09]"
                      }`}
                    >
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)]">
                        <CoverImage
                          src={
                            song.imageCacheKey ||
                            (typeof song.image === "string" ? song.image : "")
                          }
                          name={song.name}
                          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <span
                          className={`absolute inset-0 grid place-items-center bg-black/50 transition ${
                            active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {playingNow ? (
                            <Pause size={18} fill="white" className="text-white" />
                          ) : (
                            <Play size={18} fill="white" className="ml-0.5 text-white" />
                          )}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-bold ${
                            active ? "text-accent" : "text-pri"
                          }`}
                        >
                          {song.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {song.artistName || "Unknown Artist"}
                        </span>
                      </span>

                    </button>

                    <SongMenu
                      song={song}
                      variant="row"
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
