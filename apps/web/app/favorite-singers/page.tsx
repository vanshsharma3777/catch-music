"use client";

// app/favorite-singers/page.tsx
import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Music2,
  RefreshCw,
  BookmarkCheck,
  BookmarkPlus,
  Home,
  ChevronDown,
} from "lucide-react";
import { SINGER_DATABASE, Singer } from "../lib/singersDB";
import { Song } from "../types/songs";
import { getCachedSongIds, toggleCacheSong } from "../lib/cacheDb";
import { usePlayer } from "../../components/player";
import { getSingerSongs, getSingerSongsPage } from "../lib/singerSongClient";
import SongMenu from "../../components/SongMenu";
import { AmbientBackground } from "../../components/AmbientBackground";

const STEP = 12; // songs revealed per "See more" click
const MIN_BUFFER = STEP; // songs kept fetched-but-hidden, per singer
const MAX_ROUNDS = 6; // max page fetches in one background refill

// Pagination state for one singer. Page 1 comes from getSingerSongs,
// so the background fetching starts at page 2.
type Pool = {
  nextPage: number;
  limit: number; // last page known to exist (Infinity = unknown)
};

const newPool = (): Pool => ({ nextPage: 2, limit: Infinity });
const hasPages = (p: Pool) => p.nextPage <= p.limit;

// What the UI needs to render one singer's shelf
type Section = {
  songs: Song[]; // everything fetched so far (revealed + buffered)
  visible: number; // how many of them are shown
  fetching: boolean;
  failed: boolean;
  hasMore: boolean;
};

const emptySection: Section = {
  songs: [],
  visible: 0,
  fetching: false,
  failed: false,
  hasMore: true,
};

function FavoriteSingersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const player = usePlayer();

  const [selectedSingers, setSelectedSingers] = useState<Singer[]>([]);
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState<boolean>(false);

  // Refs hold the "live" values so async loops never read stale state
  const pools = useRef<Record<string, Pool>>({});
  const baseRef = useRef<Record<string, Song[]>>({}); // page-1 songs
  const extraRef = useRef<Record<string, Song[]>>({}); // songs from pages 2+
  const seenRef = useRef<Record<string, Set<string>>>({});
  const visibleRef = useRef<Record<string, number>>({});
  const fetchingRef = useRef<Set<string>>(new Set());
  const loadToken = useRef(0); // invalidates old async work on reload

  useEffect(() => {
    async function syncCacheStatus() {
      try {
        const ids = await getCachedSongIds();
        setCachedSongIds(new Set(ids));
      } catch (err) {
        console.error("Failed to load cached song IDs:", err);
      }
    }
    syncCacheStatus();
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const flatPlaylist = useMemo(() => {
    return selectedSingers.flatMap((s) => sections[s.id]?.songs ?? []);
  }, [selectedSingers, sections]);

  const patch = (id: string, partial: Partial<Section>) =>
    setSections((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptySection), ...partial },
    }));

  const handleToggleCache = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();

    if (isCachingAny) return;

    const songId = String(song.id);
    const isCurrentlyCached = cachedSongIds.has(songId);

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

  const allSongsOf = (id: string): Song[] => [
    ...(baseRef.current[id] ?? []),
    ...(extraRef.current[id] ?? []),
  ];

  // Fetches ONE more page for a singer and appends the new songs to its buffer.
  const fetchNextPage = async (singer: Singer) => {
    const id = singer.id;
    const pool = pools.current[id];
    if (!pool || !hasPages(pool)) return;

    const page = pool.nextPage++;
    const { songs, hasMore } = await getSingerSongsPage(singer.name, page);

    if (!hasMore) pool.limit = Math.min(pool.limit, page);
    if (!songs || songs.length === 0) {
      pool.limit = Math.min(pool.limit, page - 1);
      return;
    }

    const seen = seenRef.current[id] ?? new Set<string>();
    seenRef.current[id] = seen;
    const fresh = songs.filter((s: Song) => s?.id && !seen.has(String(s.id)));
    fresh.forEach((s: Song) => seen.add(String(s.id)));
    extraRef.current[id] = [...(extraRef.current[id] ?? []), ...fresh];
  };

  // Background fetch: keeps MIN_BUFFER songs in reserve beyond what is revealed.
  // Keeps fetching page after page until the reserve is full or pages run out.
  const ensureBuffer = async (singer: Singer) => {
    const id = singer.id;
    if (fetchingRef.current.has(id)) return;

    const token = loadToken.current;
    fetchingRef.current.add(id);
    patch(id, { fetching: true });

    let failed = false;
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        const total = allSongsOf(id).length;
        const visible = visibleRef.current[id] ?? 0;
        const pool = pools.current[id];

        if (total - visible >= MIN_BUFFER) break; // reserve is full
        if (!pool || !hasPages(pool)) break; // nothing left to fetch

        try {
          await fetchNextPage(singer);
        } catch (err) {
          console.error(`Load more failed for ${singer.name}:`, err);
          failed = true;
          break; // stop looping; the next click retries
        }

        if (token !== loadToken.current) return; // a reload started: drop results
        patch(id, { songs: allSongsOf(id) });
      }

      if (token === loadToken.current) {
        const pool = pools.current[id];
        patch(id, {
          songs: allSongsOf(id),
          hasMore: !!pool && hasPages(pool),
          failed,
        });
      }
    } finally {
      if (token === loadToken.current) {
        fetchingRef.current.delete(id);
        patch(id, { fetching: false });
      }
    }
  };

  // Reveal the next batch immediately from the reserve, then refill the reserve.
  const handleSeeMore = (singer: Singer) => {
    const id = singer.id;
    const next = (visibleRef.current[id] ?? 0) + STEP;
    visibleRef.current[id] = next;
    patch(id, { visible: next, failed: false });
    void ensureBuffer(singer);
  };

  const fetchSongsGroupedBySinger = async (singers: Singer[]) => {
    const token = ++loadToken.current;
    setIsLoading(true);
    setError(null);

    // reset everything for the new singer set
    pools.current = {};
    baseRef.current = {};
    extraRef.current = {};
    seenRef.current = {};
    visibleRef.current = {};
    fetchingRef.current = new Set();
    setSections({});

    const valid = singers.filter((s) => s?.name?.trim());

    try {
      await Promise.all(
        valid.map(async (singer) => {
          const id = singer.id;

          await getSingerSongs(singer.name, (songs: Song[]) => {
            if (token !== loadToken.current) return;

            baseRef.current[id] = songs;
            const seen = new Set<string>(songs.map((s) => String(s.id)));
            seenRef.current[id] = seen;
            pools.current[id] ??= newPool();
            visibleRef.current[id] = songs.length;

            patch(id, { songs: allSongsOf(id), visible: songs.length });
            setIsLoading(false); // show the page as soon as the first singer is ready
          });

          if (token !== loadToken.current) return;

          // Prefetch the reserve before the user ever clicks "See more"
          pools.current[id] ??= newPool();
          void ensureBuffer(singer);
        })
      );
    } catch {
      if (token === loadToken.current) {
        setError("Failed to load tracks. Please try again.");
      }
    } finally {
      if (token === loadToken.current) setIsLoading(false);
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
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-10 pb-48">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow-gold),transparent_60%)] pointer-events-none opacity-20" />
      <AmbientBackground />
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
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface hover:bg-bg-ter border border-border-light text-pri transition-colors cursor-pointer"
            >
              <Home size={14} className="text-accent" />
              <span>Back to Home</span>
            </button>
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
          selectedSingers
            .filter((s) => s?.name?.trim())
            .map((singer) => {
              const sec = sections[singer.id];
              if (!sec || sec.songs.length === 0) return null;

              const shown = sec.songs.slice(0, sec.visible);
              const canSeeMore = sec.songs.length > sec.visible || sec.hasMore;
              // Spinner only when the user asked for more than has arrived yet.
              const waiting = sec.fetching && sec.songs.length < sec.visible;

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
                    {shown.map((song, idx) => {
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

                            <SongMenu
                              song={song}
                              className="absolute left-2 top-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                              isCached={cachedSongIds.has(String(song.id))}
                              onToggleCache={(e) => handleToggleCache(e, song)}
                              cacheDisabled={isCachingAny}
                            />

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

                  <div className="flex flex-col items-center gap-2 pt-2">
                    {canSeeMore ? (
                      <button
                        onClick={() => handleSeeMore(singer)}
                        disabled={waiting}
                        className="inline-flex h-12 min-w-[10rem] cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 text-sm font-bold text-pri backdrop-blur-xl transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-60"
                      >
                        {waiting ? (
                          <>
                            <RefreshCw size={15} className="animate-spin text-accent" />
                            Loading...
                          </>
                        ) : (
                          <>
                            See more
                            <ChevronDown size={16} className="text-accent" />
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-xs text-muted">You&apos;ve reached the end.</p>
                    )}
                    <p className="text-xs text-muted">{shown.length} songs</p>
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