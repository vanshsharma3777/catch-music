import type { Song } from "../types/song";

const NAMED: Record<string, string> = { quot: '"', amp: "&", apos: "'", lt: "<", gt: ">", nbsp: " " };

/** The music API returns titles like: Tera Mera Rishta (From &quot;Awarapan 2&quot;) */
export function decodeHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x";
      const code = hex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      } catch {
        return match;
      }
    }
    return NAMED[entity.toLowerCase()] ?? match;
  });
}

export const getSongTitle = (song?: Song | null) =>
  decodeHtml(song?.name || song?.title) || "Untitled";

export function getArtistName(song?: Song | null): string {
  if (!song) return "Unknown Artist";
  if (song.primaryArtists) return decodeHtml(song.primaryArtists);
  const names = song.artists?.primary?.map((a) => decodeHtml(a.name)).filter(Boolean);
  if (names && names.length) return names.join(", ");
  if (song.artistName) return decodeHtml(song.artistName);
  return "Unknown Artist";
}

/** thumb = small/medium (cards), full = highest resolution (full player). */
export function getSongImage(song?: Song | null, size: "thumb" | "full" = "full"): string {
  const img = song?.image;
  if (Array.isArray(img)) {
    if (img.length === 0) return "";
    const i = size === "thumb" ? Math.min(1, img.length - 1) : img.length - 1;
    return img[i]?.url || img[img.length - 1]?.url || "";
  }
  return typeof img === "string" ? img : "";
}

/** Highest quality stream URL, or "" (never returns a web page URL). */
export function getAudioUrl(song?: Song | null): string {
  const d = song?.downloadUrl;
  if (Array.isArray(d) && d.length > 0) return d[d.length - 1]?.url || "";
  if (typeof d === "string") return d;
  return "";
}

export function songDuration(song?: Song | null): number {
  const n = Number(song?.duration);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}