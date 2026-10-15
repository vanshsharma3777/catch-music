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

  const getImageUrl = (song: any) => {
    if (Array.isArray(song?.image)) {
      return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
    }
    if (typeof song?.image === "string" && song.image.trim() !== "") {
      return song.image;
    }
    return "/placeholder-music.png";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isInitializing || authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-bg text-pri">
        <RefreshCw size={36} className="text-accent animate-spin" />
        <p className="text-sm text-sec font-medium">Loading your music library...</p>
      </div>
    );
  }

  const userName = session?.user?.name || "Music Lover";

  return (
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-8 pb-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow-gold),transparent_60%)] pointer-events-none opacity-20" />

      <main className="w-full max-w-7xl mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-[1px] shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-surface">
                <Music4 size={20} className="text-accent" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-pri">
                  {getGreeting()},{" "}
                  <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-transparent bg-clip-text">
                    {userName.split(" ")[0]}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-sec mt-0.5">
                Ready for offline listening. Instant play from your device.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {remainingStorage !== null && (
              <div className="text-xs bg-bg-ter border border-border-light px-3.5 py-1.5 rounded-full text-sec flex items-center gap-1.5 shadow-sm">
                <HardDriveDownload size={13} className="text-accent" />
                <span>
                  Storage:{" "}
                  <strong className="text-accent font-bold">
                    {remainingStorage.toFixed(1)} MB free
                  </strong>
                </span>
              </div>
            )}

            <button
              onClick={() => router.push("/favorite-singers")}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface hover:bg-bg-ter border border-border-light text-pri transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Headphones size={14} className="text-accent" />
              <span>Artists Shelves</span>
            </button>

            <button
              onClick={() => router.push("/play-offline")}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-surface hover:bg-bg-ter border border-border-light text-pri transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HardDriveDownload size={14} className="text-accent" />
              <span>Offline ({cachedTracks.length})</span>
            </button>

            <button
              onClick={() => router.push("/singer-setup")}
              title="Change your 3 favorite artists"
              className="text-xs font-semibold p-2 rounded-xl bg-surface hover:bg-bg-ter border border-border-light text-muted hover:text-pri transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={14} />
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              className="text-xs font-semibold p-2 rounded-xl bg-surface hover:bg-red-500/10 border border-border-light text-muted hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <section className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              onClick={() => router.push("/play-offline")}
              className="flex items-center gap-4 p-3 rounded-2xl bg-gradient-to-r from-surface to-card border border-border-light hover:border-accent/40 shadow-sm cursor-pointer group transition-all"
            >
              <div className="h-14 w-14 shrink-0 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 text-accent group-hover:scale-105 transition-transform">
                <HardDriveDownload size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted uppercase font-bold tracking-wider">
                  Device Storage
                </p>
                <h3 className="text-sm font-bold text-pri truncate group-hover:text-accent transition-colors">
                  Downloaded Offline Songs
                </h3>
                <p className="text-[11px] text-sec">{cachedTracks.length} tracks cached</p>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-pri mr-1" />
            </div>

            {favoriteSingers.slice(0, 2).map((singer) => (
              <div
                key={singer.id}
                onClick={() => router.push(`/favorite-singers?singers=${singer.id}`)}
                className="flex items-center gap-4 p-3 rounded-2xl bg-gradient-to-r from-surface to-card border border-border-light hover:border-accent/40 shadow-sm cursor-pointer group transition-all"
              >
                <img
                  src={singer.image}
                  alt={singer.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover border border-border-light group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted uppercase font-bold tracking-wider">
                    Favorite Artist
                  </p>
                  <h3 className="text-sm font-bold text-pri truncate group-hover:text-accent transition-colors">
                    {singer.name}
                  </h3>
                  <p className="text-[11px] text-sec">{singer.genre}</p>
                </div>
                <ChevronRight size={16} className="text-muted group-hover:text-pri mr-1" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Clock size={20} className="text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold text-pri">Recently Played</h2>
            </div>
            {recentTracks.length > 0 && (
              <span className="text-xs text-muted">{recentTracks.length} songs</span>
            )}
          </div>

          {recentTracks.length === 0 ? (
            <div className="p-8 rounded-3xl border border-border-light bg-surface text-center space-y-2">
              <Music2 size={32} className="mx-auto text-muted/60" />
              <h3 className="text-sm font-bold text-pri">No recent playback yet</h3>
              <p className="text-xs text-sec max-w-sm mx-auto">
                Play any track from the suggestions below or your artist shelves to build your
                personal recent queue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentTracks.slice(0, 6).map((song, idx) => {
                const isThisPlaying =
                  String(player.currentSong?.id) === String(song.id) && player.isPlaying;
                const isCached = cachedSongIds.has(String(song.id));
                const isCaching = cachingIds.has(String(song.id));

                return (
                  <div
                    key={`recent-${song.id}-${idx}`}
                    onClick={() => handlePlaySong(song)}
                    className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isThisPlaying
                        ? "border-accent bg-accent/10 shadow-lg"
                        : "border-border-light bg-surface hover:border-accent/40 hover:bg-surface/80"
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5">
                      <img
                        src={getImageUrl(song)}
                        alt={song.name || song.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <button
                        onClick={(e) => handleToggleCache(e, song)}
                        disabled={isCachingAny}
                        title={isCached ? "Cached offline" : "Download to offline cache"}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 ${
                          isCached
                            ? "bg-accent text-bg"
                            : "bg-bg/60 text-pri hover:bg-bg/90 opacity-0 group-hover:opacity-100"
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

                      {/* Play overlay */}
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
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {song.artistName || song.primaryArtists || "Artist"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section: Cached Offline Tracks */}
        {cachedTracks.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <HardDriveDownload size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-bold text-pri">
                  Saved For Offline Play
                </h2>
              </div>
              <button
                onClick={() => router.push("/play-offline")}
                className="text-xs text-accent font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({cachedTracks.length})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cachedTracks.slice(0, 6).map((song, idx) => {
                const isThisPlaying =
                  String(player.currentSong?.id) === String(song.id) && player.isPlaying;

                return (
                  <div
                    key={`cached-${song.id}-${idx}`}
                    onClick={() => handlePlaySong(song)}
                    className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isThisPlaying
                        ? "border-accent bg-accent/10 shadow-lg"
                        : "border-border-light bg-surface hover:border-accent/40 hover:bg-surface/80"
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5">
                      <img
                        src={getImageUrl(song)}
                        alt={song.name || song.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <span className="absolute top-2 right-2 p-1 rounded-full bg-accent text-bg shadow-sm">
                        <BookmarkCheck size={12} />
                      </span>

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
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {song.artistName || "Downloaded Track"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Suggestions & Recommended Tracks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-accent" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-pri">
                  Suggested For You
                </h2>
                <p className="text-xs text-sec">
                  Tailored to your favorite artists:{" "}
                  {favoriteSingers.map((s) => s.name).join(", ")}
                </p>
              </div>
            </div>
            {isLoadingSuggestions && (
              <RefreshCw size={16} className="text-accent animate-spin" />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {suggestedTracks.slice(0, 18).map((song, idx) => {
              const isThisPlaying =
                String(player.currentSong?.id) === String(song.id) && player.isPlaying;
              const isCached = cachedSongIds.has(String(song.id));
              const isCaching = cachingIds.has(String(song.id));

              return (
                <div
                  key={`suggested-${song.id}-${idx}`}
                  onClick={() => handlePlaySong(song)}
                  className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isThisPlaying
                      ? "border-accent bg-accent/10 shadow-lg"
                      : "border-border-light bg-surface hover:border-accent/40 hover:bg-surface/80"
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2.5">
                    <img
                      src={getImageUrl(song)}
                      alt={song.name || song.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Cache Action */}
                    <button
                      onClick={(e) => handleToggleCache(e, song)}
                      disabled={isCachingAny}
                      title={
                        isCaching
                          ? "Downloading..."
                          : isCached
                          ? "Cached offline"
                          : "Save offline"
                      }
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 ${
                        isCached
                          ? "bg-accent text-bg"
                          : "bg-bg/60 text-pri hover:bg-bg/90 opacity-0 group-hover:opacity-100"
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
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {song.artistName || "Featured"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Your Selected Artists Shelves */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <User size={20} className="text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold text-pri">
                Your Calibrated Artists
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {favoriteSingers.map((singer) => (
              <div
                key={singer.id}
                onClick={() => router.push(`/favorite-singers?singers=${singer.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border-light bg-surface hover:border-accent/40 shadow-sm cursor-pointer group transition-all"
              >
                <img
                  src={singer.image}
                  alt={singer.name}
                  className="w-16 h-16 rounded-full object-cover border border-border-light group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-pri truncate group-hover:text-accent transition-colors">
                    {singer.name}
                  </h3>
                  <p className="text-xs text-sec truncate">{singer.genre}</p>
                  <p className="text-[11px] text-muted mt-1">Tap to browse full catalog</p>
                </div>
                <ChevronRight size={18} className="text-muted group-hover:text-pri" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
