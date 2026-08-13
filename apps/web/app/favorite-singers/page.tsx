"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Play, Pause, Music2, RefreshCw, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { SINGER_DATABASE, Singer } from "../lib/singersDB";
import FullscreenPlayer from "../../components/FullscreenPlayer";
import SmallScreenPlayer from "../../components/SmallScreenPlayer";
import { Song } from "../types/songs";
import { getCachedSongIds, toggleCacheSong } from "../lib/cacheDb";
import { checkStorageQuota } from "../lib/estimateStorage";

interface SingerSongsMap {
  singer: Singer;
  songs: Song[];
}

function FavoriteSingersContent() {
  const searchParams = useSearchParams();
  const [selectedSingers, setSelectedSingers] = useState<Singer[]>([]);
  const [groupedSongs, setGroupedSongs] = useState<SingerSongsMap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cache Management State
  const [cachedSongIds, setCachedSongIds] = useState<Set<string>>(new Set());
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());
  const [isCachingAny, setIsCachingAny] = useState<boolean>(false);

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);

  // Audio Control States
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [loopMode, setLoopMode] = useState<"off" | "all" | "one">("off");

  const stateRef = useRef({
    currentSong,
    isShuffle,
    loopMode,
    groupedSongs,
    isPlaying,
    audioElement,
  });

  useEffect(() => {
    stateRef.current = {
      currentSong,
      isShuffle,
      loopMode,
      groupedSongs,
      isPlaying,
      audioElement,
    };
  }, [currentSong, isShuffle, loopMode, groupedSongs, isPlaying, audioElement]);

  // Sync cache state on mount
  useEffect(() => {
    async function syncCacheStatus() {
      try {
        const ids = await getCachedSongIds();
        setCachedSongIds(new Set(ids));
        await verifyStorageCapacity(); // Check quota on mount
      } catch (err) {
        console.error("Failed to load cached song IDs:", err);
      }
    }
    syncCacheStatus();
  }, []);

  // Sync Audio Time/Duration & Cleanup on Unmount
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handleLoadedMetadata = () => setDuration(audioElement.duration || 0);
    const handleEnded = () => handleTrackEnded();

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioElement]);

  // Manage body scroll and Escape key binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPlayerExpanded) {
        setIsPlayerExpanded(false);
      }
    };

    if (isPlayerExpanded) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlayerExpanded]);

  // Global Keyboard Controls (Spacebar Toggle)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space" && !isPlayerExpanded) {
        e.preventDefault();
        const { currentSong: activeSong, isPlaying: playing, audioElement: audio } = stateRef.current;
        if (activeSong && audio) {
          if (playing) {
            audio.pause();
            setIsPlaying(false);
          } else {
            audio.play().catch(console.error);
            setIsPlaying(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPlayerExpanded]);

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
    await checkStorageQuota((status) => {
      setStorageWarning(
        `Warning: Storage space is critical (${status.remainingMB} MB remaining). Clear cache to save new tracks.`
      );
    });
  };

  const flatPlaylist = useMemo(() => {
    return groupedSongs.flatMap((group) => group.songs);
  }, [groupedSongs]);

  const handleToggleCache = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();

    // Prevent starting a new caching operation while one is in progress
    if (isCachingAny) return;

    const songId = song.id;
    const isCurrentlyCached = cachedSongIds.has(songId);

    // Pre-flight check before caching a new track
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

      // Re-verify storage state after adding/removing cached item
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

  try {
    const validArtists = singers.filter(
      (singer) => singer?.name && singer.name.trim() !== ""
    );

    const requests = validArtists.map(async (singer: Singer) => {

      const payload = {
        query: singer.name.trim(),
        limit: 25,
      };

      try {
        const response = await axios.post(
          "/api/search/songs",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const resData = response.data;

        if (resData.success && Array.isArray(resData.data)) {
          const mappedSongs = resData.data.map((song: Song) => ({
            ...song,
            artistName: singer.name,
          }));

          return {
            singer: singer,
            songs: mappedSongs,
          };
        }

        return {
          singer: singer,
          songs: [],
        };
      } catch (error: any) {
        console.warn(
          `[API Warning] Failed to fetch songs for ${singer.name}:`,
          error?.response?.data || error.message
        );

        return {
          singer: singer,
          songs: [],
        };
      }
    });

    const results = await Promise.all(requests);

    setGroupedSongs(results);
  } catch (err) {
    console.error("[Axios Error] Failed to fetch grouped songs:", err);
    setError("Failed to load tracks. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const playTrack = (song: Song) => {
    const audioUrl = getAudioUrl(song);
    if (!audioUrl) {
      alert("Audio stream not available for this track.");
      return;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    const newAudio = new Audio(audioUrl);
    newAudio.volume = isMuted ? 0 : volume;
    newAudio.muted = isMuted;

    newAudio.play().catch((e) => console.error("Playback failed:", e));

    setAudioElement(newAudio);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioElement?.pause();
        setIsPlaying(false);
      } else {
        audioElement?.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }
    playTrack(song);
  };

  const handleNextSong = () => {
    const { currentSong: activeSong, isShuffle: shuffle } = stateRef.current;
    if (!flatPlaylist.length || !activeSong) return;

    let nextTrack: Song | undefined;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * flatPlaylist.length);
      nextTrack = flatPlaylist[randomIndex];
    } else {
      const currentIndex = flatPlaylist.findIndex((s) => s.id === activeSong.id);
      const nextIndex = (currentIndex + 1) % flatPlaylist.length;
      nextTrack = flatPlaylist[nextIndex];
    }

    if (nextTrack) playTrack(nextTrack);
  };

  const handlePreviousSong = () => {
    const { currentSong: activeSong } = stateRef.current;
    if (!flatPlaylist.length || !activeSong) return;

    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }

    const currentIndex = flatPlaylist.findIndex((s) => s.id === activeSong.id);
    const prevIndex = (currentIndex - 1 + flatPlaylist.length) % flatPlaylist.length;
    const prevTrack = flatPlaylist[prevIndex];

    if (prevTrack) playTrack(prevTrack);
  };

  const handleTrackEnded = () => {
    const { loopMode: currentLoop, audioElement: audio } = stateRef.current;

    if (currentLoop === "one") {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
      return;
    }

    handleNextSong();
  };

  const handleVolumeChange = (newVolume: number) => {
    const val = Math.max(0, Math.min(1, newVolume));
    setVolume(val);
    if (audioElement) audioElement.volume = val;
    if (val > 0 && isMuted) {
      setIsMuted(false);
      if (audioElement) audioElement.muted = false;
    }
  };

  const handleToggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    if (audioElement) audioElement.muted = nextMuteState;
  };

  const handleToggleLoop = () => {
    setLoopMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  };

  const handleToggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleSeek = (timeInSeconds: number) => {
    if (audioElement) {
      audioElement.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  const getImageUrl = (song: Song) => {
    if (Array.isArray(song.image)) {
      return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
    }
    return typeof song.image === "string" ? song.image : "/placeholder-music.png";
  };

  const getAudioUrl = (song: Song) => {
    if (Array.isArray(song.downloadUrl)) {
      return song.downloadUrl[song.downloadUrl.length - 1]?.url || "";
    }
    return typeof song.downloadUrl === "string" ? song.downloadUrl : "";
  };

  return (
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-10 pb-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow-gold),transparent_60%)] pointer-events-none opacity-20" />

      <main className="w-full max-w-7xl mx-auto space-y-12 relative z-10">
        {storageWarning && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>{storageWarning}</span>
            <button
              onClick={() => setStorageWarning(null)}
              className="text-xs text-red-300 hover:text-white underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-pri">
              Your Artist <span className="text-accent">Shelves</span>
            </h1>
            <p className="text-xs sm:text-sm text-sec max-w-xl">
              Curated songs categorized singer by singer.
            </p>
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
                    const isThisPlaying = currentSong?.id === song.id && isPlaying;
                    const isCached = cachedSongIds.has(song.id);
                    const isCaching = cachingIds.has(song.id);

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

      {isPlayerExpanded && currentSong && (
        <FullscreenPlayer
          song={currentSong}
          isPlaying={isPlaying}
          audioElement={audioElement}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isShuffle={isShuffle}
          loopMode={loopMode}
          onTogglePlay={() => handlePlaySong(currentSong)}
          onNext={handleNextSong}
          onPrevious={handlePreviousSong}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleLoop={handleToggleLoop}
          onToggleShuffle={handleToggleShuffle}
          onMinimize={() => setIsPlayerExpanded(false)}
          getImageUrl={getImageUrl}
        />
      )}

      {currentSong && !isPlayerExpanded && (
        <SmallScreenPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          audioElement={audioElement}
          isMuted={isMuted}
          onTogglePlay={() => handlePlaySong(currentSong)}
          onNext={handleNextSong}
          onPrevious={handlePreviousSong}
          onToggleMute={handleToggleMute}
          onExpand={() => setIsPlayerExpanded(true)}
          getImageUrl={getImageUrl}
        />
      )}
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
