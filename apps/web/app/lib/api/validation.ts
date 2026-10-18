import type { Song } from "../../types/songs";

export const LIMITS = {
  playlistName: 100,
  playlistDescription: 500,
  userName: 100,
  userBio: 160,
  imageUrl: 2048,
  imageDataUrl: 400_000,
  feedbackMessage: 1000,
  maxFeedbackPerUser: 5,
  feedbackName: 60,
  maxFeedbackPerIpPerDay: 5,
  songJsonBytes: 30_000,
  maxPlaylistsPerUser: 500,
  maxSongsPerPlaylist: 1000,
  maxReorderIds: 1000,
} as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_RE.test(value);

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

/** Trims, strips control characters and enforces a max length. */
export function checkText(
  value: unknown,
  opts: { label: string; max: number; required?: boolean; multiline?: boolean }
): Checked<string> {
  if (value === undefined || value === null) {
    return opts.required
      ? { ok: false, error: `${opts.label} is required` }
      : { ok: true, value: "" };
  }
  if (typeof value !== "string") return { ok: false, error: `${opts.label} must be text` };

  let text = value.replace(CONTROL_CHARS, "");
  if (!opts.multiline) text = text.replace(/[\r\n\t]+/g, " ");
  text = text.trim();

  if (opts.required && text.length === 0) return { ok: false, error: `${opts.label} cannot be empty` };
  if (text.length > opts.max) {
    return { ok: false, error: `${opts.label} cannot exceed ${opts.max} characters` };
  }
  return { ok: true, value: text };
}

const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Accepts an http(s) URL or a small base64 image data URL. `null`/empty clears the image.
 * Anything else (javascript:, file:, svg data URLs, oversize payloads) is rejected.
 */
export function checkImage(value: unknown): Checked<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Image must be a URL or an image file" };

  const image = value.trim();
  if (image === "") return { ok: true, value: null };

  if (image.startsWith("data:")) {
    if (image.length > LIMITS.imageDataUrl) {
      return { ok: false, error: "Image is too large. Please choose a smaller one." };
    }
    if (!DATA_IMAGE_RE.test(image)) {
      return { ok: false, error: "Unsupported image format. Use PNG, JPEG, WebP or GIF." };
    }
    return { ok: true, value: image };
  }

  if (image.length > LIMITS.imageUrl) return { ok: false, error: "Image URL is too long" };
  try {
    const url = new URL(image);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "Image must be a valid http(s) URL" };
  }
}

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
export function checkUsername(value: unknown): Checked<string | null> {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Username must be text" };
  const username = value.trim().toLowerCase();
  if (username === "") return { ok: true, value: null };
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3-30 characters (letters, numbers, underscores only)",
    };
  }
  return { ok: true, value: username };
}

const str = (v: unknown, max = 500): string | undefined =>
  typeof v === "string" && v.length <= max ? v : undefined;

function cleanImageList(v: unknown): { quality: string; url: string }[] | string | undefined {
  if (typeof v === "string") return str(v, LIMITS.imageUrl);
  if (!Array.isArray(v)) return undefined;
  const list: { quality: string; url: string }[] = [];
  for (const item of v.slice(0, 10)) {
    const rec = item as { quality?: unknown; url?: unknown } | null;
    const url = str(rec?.url, LIMITS.imageUrl);
    if (url) list.push({ quality: str(rec?.quality, 20) ?? "", url });
  }
  return list.length ? list : undefined;
}

/**
 * Whitelists the fields of a client-supplied song before it is stored as JSON.
 * Returns null when the payload is not a usable song.
 */
export function sanitizeSong(input: unknown): Song | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  const s = input as Record<string, unknown>;

  const rawId = typeof s.id === "number" && Number.isFinite(s.id) ? String(s.id) : s.id;
  if (typeof rawId !== "string" || rawId.trim() === "" || rawId.length > 200) return null;

  const name = str(s.name, 300)?.trim() || str(s.title, 300)?.trim() || "Untitled Track";

  const song: Song = { id: rawId.trim(), name };
  const title = str(s.title, 300);
  if (title) song.title = title;
  const singerId = str(s.singerId, 200);
  if (singerId) song.singerId = singerId;
  const type = str(s.type, 50);
  if (type) song.type = type;
  if (typeof s.year === "string" || typeof s.year === "number") song.year = String(s.year).slice(0, 10);
  if (typeof s.duration === "string" || typeof s.duration === "number") song.duration = s.duration;
  const label = str(s.label, 300);
  if (label) song.label = label;
  if (typeof s.explicitContent === "boolean") song.explicitContent = s.explicitContent;
  if (typeof s.playCount === "number" && Number.isFinite(s.playCount)) song.playCount = s.playCount;
  const language = str(s.language, 50);
  if (language) song.language = language;
  if (typeof s.hasLyrics === "boolean") song.hasLyrics = s.hasLyrics;
  const url = str(s.url, LIMITS.imageUrl);
  if (url) song.url = url;
  const image = cleanImageList(s.image);
  if (image) song.image = image;
  const downloadUrl = cleanImageList(s.downloadUrl);
  if (downloadUrl) song.downloadUrl = downloadUrl;
  const primaryArtists = str(s.primaryArtists, 500);
  if (primaryArtists) song.primaryArtists = primaryArtists;
  const artistName = str(s.artistName, 500);
  if (artistName) song.artistName = artistName;

  const artists = s.artists as { primary?: unknown } | null;
  if (artists && Array.isArray(artists.primary)) {
    const primary = artists.primary
      .slice(0, 10)
      .map((a) => str((a as { name?: unknown } | null)?.name, 200))
      .filter((n): n is string => !!n)
      .map((n) => ({ name: n }));
    if (primary.length) song.artists = { primary };
  }

  if (JSON.stringify(song).length > LIMITS.songJsonBytes) return null;
  return song;
}

/** Best artwork URL from stored song JSON (used for generated playlist covers). */
export function songImageUrl(data: unknown): string {
  const image = (data as { image?: unknown } | null)?.image;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const last = image[image.length - 1] as { url?: unknown } | undefined;
    if (typeof last?.url === "string") return last.url;
  }
  return "";
}
