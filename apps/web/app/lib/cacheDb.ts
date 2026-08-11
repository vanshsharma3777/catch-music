import { Song } from "../types/songs";

const CACHE_NAME = "offline-music-cache-v1";
const MANIFEST_KEY = "offline-music-manifest";

// Utility to fetch or create the manifest list stored in localStorage
function getManifest(): Record<string, any> {
  const data = localStorage.getItem(MANIFEST_KEY);
  return data ? JSON.parse(data) : {};
}

function setManifest(manifest: Record<string, any>) {
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

export async function getAllSongs(): Promise<any[]> {
  try {
    const manifest = getManifest();
    const songs = Object.values(manifest);
    console.log(`[CacheStorage] Retrieved ${songs.length} track(s) from Cache Storage.`);
    return songs;
  } catch (err) {
    console.error(`[CacheStorage] Failed to fetch cached songs:`, err);
    return [];
  }
}

export async function getCachedSongIds(): Promise<string[]> {
  const manifest = getManifest();
  const ids = Object.keys(manifest);
  console.log(`[CacheStorage] Cached Song IDs:`, ids);
  return ids;
}

export async function toggleCacheSong(song: Song, isCached: boolean): Promise<boolean> {
  const songId = song.id;

  try {
    const cache = await caches.open(CACHE_NAME);
    const manifest = getManifest();

    if (isCached) {
      console.log(`[CacheStorage] Removing track ID: "${songId}"...`);

      const songData = manifest[songId];
      if (songData?.url) {
        await cache.delete(songData.url); // Delete request from Cache Storage
      }

      delete manifest[songId];
      setManifest(manifest);

      console.log(`[CacheStorage] Successfully deleted track ID: "${songId}".`);
      return false; // Returns new cached state
    } else {
      console.log(`[CacheStorage] Caching track: "${song.name || song.title}" (ID: ${songId})...`);

      const audioUrl = Array.isArray(song.downloadUrl)
        ? song.downloadUrl[song.downloadUrl.length - 1]?.url
        : song.url || song.downloadUrl;

      if (!audioUrl) {
        throw new Error("Audio URL unavailable");
      }

      // Fetch and put the raw Request/Response into Cache Storage
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Store a clone in Cache Storage
      await cache.put(audioUrl, response.clone());

      const imageUrl = Array.isArray(song.image)
        ? song.image[song.image.length - 1]?.url
        : song.image;

      // Store metadata in manifest
      manifest[songId] = {
        songId,
        id: songId,
        name: song.name || song.title,
        artistName: song.artistName || song.primaryArtists,
        image: imageUrl || "/placeholder-music.png",
        url: audioUrl,
        duration: song.duration,
        label: song.label,
      };

      setManifest(manifest);
      console.log(`[CacheStorage] Successfully cached track ID: "${songId}".`);
      return true; // Returns new cached state
    }
  } catch (err) {
    console.error(`[CacheStorage] toggleCacheSong failed for ID "${songId}":`, err);
    throw err;
  }
}
