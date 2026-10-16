"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  HardDrive,
  Music2,
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

import { getAllSongs } from "../lib/cacheDb";
import type { OfflineSong } from "../types/OfflineSong";
import type { Song } from "../types/songs";
import SongMenu from "../../components/SongMenu";

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
          className="op-eq w-[3px] rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export default function OfflinePlayPage() {
  const router = useRouter();
  const { isOnline, getReturnPath } = useConnectivity();

  const {
    playSong,
    currentSong,
    isPlaying,
    isShuffle,
    toggleShuffle,
  } = usePlayer();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const manifest = getAllSongs();
      let valid = manifest;

      try {
        const cache = await caches.open(MUSIC_CACHE_NAME);

        const checks = await Promise.all(
          manifest.map((s) => cache.match(s.cacheKey))
        );

        valid = manifest.filter((_, i) => checks[i]);
      } catch {

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

    return songs.filter((s) =>
      `${s.name} ${s.artistName ?? ""}`.toLowerCase().includes(q)
    );
  }, [songs, query]);

  const totalSeconds = useMemo(
    () => songs.reduce((sum, s) => sum + (Number(s.duration) || 0), 0),
    [songs]
  );

  const playAll = () => {
    if (filtered[0]) {
      playSong(filtered[0], filtered);
    }
  };

  const shuffleAll = () => {
    if (!filtered.length) return;

    const pick = filtered[Math.floor(Math.random() * filtered.length)]!;

    if (!isShuffle) {
      toggleShuffle();
    }

    playSong(pick, filtered);
  };

  const goBack = () => router.push(getReturnPath());

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-pri">
      <style>{`
        @keyframes op-eq {
          0%, 100% { height: 25%; }
          50% { height: 100%; }
        }

        .op-eq {
          height: 30%;
          animation: op-eq .9s ease-in-out infinite;
        }

        @keyframes op-float {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            transform: translate3d(3%,-4%,0) scale(1.1);
          }
        }

        .op-blob {
          animation: op-float 14s ease-in-out infinite;
        }

        @keyframes op-ring {
          0% {
            transform: scale(.8);
            opacity: .7;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        .op-ring {
          animation: op-ring 2.8s ease-out infinite;
        }

        @keyframes op-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .op-rise {
          animation: op-rise .5s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .op-eq {
            animation: none;
            height: 60%;
          }

          .op-blob,
          .op-ring,
          .op-rise {
            animation: none;
          }
        }
      `}</style>

      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="op-blob absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-[100px] sm:h-[28rem] sm:w-[28rem]" />

        <div
          className="op-blob absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-secondary/20 blur-[100px] sm:h-96 sm:w-96"
          style={{ animationDelay: "-6s" }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent,var(--background)_75%)]" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border-light bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          {isOnline ? (
            <button
              onClick={goBack}
              className="op-rise group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-black shadow-primary transition hover:bg-primary-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to app
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                <Music2 className="h-4 w-4" />
              </span>
              Catch Music
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
              isOnline
                ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
                : "bg-amber-400/10 text-amber-300 ring-amber-400/30"
            }`}
          >
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}

            {isOnline ? "Online" : "Offline mode"}
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-40 pt-8 sm:px-6 sm:pt-12">
        {/* Hero */}
        <section className="op-rise flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center sm:h-32 sm:w-32">
            {!isOnline && (
              <>
                <span className="op-ring absolute inset-0 rounded-full ring-2 ring-primary/40" />

                <span
                  className="op-ring absolute inset-0 rounded-full ring-2 ring-primary/30"
                  style={{ animationDelay: "1.4s" }}
                />
              </>
            )}

            <div className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-black shadow-primary">
              {isOnline ? (
                <Wifi
                  className="h-10 w-10 sm:h-14 sm:w-14"
                  strokeWidth={1.75}
                />
              ) : (
                <WifiOff
                  className="h-10 w-10 sm:h-14 sm:w-14"
                  strokeWidth={1.75}
                />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {isOnline ? (
                <>
                  Connection <span className="text-primary">restored</span>
                </>
              ) : (
                <>
                  No signal. <span className="text-primary">Still vibing.</span>
                </>
              )}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-sec sm:text-base">
              {isOnline
                ? "You're back online. Keep listening to your downloads here, or head back to the full app."
                : "Your downloaded songs play straight from your device — no internet needed."}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-sec ring-1 ring-border-light">
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                {songs.length} {songs.length === 1 ? "song" : "songs"} saved
              </span>

              {totalSeconds > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-sec ring-1 ring-border-light">
                  {Math.floor(totalSeconds / 3600) > 0
                    ? `${Math.floor(totalSeconds / 3600)} hr `
                    : ""}
                  {Math.floor((totalSeconds % 3600) / 60)} min of music
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Controls */}
        {songs.length > 0 && (
          <section
            className="op-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex gap-3">
              <button
                onClick={playAll}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-black shadow-primary transition hover:bg-primary-hover active:scale-95 sm:flex-none"
              >
                <Play className="h-4 w-4 fill-current" />
                Play all
              </button>

              <button
                onClick={shuffleAll}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-bold text-pri ring-1 ring-border-light transition hover:bg-card-hover active:scale-95 sm:flex-none"
              >
                <Shuffle className="h-4 w-4 text-primary" />
                Shuffle
              </button>
            </div>

            <label className="relative sm:ml-auto sm:w-72">
              <span className="sr-only">Search downloaded songs</span>

              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search downloads"
                className="w-full rounded-full border border-input-border bg-input py-3 pl-10 pr-10 text-sm text-pri placeholder:text-muted focus:border-input-focus focus:outline-none"
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-pri"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </section>
        )}

        {/* Downloaded songs */}
        <section className="mt-6" aria-label="Downloaded songs">
          {loading ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="h-[72px] animate-pulse rounded-2xl bg-card"
                />
              ))}
            </ul>
          ) : songs.length === 0 ? (
            <div className="op-rise mx-auto mt-6 max-w-md rounded-3xl border border-border-light bg-card/70 p-8 text-center backdrop-blur">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <Download className="h-7 w-7" />
              </span>

              <h2 className="mt-4 text-xl font-extrabold">
                Nothing downloaded yet
              </h2>

              <p className="mt-1.5 text-sm text-sec">
                Save songs while you&apos;re online using the download button,
                and they&apos;ll show up here for offline play.
              </p>

              {isOnline && (
                <button
                  onClick={goBack}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-black transition hover:bg-primary-hover active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to app
                </button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-sec">
              No downloads match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered.map((song, i) => {
                const active =
                  currentSong && String(currentSong.id) === String(song.id);

                const playingNow = active && isPlaying;

                return (
                  <li
                    key={song.id}
                    className="op-rise relative"
                    style={{
                      animationDelay: `${Math.min(i, 12) * 40}ms`,
                    }}
                  >
                    {/* Song card: keep the menu outside this button */}
                    <button
                      onClick={() => playSong(song, filtered)}
                      aria-label={`${playingNow ? "Pause" : "Play"} ${song.name}`}
                      className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 pr-12 text-left ring-1 transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-primary ${
                        active
                          ? "bg-primary/10 ring-primary/40"
                          : "bg-card ring-border-light hover:bg-card-hover hover:ring-border-glow"
                      }`}
                    >
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                        <CoverImage
                          src={
                            song.imageCacheKey ||
                            (typeof song.image === "string" ? song.image : "")
                          }
                          name={song.name}
                          className="h-full w-full"
                        />

                        <span
                          className={`absolute inset-0 grid place-items-center bg-black/50 transition ${
                            active
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {playingNow ? (
                            <Pause className="h-5 w-5 fill-white text-white" />
                          ) : (
                            <Play className="h-5 w-5 fill-white text-white" />
                          )}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-semibold ${
                            active ? "text-primary" : "text-pri"
                          }`}
                        >
                          {song.name}
                        </span>

                        <span className="block truncate text-xs text-sec">
                          {song.artistName || "Unknown Artist"}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-3 pr-1.5">
                        {playingNow && <Equalizer />}

                        {song.duration ? (
                          <span className="text-xs tabular-nums text-muted">
                            {formatAudioTime(song.duration)}
                          </span>
                        ) : null}
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
