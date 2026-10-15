"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import {
  Play,
  Pause,
  HardDriveDownload,
  BookmarkCheck,
  BookmarkPlus,
  RefreshCw,
  Music2,
  Music4,
  Clock,
  Sparkles,
  User,
  LogOut,
  ChevronRight,
  Headphones,
  SlidersHorizontal,
} from "lucide-react";

import { usePlayer } from "../../components/player";
import { Song } from "../types/songs";
import { Singer } from "../lib/singersDB";
import { getAllSongs, getCachedSongIds, toggleCacheSong } from "../lib/cacheDb";
import { getRecentSongs } from "../lib/recentSongs";
import { checkStorageQuota } from "../lib/estimateStorage";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getImageUrl = (song: any): string => {
  if (Array.isArray(song?.image)) {
    return song.image[song.image.length - 1]?.url || "";
  }
  if (typeof song?.image === "string" && song.image.trim() !== "") {
    return song.image;
  }
  return "";
};

const hueFromText = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
};

/**
 * Image with a built-in default. If the URL is empty or fails to load,
 * a gradient tile (unique per name) with an icon is shown instead.
 */
function CoverImage({
  src,
  name,
  kind = "song",
  className = "",
}: {
  src?: string;
  name?: string;
  kind?: "song" | "singer";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    const hue = hueFromText(name || "catchmusic");
    const Icon = kind === "singer" ? User : Music2;
    return (
      <div
        role="img"
        aria-label={name || "Default artwork"}
        className={`relative flex items-center justify-center overflow-hidden text-white/90 ${className}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 48%), hsl(${(hue + 55) % 360} 70% 28%))`,
        }}
      >
        <span className="absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-white/15 blur-xl" />
        <Icon className="relative h-2/5 w-2/5" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

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
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/25">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-pri sm:text-2xl">{title}</h2>
          {subtitle && <p className="truncate text-xs text-sec">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Song card (single component replaces three duplicated blocks)       */
/* ------------------------------------------------------------------ */

function SongCard({
  song,
  isPlaying,
  isCached,
  isCaching,
  disableCache,
  fallbackArtist,
  onPlay,
  onToggleCache,
  className = "",
}: {
  song: Song;
  isPlaying: boolean;
  isCached: boolean;
  isCaching: boolean;
  disableCache: boolean;
  fallbackArtist: string;
  onPlay: () => void;
  onToggleCache: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const title = song.name || (song as any).title || "Untitled";
  const artist = song.artistName || (song as any).primaryArtists || fallbackArtist;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter") onPlay();
      }}
      aria-label={`Play ${title}`}
      className={`group cursor-pointer rounded-2xl p-2.5 transition-colors duration-300 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-accent ${
        isPlaying ? "bg-accent/10" : ""
      } ${className}`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-xl shadow-lg ring-1 transition-all duration-300 ${
          isPlaying ? "ring-accent/70 shadow-accent/20" : "ring-white/10"
        }`}
      >
        <CoverImage
          src={getImageUrl(song)}
          name={title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {isPlaying && (
          <span className="absolute bottom-2 left-2 rounded-full bg-bg/80 px-2 py-1.5 backdrop-blur-md">
            <Equalizer />
          </span>
        )}

        <button
          onClick={onToggleCache}
          disabled={disableCache}
          aria-label={isCached ? "Remove from offline" : "Save offline"}
          title={isCaching ? "Downloading..." : isCached ? "Saved offline" : "Save offline"}
          className={`absolute right-2 top-2 z-20 rounded-full p-1.5 backdrop-blur-md transition-all ${
            isCached
              ? "bg-accent text-bg"
              : "bg-bg/60 text-pri opacity-0 hover:bg-bg/90 group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          {isCaching ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : isCached ? (
            <BookmarkCheck size={13} />
          ) : (
            <BookmarkPlus size={13} />
          )}
        </button>

        <span className="absolute bottom-2 right-2 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-accent text-bg opacity-0 shadow-xl shadow-black/40 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {isPlaying ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" className="ml-0.5" />
          )}
        </span>
      </div>

      <div className="mt-2.5 px-0.5">
        <p className={`truncate text-sm font-bold ${isPlaying ? "text-accent" : "text-pri"}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">{artist}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const player = usePlayer();

  // User & Onboarding State
  const [favoriteSingers, setFavoriteSingers] = useState<Singer[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Music Catalog Data
  const [recentTracks, setRecentTracks] = useState<Song[]>([]);
  const [cachedTracks, setCachedTracks] = useState<any[]>([]);
  const [suggestedTracks, setSuggestedTracks] = useState<Song[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Storage & Cache State
  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState(false);
  const [remainingStorage, setRemainingStorage] = useState<number | null>(null);

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

  // Sync recent tracks whenever current song changes
  useEffect(() => {
    if (player.currentSong) {
      setRecentTracks(getRecentSongs());
    }
  }, [player.currentSong]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/signin");
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

                  fetch("/api/user/preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ favoriteSingers: parsed }),
                  }).catch(() => {});
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

        const quota = await checkStorageQuota();
        if (quota) setRemainingStorage(quota.remainingMB);
      } catch (err) {
        console.error("Error loading local catalog:", err);
      }
    };

    loadLocalData();
  }, []);

  const fetchSuggestions = async (singers: Singer[]) => {
    setIsLoadingSuggestions(true);
    try {
      const requests = singers.map(async (singer) => {
        try {
          const response = await axios.post("/api/search/songs", {
            query: singer.name.trim(),
            limit: 8,
          });
          if (response.data.success && Array.isArray(response.data.data)) {
            return response.data.data.map((song: Song) => ({
              ...song,
              artistName: singer.name,
            }));
          }
          return [];
        } catch (e) {
          return [];
        }
      });

      const results = await Promise.all(requests);
      const flattened = results.flat();

      const seen = new Set<string>();
      const unique = flattened.filter((s) => {
        if (!s || !s.id || seen.has(String(s.id))) return false;
        seen.add(String(s.id));
        return true;
      });

      setSuggestedTracks(unique);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
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

      const status = await checkStorageQuota();
      if (status) setRemainingStorage(status.remainingMB);
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

  // "Jump back in" hero pick: latest played, else first suggestion
  const heroSong: Song | undefined = recentTracks[0] || suggestedTracks[0];
  const heroPlaying =
    !!heroSong && String(player.currentSong?.id) === String(heroSong.id) && player.isPlaying;

  const rowClass =
    "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16";
  const rowCard = "w-40 shrink-0 snap-start sm:w-44";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg px-4 py-8 pb-40 text-pri sm:px-8 lg:px-16">
      <style>{`
        .no-scrollbar{scrollbar-width:none}
        .no-scrollbar::-webkit-scrollbar{display:none}
        @keyframes eq{0%,100%{height:25%}50%{height:100%}}
        .eq-bar{height:30%;animation:eq 0.9s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.eq-bar{animation:none;height:60%}}
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,var(--glow-gold),transparent_65%)] opacity-30" />
      <div className="pointer-events-none absolute -left-32 top-64 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-14">
        {/* ---------------- Top bar ---------------- */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-[1px] shadow-lg shadow-accent/20">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-surface">
                <Music4 size={20} className="text-accent" />
              </div>
            </div>
            <span className="text-lg font-extrabold tracking-tight">CatchMusic</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {remainingStorage !== null && (
              <div className="flex items-center gap-1.5 rounded-full border border-border-light bg-surface/70 px-3.5 py-1.5 text-xs text-sec backdrop-blur">
                <HardDriveDownload size={13} className="text-accent" />
                <span>
                  <strong className="font-bold text-accent">{remainingStorage.toFixed(1)} MB</strong>{" "}
                  free
                </span>
              </div>
            )}
            <button
              onClick={() => router.push("/favorite-singers")}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-light bg-surface/70 px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur transition hover:border-accent/50 hover:bg-bg-ter"
            >
              <Headphones size={14} className="text-accent" />
              Artists
            </button>
            <button
              onClick={() => router.push("/play-offline")}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-light bg-surface/70 px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur transition hover:border-accent/50 hover:bg-bg-ter"
            >
              <HardDriveDownload size={14} className="text-accent" />
              Offline ({cachedTracks.length})
            </button>
            <button
              onClick={() => router.push("/singer-setup")}
              title="Change your favorite artists"
              aria-label="Change your favorite artists"
              className="cursor-pointer rounded-full border border-border-light bg-surface/70 p-2 text-muted backdrop-blur transition hover:border-accent/50 hover:text-pri"
            >
              <SlidersHorizontal size={14} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              aria-label="Sign out"
              className="cursor-pointer rounded-full border border-border-light bg-surface/70 p-2 text-muted backdrop-blur transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* ---------------- Hero ---------------- */}
        <section className="grid items-stretch gap-6 lg:grid-cols-5">
          <div className="flex flex-col justify-center lg:col-span-3">
            <p className="text-sm font-medium text-sec">{getGreeting()}</p>
            <h1 className="mt-1 text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                {userName.split(" ")[0]}
              </span>
              , what are we
              <br className="hidden sm:block" /> listening to?
            </h1>
            <p className="mt-4 max-w-md text-sm text-sec">
              Your music is ready, even offline. Pick up where you left off or try something from your
              favorite artists.
            </p>

            {/* Quick-access chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/play-offline")}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border-light bg-surface/80 py-2 pl-2 pr-4 backdrop-blur transition hover:border-accent/50"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/20 text-accent ring-1 ring-accent/30 transition-transform group-hover:scale-105">
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
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border-light bg-surface/80 py-2 pl-2 pr-4 backdrop-blur transition hover:border-accent/50"
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

          {/* Jump back in: the one big, memorable block */}
          {heroSong && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handlePlaySong(heroSong)}
              onKeyDown={(e) => e.key === "Enter" && handlePlaySong(heroSong)}
              aria-label={`Play ${heroSong.name || (heroSong as any).title}`}
              className="group relative min-h-[280px] cursor-pointer overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 focus-visible:outline-2 focus-visible:outline-accent lg:col-span-2"
            >
              <CoverImage
                src={getImageUrl(heroSong)}
                name={heroSong.name || (heroSong as any).title}
                className="absolute inset-0 h-full w-full scale-110 blur-2xl saturate-150 transition-transform duration-700 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

              <div className="relative flex h-full min-h-[280px] flex-col justify-between p-5">
                <p className="w-fit rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur">
                  {recentTracks[0] ? "Jump back in" : "Start here"}
                </p>

                <div className="flex items-end gap-4">
                  <CoverImage
                    src={getImageUrl(heroSong)}
                    name={heroSong.name || (heroSong as any).title}
                    className="h-24 w-24 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/25 sm:h-28 sm:w-28"
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
        <section className="space-y-4">
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
            <div className="space-y-2 rounded-3xl border border-dashed border-border-light bg-surface/60 p-10 text-center">
              <Music2 size={32} className="mx-auto text-accent/70" />
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

        {/* ---------------- Offline ---------------- */}
        {cachedTracks.length > 0 && (
          <section className="space-y-4">
            <SectionHeader
              icon={<HardDriveDownload size={20} />}
              title="Saved for offline"
              subtitle="Plays instantly, no internet needed"
              right={
                <button
                  onClick={() => router.push("/play-offline")}
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

        {/* ---------------- Suggested ---------------- */}
        <section className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 p-2.5">
                  <div className="aspect-square rounded-xl bg-surface" />
                  <div className="h-3 w-3/4 rounded bg-surface" />
                  <div className="h-3 w-1/2 rounded bg-surface" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {suggestedTracks
                .slice(0, 18)
                .map((song, idx) => renderCard(song, `suggested-${song.id}-${idx}`, "Featured"))}
            </div>
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
                className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border border-border-light bg-surface p-4 text-left transition hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
              >
                <CoverImage
                  src={singer.image}
                  name={singer.name}
                  kind="singer"
                  className="h-20 w-20 shrink-0 rounded-full ring-2 ring-accent/30 transition-transform duration-500 group-hover:scale-105 group-hover:ring-accent"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-pri transition-colors group-hover:text-accent">
                    {singer.name}
                  </h3>
                  <p className="truncate text-xs text-sec">{singer.genre}</p>
                  <p className="mt-1.5 text-xs text-muted">Browse all songs</p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted transition group-hover:translate-x-1 group-hover:text-accent"
                />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
