import type { Song } from "../types/song";

const decode = (s?: string) =>
  (s ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const AUDIO_EXT = /\.(mp3|mp4|m4a|aac|ogg|opus|wav|flac|webm)(\?|#|$)/i;

/** Best-quality remote audio URL, or "" when the song has none. */
export function getAudioUrl(song?: Song | null): string {
  if (!song) return "";
  const d = song.downloadUrl;
  if (Array.isArray(d) && d.length > 0) return d[d.length - 1]?.url || "";
  if (typeof d === "string" && d.trim() !== "") return d;
  if (typeof song.url === "string" && AUDIO_EXT.test(song.url)) return song.url;
  return "";
}

export function getTitle(song?: Song | null): string {
  return decode(song?.name || song?.title) || "Untitled";
}

export function getArtist(song?: Song | null): string {
  if (!song) return "Unknown artist";
  if (song.artistName) return decode(song.artistName);
  if (song.primaryArtists) return decode(song.primaryArtists);
  const names = song.artists?.primary?.map((a) => decode(a.name)).join(", ");
  return names || "Unknown artist";
}

export function getImage(song?: Song | null): string {
  const img = song?.image;
  if (Array.isArray(img)) return img[img.length - 1]?.url || "";
  return typeof img === "string" ? img : "";
}