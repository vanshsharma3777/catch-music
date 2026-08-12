"use client";

import { useEffect, useState } from "react";

import {
  getAllSongs,
} from "../app/lib/cacheDb";
import { OfflineSong } from "../app/types/OfflineSong";

export default function OfflineMusicPlayer() {
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [currentSong, setCurrentSong] =
    useState<OfflineSong | null>(null);

  const [audioUrl, setAudioUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * Load songs from localStorage.
   */
  useEffect(() => {
    const offlineSongs = getAllSongs();

    setSongs(offlineSongs);

    setLoading(false);
  }, []);

  /*
   * Load actual audio file.
   */
  async function playSong(song: OfflineSong) {
    try {
      setCurrentSong(song);

      /*
       * Get music cache.
       */
      const cache = await caches.open(
        "catchmusic-music-v1"
      );

      /*
       * Find cached MP3.
       */
      const response = await cache.match(
        song.cacheKey
      );

      if (!response) {
        console.error(
          "Cached audio not found:",
          song.cacheKey
        );

        return;
      }

      /*
       * Convert Response → Blob.
       */
      const blob = await response.blob();

      /*
       * Create local browser URL.
       */
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
    } catch (error) {
      console.error(
        "Failed to play offline song:",
        error
      );
    }
  }

  /*
   * Cleanup object URL.
   */
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (loading) {
    return (
      <div>
        Loading offline music...
      </div>
    );
  }

  return (
    <div>
      <h1>CatchMusic Offline</h1>

      <p>
        {songs.length} downloaded song
        {songs.length !== 1 ? "s" : ""}
      </p>

      {songs.length === 0 ? (
        <p>
          No songs are available offline.
        </p>
      ) : (
        <div>
          {songs.map((song) => (
            <div
              key={song.songId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <img
                src={
                  song.imageCacheKey
                    ? song.imageCacheKey
                    : song.image ||
                      "/placeholder-music.png"
                }
                alt={song.name}
                width={50}
                height={50}
              />

              <div>
                <div>{song.name}</div>

                <div>
                  {song.artistName}
                </div>
              </div>

              <button
                onClick={() => playSong(song)}
              >
                Play
              </button>
            </div>
          ))}
        </div>
      )}

      {currentSong && audioUrl && (
        <div>
          <h2>
            {currentSong.name}
          </h2>

          <p>
            {currentSong.artistName}
          </p>

          <audio
            src={audioUrl}
            controls
            autoPlay
          />
        </div>
      )}
    </div>
  );
}
