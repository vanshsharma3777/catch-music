"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Play, Pause, Music2, RefreshCw, BookmarkCheck, BookmarkPlus, Home } from "lucide-react";
import { SINGER_DATABASE, Singer } from "../lib/singersDB";
import { Song } from "../types/songs";
import { getCachedSongIds, toggleCacheSong } from "../lib/cacheDb";
import { checkStorageQuota } from "../lib/estimateStorage";
import { usePlayer } from "../../components/player";
import { getSingerSongs } from "../lib/singerSongClient";

interface SingerSongsMap {
  singer: Singer;
  songs: Song[];
}

function FavoriteSingersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const player = usePlayer();

  const [selectedSingers, setSelectedSingers] = useState<Singer[]>([]);
  const [groupedSongs, setGroupedSongs] = useState<SingerSongsMap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remainingStorage, setRemainingStorage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cache Management State
  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState<boolean>(false);

  // Sync cache state on mount
  useEffect(() => {
    async function syncCacheStatus() {
      try {
        const ids = await getCachedSongIds();
        setCachedSongIds(new Set(ids));
        await verifyStorageCapacity();
      } catch (err) {
        console.error("Failed to load cached song IDs:", err);
      }
    }
    syncCacheStatus();
  }, []);

  // Load preferences / URL parameters
  useEffect(() => {
    let singers: Singer[] = [];
    const singersParam = searchParams.get("singers");

    if (singersParam) {
      const ids = singersParam.split(",");
      singers = SINGER_DATABASE.filter((s) => ids.includes(s.id));
    } else {
      const stored = localStorage.getItem("catchmusic_preferences");
      if (stored) {
        try {
          singers = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse preferences from localStorage:", e);
        }
      }
    }

    setSelectedSingers(singers);

    if (singers.length > 0) {
      fetchSongsGroupedBySinger(singers);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const verifyStorageCapacity = async () => {
    const status = await checkStorageQuota();

    if (status) {
      setRemainingStorage(status.remainingMB);
    }
  };

  const flatPlaylist = useMemo(() => {
    return groupedSongs.flatMap((group) => group.songs);
  }, [groupedSongs]);

  const handleToggleCache = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();

    if (isCachingAny) return;

    const songId = String(song.id);
    const isCurrentlyCached = cachedSongIds.has(songId);

    if (!isCurrentlyCached) {
      const status = await checkStorageQuota();
      if (status && status.isLowStorage) {
        alert(
          `Cannot cache track. Device storage is below 3 MB (${status.remainingMB} MB remaining).`
        );
        return;
      }
    }

    setIsCachingAny(true);
    setCachingIds((prev) => new Set(prev).add(songId));

    try {
      const isNowCached = await toggleCacheSong(song, isCurrentlyCached);

      setCachedSongIds((prev) => {
        const updated = new Set(prev);
        if (isNowCached) {
          updated.add(songId);
        } else {
          updated.delete(songId);
        }
        return updated;
      });

      await verifyStorageCapacity();
    } catch (err) {
      console.error("Failed to update track cache status:", err);
    } finally {
      setCachingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(songId);
        return updated;
      });
      setIsCachingAny(false);
    }
  };

  const fetchSongsGroupedBySinger = async (singers: Singer[]) => {
    setIsLoading(true);
    setError(null);
    const valid = singers.filter((s) => s?.name?.trim());
    const bySinger = new Map<string, Song[]>();
    const publish = () => {
      setGroupedSongs(valid.map((s) => ({ singer: s, songs: bySinger.get(s.id) ?? [] })));
      setIsLoading(false); // show the page as soon as the first singer is ready
    };
    try {
      await Promise.all(
        valid.map((singer) =>
          getSingerSongs(singer.name, (songs) => {
            bySinger.set(singer.id, songs);
            publish();
          })
        )
      );
    } catch {
      setError("Failed to load tracks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    player.playSong(song, flatPlaylist);
  };

  const getImageUrl = (song: Song) => {
    if (Array.isArray(song.image)) {
      return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
    }
    return typeof song.image === "string" ? song.image : "/placeholder-music.png";
  };

  return (
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-10 pb-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow-gold),transparent_60%)] pointer-events-none opacity-20" />

      <main className="w-full max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-pri">
              Your Artist <span className="text-accent">Shelves</span>
            </h1>

            <p className="text-xs sm:text-sm text-sec max-w-xl">
              Curated songs categorized singer by singer.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/home")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface hover:bg-bg-ter border border-border-light text-pri transition-colors cursor-pointer"
            >
              <Home size={14} className="text-accent" />
              <span>Back to Home</span>
            </button>

            <div className="text-sm text-sec">
              <span className="font-medium">Available storage:</span>{" "}
              <span className="text-accent font-bold">
                {remainingStorage === null
                  ? "Checking..."
                  : `${remainingStorage.toFixed(2)} MB`}
              </span>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw size={36} className="text-accent animate-spin" />
            <p className="text-sm text-sec font-medium">Loading artist catalogs...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-16 space-y-3 bg-surface rounded-3xl border border-border p-8">
            <Music2 size={40} className="mx-auto text-accent" />
            <h3 className="text-base font-bold text-pri">{error}</h3>
            <button
              onClick={() => fetchSongsGroupedBySinger(selectedSingers)}
              className="mt-2 text-xs font-semibold px-4 py-2 bg-accent text-bg rounded-xl hover:bg-accent-hover transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading &&
          !error &&
          groupedSongs.map(({ singer, songs }) => {
            if (songs.length === 0) return null;

            return (
              <section key={singer.id} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border-light/60 pb-3">
                  <img
                    src={singer.image}
                    alt={singer.name}
                    className="w-10 h-10 rounded-full object-cover border border-border-light"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-pri">{singer.name}</h2>
                    <p className="text-xs text-muted">Top Tracks</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {songs.map((song, idx) => {
                    const isThisPlaying =
                      String(player.currentSong?.id) === String(song.id) &&
                      player.isPlaying;
                    const isCached = cachedSongIds.has(String(song.id));
                    const isCaching = cachingIds.has(String(song.id));

                    return (
                      <div
                        key={`${song.id}-${idx}`}
                        onClick={() => handlePlaySong(song)}
                        className={`group relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                          isThisPlaying
                            ? "border-accent bg-accent/10 shadow-lg"
                            : "border-border-light bg-surface hover:border-accent/40 hover:bg-surface/80"
                        }`}
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3">
                          <img
                            src={getImageUrl(song)}
                            alt={song.name || song.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Cache Action Button */}
                          <button
                            onClick={(e) => handleToggleCache(e, song)}
                            disabled={isCachingAny}
                            title={
                              isCaching
                                ? "Caching in progress..."
                                : isCachingAny
                                ? "Another song is currently caching"
                                : isCached
                                ? "Remove from Cache"
                                : "Cache Song"
                            }
                            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 ${
                              isCachingAny && !isCaching
                                ? "opacity-40 cursor-not-allowed bg-bg/40 text-pri"
                                : isCached
                                ? "bg-accent text-bg"
                                : "bg-bg/60 text-pri hover:bg-bg/90"
                            }`}
                          >
                            {isCaching ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : isCached ? (
                              <BookmarkCheck size={14} />
                            ) : (
                              <BookmarkPlus size={14} />
                            )}
                          </button>

                          <div className="absolute inset-0 bg-bg/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                              {isThisPlaying ? (
                                <Pause size={18} fill="currentColor" />
                              ) : (
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <p
                            className={`text-xs font-bold truncate ${
                              isThisPlaying ? "text-accent" : "text-pri group-hover:text-accent"
                            }`}
                          >
                            {song.name || song.title}
                          </p>
                          <p className="text-[11px] text-muted truncate mt-0.5">{singer.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </main>
    </div>
  );
}

export default function MyFavSingersSongs() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-bg text-pri">
          <RefreshCw size={36} className="text-accent animate-spin" />
          <p className="text-sm text-sec font-medium">Loading page...</p>
        </div>
      }
    >
      <FavoriteSingersContent />
    </Suspense>
  );
}
