import type { OfflineSong } from "../types/OfflineSong";
import type { Song } from "../types/songs";
import { getArtistDisplayName, getRemoteAudioUrl, getSongImage, getSongTitle } from "./songMeta";

/**
 * Offline storage for songs the user explicitly downloads.
 *
 *  - Audio + artwork live in the browser's Cache Storage (never uploaded anywhere).
 *  - A small per-user manifest in localStorage lists what is stored, so two accounts sharing a
 *    device never see each other's downloads, while the audio file itself is stored once.
 *  - Only audio URLs that the app already streams and that the browser is allowed to fetch
 *    (CORS) are stored. Nothing here circumvents a source's restrictions: if a download is
 *    refused we surface a clear error instead.
 */

export const MUSIC_CACHE_NAME = "catchmusic-music-v1";
export const IMAGE_CACHE_NAME = "catchmusic-images-v1";
export const OFFLINE_CHANGED_EVENT = "catchmusic:offline-changed";

const LEGACY_MANIFEST_KEY = "offline-music-manifest";
const MANIFEST_PREFIX = "offline-music-manifest:v2:";
const ACTIVE_USER_KEY = "catchmusic_active_user";

const MIN_AUDIO_BYTES = 10_000; // anything smaller is an error page, not a song
const SAFETY_MARGIN_BYTES = 3 * 1024 * 1024;
const FALLBACK_REQUIRED_BYTES = 12 * 1024 * 1024;

export type OfflineErrorCode =
  | "NO_SOURCE"
  | "NOT_AUDIO"
  | "FETCH_FAILED"
  | "OFFLINE"
  | "HTTP"
  | "QUOTA"
  | "ABORTED"
  | "UNSUPPORTED";

export class OfflineError extends Error {
  readonly code: OfflineErrorCode;
  constructor(code: OfflineErrorCode, message: string) {
    super(message);
    this.name = "OfflineError";
    this.code = code;
  }
}

export interface DownloadOptions {
  signal?: AbortSignal;
  /** `total` is null when the server doesn't send Content-Length. */
  onProgress?: (receivedBytes: number, totalBytes: number | null) => void;
}

/* ------------------------------------------------------------------ */
/* Manifest (per user)                                                 */
/* ------------------------------------------------------------------ */

type Manifest = Record<string, OfflineSong>;

const hasWindow = () => typeof window !== "undefined";

export function getActiveUser(): string | null {
  if (!hasWindow()) return null;
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

const keyFor = (userId: string | null) => (userId ? `${MANIFEST_PREFIX}${userId}` : LEGACY_MANIFEST_KEY);

function readManifestKey(key: string): Manifest {
  if (!hasWindow()) return {};
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Manifest) : {};
  } catch (error) {
    console.error("Failed to read offline manifest:", error);
    return {};
  }
}

function writeManifestKey(key: string, manifest: Manifest) {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, JSON.stringify(manifest));
  } catch (error) {
    console.error("Failed to write offline manifest:", error);
    throw new OfflineError("QUOTA", "Your browser has no room left to remember this download.");
  }
}

function emitChanged() {
  if (hasWindow()) window.dispatchEvent(new Event(OFFLINE_CHANGED_EVENT));
}

/**
 * Called by the app when the signed-in user is known. Adopts downloads made before manifests were
 * per-user (legacy key) so nobody loses songs after this update.
 */
export function setActiveUser(userId: string | null) {
  if (!hasWindow()) return;
  try {
    if (userId) localStorage.setItem(ACTIVE_USER_KEY, userId);
    if (userId && localStorage.getItem(LEGACY_MANIFEST_KEY)) {
      const legacy = readManifestKey(LEGACY_MANIFEST_KEY);
      const mine = readManifestKey(keyFor(userId));
      writeManifestKey(keyFor(userId), { ...legacy, ...mine });
      localStorage.removeItem(LEGACY_MANIFEST_KEY);
    }
  } catch (error) {
    console.error("Failed to set active offline user:", error);
  }
  emitChanged();
}

export function getManifest(userId: string | null = getActiveUser()): Manifest {
  return readManifestKey(keyFor(userId));
}

export function getAllSongs(userId: string | null = getActiveUser()): OfflineSong[] {
  return Object.values(getManifest(userId)).sort((a, b) => (b.downloadedAt ?? 0) - (a.downloadedAt ?? 0));
}

export function getCachedSongIds(userId: string | null = getActiveUser()): string[] {
  return Object.keys(getManifest(userId));
}

export function isSongCached(songId: string, userId: string | null = getActiveUser()): boolean {
  return Boolean(getManifest(userId)[String(songId)]);
}

export function getOfflineEntry(songId: string | number, userId: string | null = getActiveUser()) {
  return getManifest(userId)[String(songId)] ?? null;
}

/** Returns the song augmented with local audio/artwork keys when it is downloaded on this device. */
export function withOfflineSource<T extends Song>(song: T): T {
  const entry = getOfflineEntry(song.id);
  if (!entry) return song;
  return { ...song, cacheKey: entry.cacheKey, imageCacheKey: entry.imageCacheKey ?? song.imageCacheKey };
}

function otherManifestsReference(songId: string, exceptKey: string): boolean {
  if (!hasWindow()) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === exceptKey) continue;
      if (key === LEGACY_MANIFEST_KEY || key.startsWith(MANIFEST_PREFIX)) {
        if (readManifestKey(key)[songId]) return true;
      }
    }
  } catch {
    /* treat as unreferenced */
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Capability + storage                                                */
/* ------------------------------------------------------------------ */

export function isOfflineSupported(): boolean {
  return hasWindow() && typeof caches !== "undefined" && typeof fetch === "function";
}

async function remainingStorageBytes(): Promise<number | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return quota > 0 ? Math.max(0, quota - usage) : null;
  } catch {
    return null;
  }
}

/** Total bytes of audio stored for a user (from the manifest; cheap, no cache scan). */
export function getOfflineUsageBytes(userId: string | null = getActiveUser()): number {
  return getAllSongs(userId).reduce((sum, s) => sum + (s.sizeBytes ?? 0), 0);
}

/* ------------------------------------------------------------------ */
/* Download                                                            */
/* ------------------------------------------------------------------ */

const inflight = new Map<string, Promise<OfflineSong>>();

const isAbort = (e: unknown) => (e as { name?: string } | null)?.name === "AbortError";
const isQuota = (e: unknown) => {
  const err = e as { name?: string; code?: number } | null;
  return err?.name === "QuotaExceededError" || err?.code === 22;
};

function looksLikeAudio(contentType: string | null): boolean {
  if (!contentType) return true; // some CDNs omit it; the size check below still guards us
  const type = contentType.toLowerCase();
  if (type.startsWith("text/") || type.includes("json") || type.includes("html") || type.includes("xml")) {
    return false;
  }
  return true;
}

async function readWithProgress(
  response: Response,
  total: number | null,
  opts: DownloadOptions
): Promise<Blob> {
  const type = response.headers.get("content-type") || "audio/mpeg";
  if (!response.body || typeof response.body.getReader !== "function") {
    const blob = await response.blob();
    opts.onProgress?.(blob.size, blob.size);
    return blob.type ? blob : new Blob([blob], { type });
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  try {
    for (;;) {
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value as Uint8Array<ArrayBuffer>);
        received += value.byteLength;
        opts.onProgress?.(received, total);
      }
    }
  } finally {
    reader.releaseLock?.();
  }
  return new Blob(chunks, { type });
}

async function downloadAndStore(song: Song, userId: string | null, opts: DownloadOptions): Promise<OfflineSong> {
  const songId = String(song.id);
  const cacheKey = `/cached-music/${songId}`;

  if (!isOfflineSupported()) {
    throw new OfflineError(
      "UNSUPPORTED",
      "Offline downloads aren't available in this browser (they need a secure https connection and storage access)."
    );
  }

  const musicCache = await caches.open(MUSIC_CACHE_NAME);
  const existing = await musicCache.match(cacheKey);

  let sizeBytes = 0;

  if (existing) {
    // Already on this device (e.g. downloaded by another account): don't download it twice.
    const len = Number(existing.headers.get("content-length"));
    sizeBytes = Number.isFinite(len) && len > 0 ? len : (await existing.clone().blob()).size;
    opts.onProgress?.(sizeBytes, sizeBytes);
  } else {
    const audioUrl = getRemoteAudioUrl(song);
    if (!audioUrl) {
      throw new OfflineError("NO_SOURCE", "This song doesn't have a downloadable audio source.");
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new OfflineError("OFFLINE", "You're offline. Connect to the internet to download songs.");
    }

    let response: Response;
    try {
      response = await fetch(audioUrl, { signal: opts.signal });
    } catch (error) {
      if (isAbort(error)) throw new OfflineError("ABORTED", "Download cancelled.");
      throw new OfflineError(
        "FETCH_FAILED",
        "Couldn't download this song. Its source may not allow downloads, or the connection dropped."
      );
    }

    if (!response.ok) {
      throw new OfflineError("HTTP", `The music server refused the download (error ${response.status}).`);
    }
    if (response.status !== 200) {
      // Cache Storage cannot store partial (206) responses.
      throw new OfflineError("HTTP", "The music server returned a partial file, so it can't be saved offline.");
    }
    if (!looksLikeAudio(response.headers.get("content-type"))) {
      throw new OfflineError("NOT_AUDIO", "The source didn't return an audio file, so it can't be saved offline.");
    }

    const lengthHeader = Number(response.headers.get("content-length"));
    const total = Number.isFinite(lengthHeader) && lengthHeader > 0 ? lengthHeader : null;

    const remaining = await remainingStorageBytes();
    const required = (total ?? FALLBACK_REQUIRED_BYTES) + SAFETY_MARGIN_BYTES;
    if (remaining !== null && remaining < required) {
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
      throw new OfflineError("QUOTA", "Not enough free storage on this device to save this song.");
    }

    let blob: Blob;
    try {
      blob = await readWithProgress(response, total, opts);
    } catch (error) {
      if (isAbort(error)) throw new OfflineError("ABORTED", "Download cancelled.");
      throw new OfflineError("FETCH_FAILED", "The download was interrupted. Please try again.");
    }
    if (blob.size < MIN_AUDIO_BYTES) {
      throw new OfflineError("NOT_AUDIO", "The downloaded file was empty or invalid.");
    }
    if (opts.signal?.aborted) throw new OfflineError("ABORTED", "Download cancelled.");

    sizeBytes = blob.size;
    try {
      await musicCache.put(
        cacheKey,
        new Response(blob, {
          status: 200,
          headers: {
            "Content-Type": blob.type || "audio/mpeg",
            "Content-Length": String(blob.size),
          },
        })
      );
    } catch (error) {
      await musicCache.delete(cacheKey).catch(() => false);
      if (isQuota(error)) throw new OfflineError("QUOTA", "Not enough free storage on this device to save this song.");
      throw new OfflineError("FETCH_FAILED", "Couldn't write the song to this device's storage.");
    }
  }

  // Artwork is best effort: a failure here must never fail the download.
  const imageUrl = getSongImage(song);
  let imageCacheKey: string | undefined;
  if (imageUrl && /^https?:/i.test(imageUrl)) {
    try {
      const imageCache = await caches.open(IMAGE_CACHE_NAME);
      const key = `/cached-artwork/${songId}`;
      if (!(await imageCache.match(key))) {
        const imageResponse = await fetch(imageUrl, { signal: opts.signal });
        if (imageResponse.ok && imageResponse.status === 200) await imageCache.put(key, imageResponse);
      }
      if (await imageCache.match(key)) imageCacheKey = key;
    } catch (error) {
      console.warn("[Offline] Artwork download skipped:", error);
    }
  }

  const entry: OfflineSong = {
    songId,
    id: songId,
    name: getSongTitle(song),
    artistName: getArtistDisplayName(song),
    image: imageUrl || undefined,
    duration: song.duration,
    label: song.label,
    cacheKey,
    imageCacheKey,
    sizeBytes,
    downloadedAt: Date.now(),
  };

  try {
    const key = keyFor(userId);
    const manifest = readManifestKey(key);
    manifest[songId] = entry;
    writeManifestKey(key, manifest);
  } catch (error) {
    // Don't leave an orphan file nobody can reach.
    if (!otherManifestsReference(songId, keyFor(userId))) {
      await musicCache.delete(cacheKey).catch(() => false);
    }
    throw error;
  }

  emitChanged();
  return entry;
}

/**
 * Downloads a song into this device's offline storage for `userId` (default: the active user).
 * Concurrent calls for the same song share one download.
 */
export function cacheSong(
  song: Song,
  options: DownloadOptions & { userId?: string | null } = {}
): Promise<OfflineSong> {
  const userId = options.userId === undefined ? getActiveUser() : options.userId;
  const key = `${userId ?? ""}:${song.id}`;
  const running = inflight.get(key);
  if (running) return running;

  const promise = downloadAndStore(song, userId, options).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** Removes the song for this user. The audio file is only deleted when no other account on this device needs it. */
export async function removeCachedSong(
  songId: string,
  userId: string | null = getActiveUser()
): Promise<boolean> {
  const id = String(songId);
  const key = keyFor(userId);
  const manifest = readManifestKey(key);
  const entry = manifest[id];
  if (!entry) return false;

  delete manifest[id];
  writeManifestKey(key, manifest);

  try {
    if (isOfflineSupported() && !otherManifestsReference(id, key)) {
      const musicCache = await caches.open(MUSIC_CACHE_NAME);
      await musicCache.delete(entry.cacheKey);
      if (entry.imageCacheKey) {
        const imageCache = await caches.open(IMAGE_CACHE_NAME);
        await imageCache.delete(entry.imageCacheKey);
      }
    }
  } catch (error) {
    // The manifest entry is already gone, so the user-visible state is correct; leftover bytes are harmless.
    console.warn(`[Offline] Could not delete cached files for ${id}:`, error);
  }

  emitChanged();
  return true;
}

export async function toggleCacheSong(
  song: Song,
  isCached: boolean,
  options: DownloadOptions & { userId?: string | null } = {}
): Promise<boolean> {
  if (isCached) {
    await removeCachedSong(String(song.id), options.userId);
    return false;
  }
  await cacheSong(song, options);
  return true;
}

/**
 * Browsers may evict Cache Storage under pressure. Drops manifest entries whose audio is gone so the
 * UI never promises an offline song that can't play. Returns the ids that were removed.
 */
export async function reconcileOfflineSongs(userId: string | null = getActiveUser()): Promise<string[]> {
  if (!isOfflineSupported()) return [];
  const key = keyFor(userId);
  const manifest = readManifestKey(key);
  const entries = Object.values(manifest);
  if (entries.length === 0) return [];

  try {
    const cache = await caches.open(MUSIC_CACHE_NAME);
    const present = await Promise.all(entries.map((e) => cache.match(e.cacheKey).then(Boolean)));
    const missing = entries.filter((_, i) => !present[i]).map((e) => e.songId);
    if (missing.length === 0) return [];

    const fresh = readManifestKey(key);
    for (const id of missing) delete fresh[id];
    writeManifestKey(key, fresh);
    emitChanged();
    return missing;
  } catch (error) {
    console.warn("[Offline] Reconcile skipped:", error);
    return [];
  }
}
