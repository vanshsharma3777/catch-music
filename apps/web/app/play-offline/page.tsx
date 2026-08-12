"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, HardDriveDownload, Trash2, Clock, User } from "lucide-react";
import FullscreenPlayer from "../../components/FullscreenPlayer";
import SmallScreenPlayer from "../../components/SmallScreenPlayer";
import { Song } from "../types/songs";
import { getAllSongs, toggleCacheSong } from "../lib/cacheDb";

export default function OfflinePage() {
  const [offlineSongs, setOfflineSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const stateRef = useRef({ currentSong, isShuffle, loopMode, offlineSongs, isPlaying, audioElement });

  useEffect(() => {
    stateRef.current = { currentSong, isShuffle, loopMode, offlineSongs, isPlaying, audioElement };
  }, [currentSong, isShuffle, loopMode, offlineSongs, isPlaying, audioElement]);

  // Lock scroll during full-screen player
  useEffect(() => {
    document.body.style.overflow = isPlayerExpanded ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isPlayerExpanded]);

  // Fetch cached songs from Cache Storage on mount
  const loadSongs = async () => {
    try {
      const songs = await getAllSongs();
      setOfflineSongs(songs);
    } catch (err) {
      console.error("Failed to fetch offline songs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

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
            audio.play();
            setIsPlaying(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPlayerExpanded]);

  useEffect(() => {
    document.body.style.overflow = isPlayerExpanded ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isPlayerExpanded]);
  const playTrack = (song: Song) => {
    if (audioElement) audioElement.pause();

    const newAudio = new Audio(song.url);
    newAudio.volume = isMuted ? 0 : volume;
    newAudio.muted = isMuted;

    newAudio.play().catch((err) => console.error("[PLAYER] Playback failed:", err));

    setAudioElement(newAudio);
    setCurrentSong(song);
    setIsPlaying(true);

    newAudio.onended = () => handleTrackEnded();
  };

  const handlePlaySong = (song: Song) => {
    const activeId =  currentSong?.id;
    const targetId =  song.id;

    if (activeId === targetId) {
      if (isPlaying) {
        audioElement?.pause();
        setIsPlaying(false);
      } else {
        audioElement?.play();
        setIsPlaying(true);
      }
      return;
    }
    playTrack(song);
  };

  const handleDeleteSong = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Stop row click trigger
    try {
      await toggleCacheSong(song, true); // true indicates it is currently cached and should be removed

      // Stop audio if deleting currently active song
      const activeId =currentSong?.id;
      const targetId = song.id;
      if (activeId === targetId && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        setCurrentSong(null);
      }

      // Refresh list
      setOfflineSongs((prev) => prev.filter((s) => (s.id) !== targetId));
    } catch (err) {
      console.error("Failed to delete track:", err);
    }
  };

  const handleNextSong = () => {
    const { currentSong: activeSong, isShuffle: shuffle, offlineSongs: playlist } = stateRef.current;
    if (!playlist.length || !activeSong) return;

    let nextTrack: Song | undefined;
    const activeId =  activeSong.id;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      nextTrack = playlist[randomIndex];
    } else {
      const currentIndex = playlist.findIndex((s) => ( s.id) === activeId);
      const nextIndex = (currentIndex + 1) % playlist.length;
      nextTrack = playlist[nextIndex];
    }

    if (nextTrack) playTrack(nextTrack);
  };

  const handlePreviousSong = () => {
    const { currentSong: activeSong, offlineSongs: playlist } = stateRef.current;
    if (!playlist.length || !activeSong) return;

    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }

    const activeId = activeSong.id;
    const currentIndex = playlist.findIndex((s) => ( s.id) === activeId);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const prevTrack = playlist[prevIndex];

    if (prevTrack) playTrack(prevTrack);
  };


  const handleTrackEnded = () => {
    if (stateRef.current.loopMode === "one" && audioElement) {
      audioElement.currentTime = 0;
      audioElement.play();
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
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (audioElement) audioElement.muted = nextState;
  };

  const handleSeek = (timeInSeconds: number) => {
    if (audioElement) {
      audioElement.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  const getImageUrl = (song: Song): string => {
    if (Array.isArray(song.image)) {
      return song.image[song.image.length - 1]?.url || "/placeholder-music.png";
    }

    if (typeof song.image === "string" && song.image.trim() !== "") {
      return song.image;
    }

    return "/placeholder-music.png";
  };

  const formatDuration = (seconds?: number | string) => {
    if (!seconds) return "--:--";
    const secNum = typeof seconds === "string" ? parseInt(seconds, 10) : seconds;
    if (isNaN(secNum)) return "--:--";
    const mins = Math.floor(secNum / 60);
    const secs = Math.floor(secNum % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="relative min-h-screen bg-bg text-pri px-4 sm:px-8 lg:px-16 py-10 pb-36">
      <main className="w-full max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-3 border-b border-border pb-6">
          <HardDriveDownload size={32} className="text-accent" />
          <div>
            <h1 className="text-3xl font-extrabold text-pri">Offline Music</h1>
            <p className="text-xs text-sec">Songs available for offline playback</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sec text-sm">Loading downloaded tracks...</p>
        ) : offlineSongs.length === 0 ? (
          <p className="text-sec text-sm">No offline songs available.</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted border-b border-border-light">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-5">Title</span>
              <span className="col-span-4">Artist</span>
              <span className="col-span-1 text-center">Duration</span>
              <span className="col-span-1 text-right">Action</span>
            </div>

            {/* Track Rows */}
            {offlineSongs.map((song, idx) => {
              const songKey =song.id || `offline-song-${idx}`;
              const activeKey =  currentSong?.id;
              const isThisPlaying = activeKey === songKey && isPlaying;

              return (
                <div
                  key={songKey}
                  onClick={() => handlePlaySong(song)}
                  className={`group relative flex items-center justify-between md:grid md:grid-cols-12 gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                    isThisPlaying
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border-light bg-surface hover:border-accent/40"
                  }`}
                >
                  {/* Track # & Play Status */}
                  <div className="hidden md:flex items-center justify-center col-span-1">
                    {isThisPlaying ? (
                      <Pause size={16} className="text-accent" fill="currentColor" />
                    ) : (
                      <span className="text-xs text-muted group-hover:hidden">{idx + 1}</span>
                    )}
                    {!isThisPlaying && (
                      <Play size={16} className="hidden group-hover:block text-pri" fill="currentColor" />
                    )}
                  </div>

                  {/* Image & Title */}
                  <div className="flex items-center gap-3 col-span-5">
                    <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                      <img
                        src={getImageUrl(song)}
                        alt={song.name || song.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <p className={`text-sm font-bold truncate ${isThisPlaying ? "text-accent" : "text-pri"}`}>
                        {song.name || song.title}
                      </p>
                      <p className="text-xs text-muted truncate md:hidden">
                        {song.artistName || song.primaryArtists || "Unknown Artist"}
                      </p>
                    </div>
                  </div>

                  {/* Artist Name */}
                  <div className="hidden md:flex items-center col-span-4 text-xs text-sec truncate">
                    <User size={14} className="mr-1.5 text-muted flex-shrink-0" />
                    <span className="truncate">{song.artistName || song.primaryArtists || "Unknown Artist"}</span>
                  </div>

                  {/* Duration */}
                  <div className="hidden md:flex items-center justify-center col-span-1 text-xs text-muted">
                    <Clock size={12} className="mr-1" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end col-span-1">
                    <button
                      onClick={(e) => handleDeleteSong(e, song)}
                      title="Remove from offline cache"
                      className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full-screen Player */}
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
          onToggleLoop={() => setLoopMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"))}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onMinimize={() => setIsPlayerExpanded(false)}
          getImageUrl={getImageUrl}
        />
      )}

      {/* Mini Player */}
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
