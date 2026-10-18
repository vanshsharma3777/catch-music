"use client";

// app/suggested/page.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ChevronDown, RefreshCw, Sparkles } from "lucide-react";

import { usePlayer } from "../../components/player";
import { AmbientBackground } from "../../components/AmbientBackground";
import SongCard from "../../components/SongCard";
import { Song } from "../types/songs";
import { Singer } from "../lib/singersDB";
import { getCachedSongIds, toggleCacheSong } from "../lib/cacheDb";
import { checkStorageQuota } from "../lib/estimateStorage";
import { getSingerSongsPage } from "../lib/singerSongClient";

// Cards revealed per "See more" click (divisible by 2, 3 and 6 so grid rows stay full)
const STEP = 18;
// Keep at least this many fetched-but-hidden songs in reserve. When the reserve
// drops below it, the next pages are fetched in the background.
const MIN_BUFFER = STEP;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

export default function SuggestedPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const player = usePlayer();

  const [singers, setSingers] = useState<Singer[]>([]);
  // Set when opened as /suggested?singer=Name (e.g. from search): show only that singer
  const [singerParam, setSingerParam] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // background fetch running
  const [fetchFailed, setFetchFailed] = useState(false); // pauses auto-prefetch until next click
  const [hasMoreRemote, setHasMoreRemote] = useState(false);
  const [visibleCount, setVisibleCount] = useState(STEP);

  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState(false);

  // Per-singer paging state. `queue` = fetched but not yet mixed into the list.
  const pools = useRef(new Map<string, { page: number; queue: Song[]; hasMore: boolean }>());
  const seenIds = useRef(new Set<string>());
  const loadToken = useRef(0); // ignores results from a stale/duplicate initial load
  const singersRef = useRef<Singer[]>([]);
  const totalRef = useRef(0); // songs fetched so far (shown + reserve)
  const visibleRef = useRef(STEP); // songs currently revealed
  const fetchingRef = useRef(false); // lock: only one background fetch at a time
  const searchModeRef = useRef(false); // true when opened as /suggested?singer=<what the user searched>

  // In search mode the client labels every song with the searched text, which is
  // wrong for songs by other artists. Put the real artist names back.
  const withRealArtist = (song: Song): Song => {
    const names =
      (song as any).artists?.primary?.map((a: any) => a.name).join(", ") ||
      (song as any).primaryArtists;
    return names ? { ...song, artistName: names } : song;
  };

  // Interleave everything waiting in the queues, round-robin, with the singer
  // order re-randomised every round. Results are appended, never reshuffled.
  const drainQueues = (list: Singer[]): Song[] => {
    const out: Song[] = [];
    let progressed = true;

    while (progressed) {
      progressed = false;
      for (const singer of shuffle(list)) {
        const song = pools.current.get(singer.id)?.queue.shift();
        if (!song) continue;
        progressed = true;

        const id = String(song.id);
        if (!song.id || seenIds.current.has(id)) continue;
        seenIds.current.add(id);
        out.push(searchModeRef.current ? withRealArtist(song) : song);
      }
    }
    return out;
  };

  const loadFirstPage = async (list: Singer[]) => {
    const token = ++loadToken.current;
    setIsLoading(true);
    pools.current.clear();
    seenIds.current.clear();
    visibleRef.current = STEP;
    totalRef.current = 0;
    setVisibleCount(STEP);
    setFetchFailed(false);

    await Promise.all(
      list.map(async (singer) => {
        try {
          const { songs: page, hasMore } = await getSingerSongsPage(singer.name, 1);
          pools.current.set(singer.id, { page: 1, queue: [...page], hasMore });
        } catch (err) {
          console.error(`Failed to load ${singer.name}:`, err);
          pools.current.set(singer.id, { page: 1, queue: [], hasMore: false });
        }
      })
    );

    if (token !== loadToken.current) return;

    const first = drainQueues(list);
    totalRef.current = first.length;
    setSongs(first);
    setHasMoreRemote([...pools.current.values()].some((p) => p.hasMore));
    setIsLoading(false);
  };

  // Auth + favourite singers
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (authStatus !== "authenticated") return;

    (async () => {
      // Opened from search: "See more <singer> songs"
      const only = new URLSearchParams(window.location.search).get("singer")?.trim();
      if (only) {
        const single = [
          { id: only.toLowerCase(), name: only, image: "", genre: "" },
        ] as unknown as Singer[];
        singersRef.current = single;
        searchModeRef.current = true;
        setSingerParam(only);
        setSingers(single);
        await loadFirstPage(single);
        return;
      }

      let list: Singer[] = [];

      try {
        const raw = localStorage.getItem("catchmusic_preferences");
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) list = parsed;
      } catch {}

      if (list.length === 0) {
        try {
          const res = await fetch("/api/user/preferences");
          const data = await res.json();
          if (data.success && data.favoriteSingers?.length) list = data.favoriteSingers;
        } catch {}
      }

      if (list.length === 0) {
        router.replace("/singer-setup");
        return;
      }

      singersRef.current = list;
      setSingers(list);
      await loadFirstPage(list);
    })();
  }, [authStatus, router]);

  // Which songs are already saved offline
  useEffect(() => {
    (async () => {
      try {
        const ids = await getCachedSongIds();
        setCachedSongIds(new Set(ids));
      } catch (err) {
        console.error("Failed to read offline songs:", err);
      }
    })();
  }, []);

  // Background fetch: keeps MIN_BUFFER songs in reserve beyond what is revealed.
  // One page per singer per round, in parallel, mixed randomly and appended.
  const ensureBuffer = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsFetching(true);
    const token = loadToken.current;

    try {
      for (
        let round = 0;
        round < 5 && totalRef.current - visibleRef.current < MIN_BUFFER;
        round++
      ) {
        const list = singersRef.current;
        const active = list.filter((s) => pools.current.get(s.id)?.hasMore);
        if (active.length === 0) break;

        let failed = 0;
        await Promise.all(
          active.map(async (singer) => {
            const pool = pools.current.get(singer.id)!;
            try {
              const { songs: page, hasMore } = await getSingerSongsPage(singer.name, pool.page + 1);
              pool.page += 1;
              pool.hasMore = hasMore;
              pool.queue.push(...page);
            } catch (err) {
              failed++;
              console.error(`Load more failed for ${singer.name}:`, err);
            }
          })
        );

        if (token !== loadToken.current) return; // a reload started: drop these results

        const fresh = drainQueues(list);
        if (fresh.length > 0) {
          totalRef.current += fresh.length;
          setSongs((prev) => [...prev, ...fresh]);
        } else if (failed > 0) {
          setFetchFailed(true); // stop retrying in a loop; next click retries
          break;
        }
      }

      if (token === loadToken.current) {
        setHasMoreRemote([...pools.current.values()].some((p) => p.hasMore));
      }
    } finally {
      fetchingRef.current = false;
      setIsFetching(false);
    }
  };

  // Whenever the reserve runs low (first load, or after "See more"), top it up.
  useEffect(() => {
    if (isLoading || isFetching || fetchFailed || !hasMoreRemote) return;
    if (songs.length - visibleCount < MIN_BUFFER) void ensureBuffer();
  }, [isLoading, isFetching, fetchFailed, hasMoreRemote, songs.length, visibleCount]);

  // Reveal the next batch immediately from the reserve. The effect above then
  // refills the reserve in the background if it dropped below MIN_BUFFER.
  const handleSeeMore = () => {
    setFetchFailed(false);
    const next = visibleCount + STEP;
    visibleRef.current = next;
    setVisibleCount(next);
  };

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
        if (isNowCached) updated.add(songId);
        else updated.delete(songId);
        return updated;
      });
    } catch (err) {
      console.error("Failed to toggle cache:", err);
    } finally {
      setCachingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(songId);
        return updated;
      });
      setIsCachingAny(false);
    }
  };

  // Go to the page the user came from; fall back to home if this page was
  // opened directly (new tab, pasted link) and there is nothing to go back to.
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const canSeeMore = songs.length > visibleCount || hasMoreRemote;
  // Spinner only when the user asked for more than has arrived yet.
  const waiting = isFetching && songs.length < visibleCount;
  const shown = songs.slice(0, visibleCount);

  const pill =
    "flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.12] active:scale-95";

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-bg px-4 pb-40 pt-[max(1.25rem,env(safe-area-inset-top))] text-pri sm:px-8 sm:pt-8 lg:px-16">
      <style>{`
        @keyframes eq{0%,100%{height:25%}50%{height:100%}}
        .eq-bar{height:30%;animation:eq 0.9s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.eq-bar{animation:none;height:60%}}
      `}</style>

      <AmbientBackground />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
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

          <button onClick={goBack} className={pill} aria-label="Go back">
            <ArrowLeft size={14} className="text-accent" />
            Back
          </button>
        </header>

        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent shadow-[0_8px_24px_-10px_var(--accent)]">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-extrabold capitalize tracking-tight sm:text-4xl">
              {singerParam ? `${singerParam} songs` : "Suggested for you"}
            </h1>
            {singers.length > 0 && (
              <p className="truncate text-xs text-sec sm:text-sm">
                {singerParam
                  ? "More songs matching your search"
                  : `A mix of ${singers.map((s) => s.name).join(", ")}`}
              </p>
            )}
          </div>
        </div>

        {/* Songs */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-3xl bg-white/[0.04] p-2.5">
                <div className="aspect-square rounded-2xl bg-white/[0.06]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="mx-auto max-w-md space-y-2 rounded-3xl bg-white/[0.04] p-10 text-center backdrop-blur-xl">
            <h2 className="text-sm font-bold">No suggestions right now</h2>
            <p className="text-xs text-sec">
              Check your connection and try again, or change your favorite artists from the home
              page.
            </p>
            <button
              onClick={() => loadFirstPage(singers)}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-bg transition hover:brightness-110 active:scale-95"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {shown.map((song, idx) => {
                const id = String(song.id);
                return (
                  <SongCard
                    key={`suggested-${id}-${idx}`}
                    song={song}
                    isPlaying={String(player.currentSong?.id) === id && player.isPlaying}
                    isCached={cachedSongIds.has(id)}
                    isCaching={cachingIds.has(id)}
                    disableCache={isCachingAny}
                    fallbackArtist="Featured"
                    onPlay={() => player.playSong(song, songs)}
                    onToggleCache={(e) => handleToggleCache(e, song)}
                  />
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
              {canSeeMore ? (
                <button
                  onClick={handleSeeMore}
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
          </>
        )}
      </main>
    </div>
  );
}
