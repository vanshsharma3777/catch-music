import { Song } from "../types/songs";

export function saveToIndexedDB(song: Song) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("music-db", 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "songId" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      const tx = db.transaction("songs", "readwrite");
      const store = tx.objectStore("songs");

      store.put({
        songId: song.id,
        name: song.name,
        singerId: song.singerId,
        image: song.image,
        duration: song.duration,
        label: song.label,
        url: song.url
      });

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (err) => {
        reject(err);
      };
    };

    request.onerror = reject;
  });
}
