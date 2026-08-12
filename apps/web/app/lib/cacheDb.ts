import { OfflineSong } from "../types/OfflineSong";
import { Song } from "../types/songs";

const MUSIC_CACHE_NAME = "catchmusic-music-v1";
const IMAGE_CACHE_NAME = "catchmusic-images-v1";

const MANIFEST_KEY = "offline-music-manifest";


/*
 * -----------------------------------------
 * Manifest
 * -----------------------------------------
 */

function getManifest(): Record<string, OfflineSong> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const data = localStorage.getItem(MANIFEST_KEY);

    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to read offline manifest:", error);
    return {};
  }
}

function setManifest(manifest: Record<string, OfflineSong>) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    MANIFEST_KEY,
    JSON.stringify(manifest)
  );
}

/*
 * -----------------------------------------
 * Get all offline songs
 * -----------------------------------------
 */

export function getAllSongs(): OfflineSong[] {
  const manifest = getManifest();

  return Object.values(manifest);
}

/*
 * -----------------------------------------
 * Get cached song IDs
 * -----------------------------------------
 */

export function getCachedSongIds(): string[] {
  const manifest = getManifest();

  return Object.keys(manifest);
}

/*
 * -----------------------------------------
 * Check if song exists
 * -----------------------------------------
 */

export function isSongCached(songId: string): boolean {
  const manifest = getManifest();

  return Boolean(manifest[songId]);
}

/*
 * -----------------------------------------
 * Cache a song
 * -----------------------------------------
 */

export async function cacheSong(
  song: Song
): Promise<boolean> {
  const songId = String(song.id);

  try {
    const audioUrl = Array.isArray(song.downloadUrl)
      ? song.downloadUrl[song.downloadUrl.length - 1]?.url
      : song.url || song.downloadUrl;

    if (!audioUrl) {
      throw new Error("Audio URL unavailable");
    }

    /*
     * Open music cache.
     */
    const musicCache = await caches.open(
      MUSIC_CACHE_NAME
    );

    /*
     * Our own predictable cache key.
     */
    const cacheKey = `/cached-music/${songId}`;

    /*
     * Download music.
     */
    console.log(
      `[Offline] Downloading song: ${song.name || song.title}`
    );

    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download audio: ${response.status}`
      );
    }

    /*
     * Store MP3 in Cache Storage.
     */
    await musicCache.put(
      cacheKey,
      response.clone()
    );

    /*
     * -----------------------------------------
     * Artwork
     * -----------------------------------------
     */

    let imageCacheKey: string | undefined;

    const imageUrl = Array.isArray(song.image)
      ? song.image[song.image.length - 1]?.url
      : song.image;

    if (imageUrl) {
      try {
        const imageCache = await caches.open(
          IMAGE_CACHE_NAME
        );

        imageCacheKey = `/cached-artwork/${songId}`;

        const imageResponse = await fetch(imageUrl);

        if (imageResponse.ok) {
          await imageCache.put(
            imageCacheKey,
            imageResponse.clone()
          );
        }
      } catch (error) {
        /*
         * Artwork failure should NOT make
         * music download fail.
         */
        console.warn(
          "[Offline] Artwork download failed:",
          error
        );
      }
    }

    /*
     * -----------------------------------------
     * Save metadata
     * -----------------------------------------
     */

    const manifest = getManifest();

    manifest[songId] = {
      songId,
      id: songId,
      name: song.name,

      artistName:
        song.artistName ||
        song.primaryArtists,

      image:
        imageUrl ||
        "/placeholder-music.png",

      duration: song.duration,

      label: song.label,

      cacheKey,

      imageCacheKey,
    };

    setManifest(manifest);

    console.log(
      `[Offline] Song cached successfully: ${songId}`
    );

    return true;
  } catch (error) {
    console.error(
      `[Offline] Failed to cache song ${songId}:`,
      error
    );

    throw error;
  }
}

/*
 * -----------------------------------------
 * Remove song
 * -----------------------------------------
 */

export async function removeCachedSong(
  songId: string
): Promise<boolean> {
  try {
    const manifest = getManifest();

    const song = manifest[songId];

    if (!song) {
      return false;
    }

    /*
     * Delete MP3.
     */
    const musicCache = await caches.open(
      MUSIC_CACHE_NAME
    );

    await musicCache.delete(
      song.cacheKey
    );

    /*
     * Delete artwork.
     */
    if (song.imageCacheKey) {
      const imageCache = await caches.open(
        IMAGE_CACHE_NAME
      );

      await imageCache.delete(
        song.imageCacheKey
      );
    }

    /*
     * Remove metadata.
     */
    delete manifest[songId];

    setManifest(manifest);

    console.log(
      `[Offline] Removed song: ${songId}`
    );

    return true;
  } catch (error) {
    console.error(
      `[Offline] Failed to remove song ${songId}:`,
      error
    );

    throw error;
  }
}

/*
 * -----------------------------------------
 * Toggle
 * -----------------------------------------
 */

export async function toggleCacheSong(
  song: Song,
  isCached: boolean
): Promise<boolean> {
  if (isCached) {
    await removeCachedSong(
      String(song.id)
    );

    return false;
  }

  await cacheSong(song);

  return true;
}
