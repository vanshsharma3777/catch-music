"use client";

import { Play, Pause, BookmarkCheck, BookmarkPlus, RefreshCw } from "lucide-react";

import SongMenu from "./SongMenu";
import { CoverImage, getImageUrl } from "./CoverImage";
import type { Song } from "../app/types/songs";

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

// NOTE: the page that renders this must define the .eq-bar keyframes (home and /suggested do).
export default function SongCard({
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
  const cover = getImageUrl(song);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter") onPlay();
      }}
      aria-label={`Play ${title}`}
      className={`group relative cursor-pointer rounded-3xl p-2.5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-accent ${
        isPlaying ? "bg-white/[0.06]" : ""
      } ${className}`}
    >
      <div className="relative">
        {/* Soft colour glow taken from the cover itself */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-3 bottom-0 top-4 transition-opacity duration-500 ${
            isPlaying ? "opacity-70" : "opacity-0 group-hover:opacity-60"
          }`}
        >
          <CoverImage src={cover} name={title} className="h-full w-full rounded-2xl blur-xl" />
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-[0_12px_30px_-14px_rgba(0,0,0,0.8)]">
          <CoverImage
            src={cover}
            name={title}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {isPlaying && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1.5 backdrop-blur-md">
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
                : "bg-black/45 text-white opacity-0 hover:bg-black/70 group-hover:opacity-100 focus-visible:opacity-100"
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

          <SongMenu
            song={song}
            className="absolute left-2 top-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            isCached={isCached}
            onToggleCache={onToggleCache}
            cacheDisabled={disableCache}
          />

          <span className="absolute bottom-2 right-2 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-accent text-bg opacity-0 shadow-xl shadow-black/40 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {isPlaying ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" className="ml-0.5" />
            )}
          </span>
        </div>
      </div>

      <div className="relative mt-3 px-1">
        <p className={`truncate text-sm font-bold ${isPlaying ? "text-accent" : "text-pri"}`}>
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">{artist}</p>
      </div>
    </div>
  );
}
