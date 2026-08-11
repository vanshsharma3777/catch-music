  "use client";

  import { useEffect, useState } from "react";
  import {
    Play,
    Pause,
    ChevronDown,
    Heart,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
    Repeat,
    Repeat1,
    Shuffle,
} from "lucide-react";
import { Song } from "../app/types/songs";



  interface FullscreenPlayerProps {
    song: Song;
    isPlaying: boolean;
    audioElement: HTMLAudioElement | null;
    currentTime?: number;
    duration?: number;
    volume?: number;
    isMuted?: boolean;
    isShuffle?: boolean;
    loopMode?: "off" | "all" | "one";
    onTogglePlay: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek?: (time: number) => void;
    onVolumeChange?: (vol: number) => void;
    onToggleMute?: () => void;
    onToggleLoop?: () => void;
    onToggleShuffle?: () => void;
    onMinimize: () => void;
      getImageUrl: (song: Song) => string;
  }

  export default function FullscreenPlayer({
    song,
    isPlaying,
    audioElement,
    isShuffle = false,
    loopMode = "off",
    onTogglePlay,
    onNext,
    onPrevious,
    onToggleLoop,
    onToggleShuffle,
    onMinimize,
    getImageUrl,
  }: FullscreenPlayerProps) {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [prevVolume, setPrevVolume] = useState<number>(1);

    // Sync Audio Element Progress and Volume
    useEffect(() => {
      if (!audioElement) return;

      setVolume(audioElement.volume);
      setIsMuted(audioElement.muted);

      const updateProgress = () => {
        setCurrentTime(audioElement.currentTime);
        setDuration(audioElement.duration || 0);
      };

      const handleVolumeChange = () => {
        setVolume(audioElement.volume);
        setIsMuted(audioElement.muted);
      };

      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("loadedmetadata", updateProgress);
      audioElement.addEventListener("volumechange", handleVolumeChange);

      return () => {
        audioElement.removeEventListener("timeupdate", updateProgress);
        audioElement.removeEventListener("loadedmetadata", updateProgress);
        audioElement.removeEventListener("volumechange", handleVolumeChange);
      };
    }, [audioElement]);

    // Global Keyboard Shortcuts (Escape to minimize, Space to toggle play/pause)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Avoid triggering when focused on inputs/textareas
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;

        if (e.key === "Escape") {
          e.preventDefault();
          onMinimize();
        } else if (e.code === "Space") {
          e.preventDefault();
          onTogglePlay();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onMinimize, onTogglePlay]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value);
      if (audioElement) {
        audioElement.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      if (audioElement) {
        audioElement.volume = newVolume;
        audioElement.muted = newVolume === 0;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
      }
    };

    const toggleMute = () => {
      if (!audioElement) return;

      if (isMuted || volume === 0) {
        const restoredVol = prevVolume > 0 ? prevVolume : 1;
        audioElement.volume = restoredVol;
        audioElement.muted = false;
        setVolume(restoredVol);
        setIsMuted(false);
      } else {
        setPrevVolume(volume);
        audioElement.volume = 0;
        audioElement.muted = true;
        setVolume(0);
        setIsMuted(true);
      }
    };

    const formatTime = (secs: number) => {
      if (isNaN(secs) || secs === 0) return "0:00";
      const minutes = Math.floor(secs / 60);
      const seconds = Math.floor(secs % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const coverUrl = getImageUrl(song);
    const effectiveVolume = isMuted ? 0 : volume;

    return (
      <div className="fixed inset-0 z-50 bg-bg backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 animate-in slide-in-from-bottom duration-300">
        {/* Dynamic Blurred Background Ambient Layer */}
        <div
          className="absolute inset-0 -z-10 opacity-30 blur-3xl scale-125 transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${coverUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />

        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
          <button
            onClick={onMinimize}
            className="p-3 rounded-full bg-surface/50 border border-border-light hover:bg-surface text-pri transition-all active:scale-95 cursor-pointer"
            aria-label="Minimize Player"
          >
            <ChevronDown size={24} />
          </button>
          <div className="text-center">
            <p className="text-[10px] tracking-widest uppercase font-bold text-muted">Playing From Artist</p>
            <p className="text-xs font-semibold text-accent">{song.artistName || "Unknown Artist"}</p>
          </div>
          <button className="p-3 text-muted hover:text-accent transition-colors cursor-pointer">
            <Heart size={22} />
          </button>
        </div>

        {/* Main Cover Art Stage */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="relative group w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border-light">
            <img
              src={coverUrl}
              alt={song.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Track Metadata & Audio Controls */}
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Track Title & Interactive Volume Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-pri truncate">
                {song.name }
              </h2>
              <p className="text-sm font-medium text-sec mt-1 truncate">
                {song.artistName || "Unknown Artist"}
              </p>
            </div>

            {/* Sound Control Block */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="text-accent hover:text-accent/80 transition-colors cursor-pointer p-1"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {effectiveVolume === 0 ? (
                  <VolumeX size={20} className="shrink-0 text-muted" />
                ) : (
                  <Volume2 size={20} className="shrink-0" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effectiveVolume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, var(--accent, #3b82f6) ${
                    effectiveVolume * 100
                  }%, var(--surface, #374151) ${effectiveVolume * 100}%)`,
                }}
                className="w-20 sm:w-28 h-1.5 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
                aria-label="Volume Control"
              />
            </div>
          </div>

          {/* Live Duration Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, var(--accent, #3b82f6) ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, var(--surface, #374151) ${
                  duration ? (currentTime / duration) * 100 : 0
                }%)`,
              }}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-accent transition-all [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Primary Playback Controls */}
          <div className="flex pb-5 items-center justify-center gap-6 sm:gap-8 py-2">
            {/* Shuffle Toggle Button */}
            {onToggleShuffle && (
              <button
                onClick={onToggleShuffle}
                className={`p-2 transition-colors cursor-pointer ${
                  isShuffle ? "text-accent" : "text-muted hover:text-pri"
                }`}
                aria-label="Toggle Shuffle"
              >
                <Shuffle size={20} />
              </button>
            )}

            {/* Previous Track Button */}
            <button
              onClick={onPrevious}
              className="text-muted hover:text-pri transition-colors active:scale-95 cursor-pointer p-2"
              aria-label="Previous Track"
            >
              <SkipBack size={28} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              className="h-16 w-16 rounded-full bg-accent text-bg flex items-center justify-center shadow-2xl hover:bg-accent-hover transition-all active:scale-90 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={onNext}
              className="text-muted hover:text-pri transition-colors active:scale-95 cursor-pointer p-2"
              aria-label="Next Track"
            >
              <SkipForward size={28} />
            </button>

            {/* Loop Toggle Button */}
            {onToggleLoop && (
              <button
                onClick={onToggleLoop}
                className={`p-2 transition-colors cursor-pointer ${
                  loopMode !== "off" ? "text-accent" : "text-muted hover:text-pri"
                }`}
                aria-label="Toggle Loop Mode"
              >
                {loopMode === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
