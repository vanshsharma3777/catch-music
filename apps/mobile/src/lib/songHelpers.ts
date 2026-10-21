import type { Song } from "../types/song";

const NAMED: Record<string, string> = { quot: '"', amp: "&", apos: "'", lt: "<", gt: ">", nbsp: " " };

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
  const primary = song.artists?.primary?.map((a) => a.name).filter(Boolean);
  if (primary && primary.length) return decodeHtml(primary.join(", "));
  if (song.primaryArtists) return decodeHtml(song.primaryArtists);
  if (song.artistName) return decodeHtml(song.artistName);
  return "Unknown Artist";
}

export function getSongImage(song?: Song | null, pref: "thumb" | "full" = "full"): string {
  const img = song?.image;
  if (Array.isArray(img)) {
    if (img.length === 0) return "";
    const i = pref === "thumb" ? Math.min(1, img.length - 1) : img.length - 1;
    return img[i]?.url || img[img.length - 1]?.url || "";
  }
  return typeof img === "string" ? img : "";
}

const AUDIO_EXT = /\.(mp3|mp4|m4a|aac|ogg|opus|wav|flac|webm)(\?|#|$)/i;

export function getAudioUrl(song?: Song | null): string {
  if (!song) return "";
  const d = song.downloadUrl;
  if (Array.isArray(d) && d.length > 0) return d[d.length - 1]?.url || "";
  if (typeof d === "string" && d.trim()) return d;
  if (typeof song.url === "string" && AUDIO_EXT.test(song.url)) return song.url;
  return "";
}

export function formatTime(seconds?: number | string | null): string {
  const n = Math.floor(Number(seconds));
  if (!Number.isFinite(n) || n < 0) return "0:00";
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export const sameSong = (a?: Song | null, b?: Song | null) =>
  !!a && !!b && String(a.id) === String(b.id);

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}