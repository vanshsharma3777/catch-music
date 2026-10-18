

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import SongCard from "../components/SongCard";
import { AmbientBackground } from "../components/AmbientBackground";
import {
  Play,
  Pause,
  HardDriveDownload,
  RefreshCw,
  Music2,
  Clock,
  Sparkles,
  User,
  LogOut,
  ChevronRight,
  Headphones,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { usePlayer } from "../components/player";
import { Song } from "./types/songs";
import { Singer } from "./lib/singersDB";
import { getAllSongs, getCachedSongIds, toggleCacheSong } from "./lib/cacheDb";
import { getRecentSongs } from "./lib/recentSongs";
import { checkStorageQuota } from "./lib/estimateStorage";
import { CoverImage, getImageUrl } from "../components/CoverImage";
import HomeSearch from "../components/search/HomeSearch";
import { getSingerSongsPage } from "./lib/singerSongClient";
import axios from "axios";
import Link from "next/link";
import FeedbackPrompt from "../components/landing/FeedbackPrompt";


const HOME_COUNT = 18;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

function SectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent shadow-[0_8px_24px_-10px_var(--accent)]">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-pri sm:text-2xl">{title}</h2>
          {subtitle && (
            <p className="max-w-[16rem] truncate text-xs text-sec sm:max-w-md">{subtitle}</p>
          )}
        </div>
      </div>
      <span
        aria-hidden
        className="hidden h-px flex-1 bg-gradient-to-r from-white/15 to-transparent sm:block"
      />
      <div className="ml-auto shrink-0 sm:ml-0">{right}</div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const player = usePlayer();

  const [favoriteSingers, setFavoriteSingers] = useState<Singer[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [recentTracks, setRecentTracks] = useState<Song[]>([]);
  const [cachedTracks, setCachedTracks] = useState<any[]>([]);
  const [suggestedTracks, setSuggestedTracks] = useState<Song[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);


  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState(false);

  const [searchActive, setSearchActive] = useState(false);

  const allPlayableSongs = useMemo(() => {
    const list: Song[] = [];
    const seen = new Set<string>();

    const append = (songList: any[]) => {
      songList.forEach((s) => {
        if (s && s.id && !seen.has(String(s.id))) {
          seen.add(String(s.id));
          list.push(s);
        }
      });
    };

    append(recentTracks);
    append(suggestedTracks);
    append(cachedTracks);
    return list;
  }, [recentTracks, suggestedTracks, cachedTracks]);

  useEffect(() => {
    if (player.currentSong) {
      setRecentTracks(getRecentSongs());
    }
  }, [player.currentSong]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/about");
      return;
    }

    if (authStatus === "authenticated") {
      const initializeUser = async () => {
        try {
          const res = await fetch("/api/user/preferences");
          const data = await res.json();

          let singers: Singer[] = [];

          if (data.success && data.hasCompletedOnboarding && data.favoriteSingers?.length) {
            singers = data.favoriteSingers;
            localStorage.setItem("catchmusic_preferences", JSON.stringify(singers));
          } else {
            const local = localStorage.getItem("catchmusic_preferences");
            if (local) {
              try {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  singers = parsed;

                  axios
                    .post("/api/user/preferences", {
                      favoriteSingers: parsed,
                    })
                    .then((res) => {
                      console.log("Status:", res.status);
                      console.log("Response:", res.data);
                    })
                    .catch((err) => {
                      console.error("Status:", err.response?.status);
                      console.error("Response:", err.response?.data);
                      console.error("Message:", err.message);
                      console.error("Stack:", err.stack);
                    });
                }
              } catch (e) {}
            }
          }

          if (singers.length === 0) {
            router.replace("/singer-setup");
            return;
          }

          setFavoriteSingers(singers);
          setIsInitializing(false);

          fetchSuggestions(singers);
        } catch (err) {
          console.error("Failed to load user preferences:", err);
          setIsInitializing(false);
        }
      };

      initializeUser();
    }
  }, [authStatus, router]);

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const cached = await getAllSongs();
        setCachedTracks(cached);

        const ids = await getCachedSongIds();
        setCachedSongIds(new Set(ids));

        const recent = getRecentSongs();
        setRecentTracks(recent);
      } catch (err) {
        console.error("Error loading local catalog:", err);
      }
    };

    loadLocalData();
  }, []);

  // First page from each singer, mixed randomly. "See more" opens /suggested.
  const fetchSuggestions = async (singers: Singer[]) => {
    setIsLoadingSuggestions(true);
    try {
      const lists = await Promise.all(
        singers.map(async (singer) => {
          try {
            return (await getSingerSongsPage(singer.name, 1)).songs;
          } catch (err) {
            console.error(`Suggestions failed for ${singer.name}:`, err);
            return [] as Song[];
          }
        })
      );

      const mixed: Song[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < HOME_COUNT && mixed.length < HOME_COUNT; i++) {
        for (const idx of shuffle(lists.map((_, k) => k))) {
          const song = lists[idx]?.[i];
          if (song && song.id && !seen.has(String(song.id))) {
            seen.add(String(song.id));
            mixed.push(song);
          }
        }
      }
      setSuggestedTracks(mixed.slice(0, HOME_COUNT));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    player.playSong(song, allPlayableSongs);
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

      const refreshedCached = await getAllSongs();
      setCachedTracks(refreshedCached);

      await checkStorageQuota();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isInitializing || authStatus === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-bg text-pri">
        <RefreshCw size={36} className="animate-spin text-accent" />
        <p className="text-sm font-medium text-sec">Loading your music library...</p>
      </div>
    );
  }

  const userName = session?.user?.name || "Music Lover";

  const renderCard = (song: Song, key: string, fallbackArtist: string, extra = "") => {
    const id = String(song.id);
    return (
      <SongCard
        key={key}
        song={song}
        isPlaying={String(player.currentSong?.id) === id && player.isPlaying}
        isCached={cachedSongIds.has(id)}
        isCaching={cachingIds.has(id)}
        disableCache={isCachingAny}
        fallbackArtist={fallbackArtist}
        onPlay={() => handlePlaySong(song)}
        onToggleCache={(e) => handleToggleCache(e, song)}
        className={extra}
      />
    );
  };

  const heroSong: Song | undefined = recentTracks[0] || suggestedTracks[0];
  const heroPlaying =
    !!heroSong && String(player.currentSong?.id) === String(heroSong.id) && player.isPlaying;

  const rowClass =
    "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-3 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16";
  const rowCard = "w-40 shrink-0 snap-start sm:w-44";

  const chip =
    "group flex cursor-pointer items-center gap-3 rounded-2xl bg-white/[0.05] py-2 pl-2 pr-4 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09]";
  const pill =
    "flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.12]";
  const iconBtn =
    "cursor-pointer rounded-full bg-white/[0.06] p-2 text-muted backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-pri";

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-bg px-4 py-8 pb-40 text-pri sm:px-8 lg:px-16">
      <style>{`
        .no-scrollbar{scrollbar-width:none}
        .no-scrollbar::-webkit-scrollbar{display:none}
        @keyframes eq{0%,100%{height:25%}50%{height:100%}}
        .eq-bar{height:30%;animation:eq 0.9s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.eq-bar{animation:none;height:60%}}
      `}</style>

      <AmbientBackground />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-14">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-[1px] shadow-[0_8px_30px_-8px_var(--accent)]">

            </div>
            <span className="text-3xl font-extrabold tracking-tight">CatchMusic</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs  backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
            >
              <UserRound size={14} className="text-accent" />

              <span>
                <strong className="font-bold">Profile</strong>
              </span>
            </Link>

            <button onClick={() => router.push("/favorite-singers")} className={pill}>
              <Headphones size={14} className="text-accent" />
              Artists
            </button>
            <button onClick={() => router.push("/offline-play")} className={pill}>
              <HardDriveDownload size={14} className="text-accent" />
              Offline ({cachedTracks.length})
            </button>
            <button
              onClick={() => router.push("/singer-setup")}
              title="Change your favorite artists"
              aria-label="Change your favorite artists"
              className={iconBtn}
            >
              <SlidersHorizontal size={14} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              aria-label="Sign out"
              className={`${iconBtn} hover:!bg-red-500/15 hover:!text-red-400`}
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <HomeSearch
          onActiveChange={setSearchActive}
          cachedSongIds={cachedSongIds}
          cachingIds={cachingIds}
          isCachingAny={isCachingAny}
          onToggleCache={handleToggleCache}
        />

        {!searchActive && (
          <>
            <section className="grid items-stretch gap-6 lg:grid-cols-5">
              <div className="flex flex-col justify-center lg:col-span-3">
                <p className="text-sm font-medium text-sec">{getGreeting()}</p>
                <h1 className="mt-2 text-balance text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                    {userName.split(" ")[0]}
                  </span>
                  , what are we
                  <br className="hidden sm:block" /> listening to?
                </h1>
                <p className="mt-5 max-w-md text-sm text-sec">
                  Your music is ready, even offline. Pick up where you left off or try something from
                  your favorite artists.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => router.push("/offline-play")} className={chip}>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent transition-transform group-hover:scale-105">
                      <HardDriveDownload size={20} />
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-bold text-pri">Offline songs</span>
                      <span className="block text-xs text-sec">{cachedTracks.length} saved</span>
                    </span>
                  </button>

                  {favoriteSingers.slice(0, 2).map((singer) => (
                    <button
                      key={singer.id}
                      onClick={() => router.push(`/favorite-singers?singers=${singer.id}`)}
                      className={chip}
                    >
                      <CoverImage
                        src={singer.image}
                        name={singer.name}
                        kind="singer"
                        className="h-11 w-11 rounded-xl transition-transform group-hover:scale-105"
                      />
                      <span className="min-w-0 text-left">
                        <span className="block max-w-[9rem] truncate text-sm font-bold text-pri">
                          {singer.name}
                        </span>
                        <span className="block max-w-[9rem] truncate text-xs text-sec">
                          {singer.genre}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jump back in */}
              {heroSong && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePlaySong(heroSong)}
                  onKeyDown={(e) => e.key === "Enter" && handlePlaySong(heroSong)}
                  aria-label={`Play ${heroSong.name || (heroSong as any).title}`}
                  className="group relative min-h-[300px] cursor-pointer overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] focus-visible:outline-2 focus-visible:outline-accent lg:col-span-2"
                >
                  <CoverImage
                    src={getImageUrl(heroSong)}
                    name={heroSong.name || (heroSong as any).title}
                    className="absolute inset-0 h-full w-full scale-110 blur-2xl saturate-150 transition-transform duration-700 group-hover:scale-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

                  <div className="relative flex h-full min-h-[300px] flex-col justify-between p-6">
                    <p className="w-fit rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur">
                      {recentTracks[0] ? "Jump back in" : "Start here"}
                    </p>

                    <div className="flex items-end gap-4">
                      <CoverImage
                        src={getImageUrl(heroSong)}
                        name={heroSong.name || (heroSong as any).title}
                        className="h-24 w-24 shrink-0 rounded-2xl shadow-2xl shadow-black/60 sm:h-28 sm:w-28"
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        <h3 className="line-clamp-2 text-xl font-extrabold leading-tight text-white">
                          {heroSong.name || (heroSong as any).title}
                        </h3>
                        <p className="mt-1 truncate text-sm text-white/70">
                          {heroSong.artistName || (heroSong as any).primaryArtists || "Artist"}
                        </p>
                      </div>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-bg shadow-xl shadow-black/40 transition-transform group-hover:scale-110">
                        {heroPlaying ? (
                          <Pause size={24} fill="currentColor" />
                        ) : (
                          <Play size={24} fill="currentColor" className="ml-0.5" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ---------------- Recently played ---------------- */}
            <section className="space-y-3">
              <SectionHeader
                icon={<Clock size={20} />}
                title="Recently played"
                right={
                  recentTracks.length > 0 ? (
                    <span className="text-xs text-muted">{recentTracks.length} songs</span>
                  ) : undefined
                }
              />

              {recentTracks.length === 0 ? (
                <div className="space-y-2 rounded-3xl bg-white/[0.04] p-10 text-center backdrop-blur-xl">
                  <Music2 size={32} className="mx-auto text-accent/80" />
                  <h3 className="text-sm font-bold text-pri">Nothing played yet</h3>
                  <p className="mx-auto max-w-sm text-xs text-sec">
                    Play any song below and it will show up here for quick access.
                  </p>
                </div>
              ) : (
                <div className={rowClass}>
                  {recentTracks
                    .slice(0, 10)
                    .map((song, idx) => renderCard(song, `recent-${song.id}-${idx}`, "Artist", rowCard))}
                </div>
              )}
            </section>

            {cachedTracks.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  icon={<HardDriveDownload size={20} />}
                  title="Saved for offline"
                  subtitle="Plays instantly, no internet needed"
                  right={
                    <button
                      onClick={() => router.push("/offline-play")}
                      className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent hover:underline"
                    >
                      View all ({cachedTracks.length})
                      <ChevronRight size={14} />
                    </button>
                  }
                />
                <div className={rowClass}>
                  {cachedTracks
                    .slice(0, 10)
                    .map((song, idx) =>
                      renderCard(song, `cached-${song.id}-${idx}`, "Downloaded track", rowCard)
                    )}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <SectionHeader
                icon={<Sparkles size={20} />}
                title="Suggested for you"
                subtitle={`Based on ${favoriteSingers.map((s) => s.name).join(", ")}`}
                right={
                  isLoadingSuggestions ? (
                    <RefreshCw size={16} className="animate-spin text-accent" />
                  ) : undefined
                }
              />

              {isLoadingSuggestions && suggestedTracks.length === 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2 rounded-3xl bg-white/[0.04] p-2.5">
                      <div className="aspect-square rounded-2xl bg-white/[0.06]" />
                      <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                      <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {suggestedTracks
                      .slice(0, HOME_COUNT)
                      .map((song, idx) => renderCard(song, `suggested-${song.id}-${idx}`, "Featured"))}
                  </div>

                  {suggestedTracks.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => router.push("/suggested")}
                        className="inline-flex h-12 min-w-[10rem] cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 text-sm font-bold text-pri backdrop-blur-xl transition hover:bg-white/[0.12] active:scale-95"
                      >
                        See more
                        <ChevronRight size={16} className="text-accent" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ---------------- Artists ---------------- */}
            <section className="space-y-4">
              <SectionHeader icon={<User size={20} />} title="Your artists" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {favoriteSingers.map((singer) => (
                  <button
                    key={singer.id}
                    onClick={() => router.push(`/favorite-singers?singers=${singer.id}`)}
                    className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-3xl bg-white/[0.05] p-4 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl transition-opacity duration-300 group-hover:bg-accent/30"
                    />
                    <CoverImage
                      src={singer.image}
                      name={singer.name}
                      kind="singer"
                      className="relative h-20 w-20 shrink-0 rounded-full shadow-[0_10px_26px_-10px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="relative min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-pri transition-colors group-hover:text-accent">
                        {singer.name}
                      </h3>
                      <p className="truncate text-xs text-sec">{singer.genre}</p>
                      <p className="mt-1.5 text-xs text-muted">Browse all songs</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="relative text-muted transition group-hover:translate-x-1 group-hover:text-accent"
                    />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      {authStatus === "authenticated" && <FeedbackPrompt />}
    </div>
  );
}
