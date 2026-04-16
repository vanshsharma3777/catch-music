"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [cacheSongs, setCacheSongs] = useState<string[]>([]);
  const [dbSongs, setDbSongs] = useState<any[]>([]);

  // 🔹 Get songs from Cache API
  const getCacheSongs = async () => {
    try {
      const cache = await caches.open("music-cache-v1");
      const keys = await cache.keys();

      const audioUrls: string[] = [];

      for (const req of keys) {
        const res = await cache.match(req);
        const type = res?.headers.get("content-type");

        if (type && type.includes("audio")) {
          audioUrls.push(req.url);
        }
      }

      setCacheSongs(audioUrls);
    } catch (err) {
      console.error("Cache error:", err);
    }
  };

  // 🔹 Get songs from IndexedDB
  const getDBSongs = async () => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open("music-db");

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("songs")) {
          resolve();
          return;
        }

        const tx = db.transaction("songs", "readonly");
        const store = tx.objectStore("songs");

        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          setDbSongs(getAllReq.result);
          resolve();
        };
      };

      request.onerror = () => {
        console.error("IndexedDB error");
        resolve();
      };
    });
  };

  useEffect(() => {
    getCacheSongs();
    getDBSongs();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🎧 Debug Cache</h1>

      <h2>📦 Cache Storage Songs ({cacheSongs.length})</h2>
      <ul>
        {cacheSongs.map((url, i) => (
          <li key={i}>
            <a href={url} target="_blank">{url}</a>
          </li>
        ))}
      </ul>

      <h2>💾 IndexedDB Songs ({dbSongs.length})</h2>
      <ul>
        {dbSongs.map((song, i) => (
          <li key={i}>
            {song.name || "No Name"} - {song.id}
          </li>
        ))}
      </ul>
    </div>
  );
}