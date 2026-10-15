import type { Song } from "../types/songs";

/** Pure helpers describing a song. Shared by the player, the offline cache and the library UI. */

const AUDIO_EXT = /\.(mp3|mp4|m4a|aac|ogg|opus|wav|flac|webm)(\?|#|$)/i;

/** Remote (network) audio URL, or "" when the song has none. Never returns a web-page URL. */
export function getRemoteAudioUrl(song: Song | null | undefined): string {
  if (!song) return "";
  if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
    return song.downloadUrl[song.downloadUrl.length - 1]?.url || "";
  }
  if (typeof song.downloadUrl === "string" && song.downloadUrl.trim() !== "") {
    return song.downloadUrl;
  }
  if (typeof song.url === "string" && AUDIO_EXT.test(song.url)) return song.url;
  return "";
}

export function getArtistDisplayName(song: Song | null | undefined): string {
  if (!song) return "Unknown Artist";
  if (song.artistName) return song.artistName;
  if (song.primaryArtists) return song.primaryArtists;
  if (song.artists?.primary && song.artists.primary.length > 0) {
    return song.artists.primary.map((a) => a.name).join(", ");
  }
  return "Unknown Artist";
}

export function getSongTitle(song: Song | null | undefined): string {
  return song?.name || song?.title || "Untitled";
}

/** Highest-resolution artwork URL (no placeholder fallback). */
export function getSongImage(song: Song | null | undefined): string {
  if (!song) return "";
  if (song.imageCacheKey) return song.imageCacheKey;
  if (Array.isArray(song.image)) return song.image[song.image.length - 1]?.url || "";
  return typeof song.image === "string" ? song.image : "";
}

export function songDurationSeconds(song: Song | null | undefined): number {
  const n = Number(song?.duration);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Human readable size, e.g. 4.2 MB. */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
