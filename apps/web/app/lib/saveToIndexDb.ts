export function saveToIndexedDB(song: any) {
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

      console.log("[DB] Saving metadata:", song.songId);

      store.put({
        songId: song.songId,
        name: song.name,
        singerId: song.singerId,
        image: song.image,
        duration: song.duration,
        label: song.label,
        url: song.url
      });

      tx.oncomplete = () => {
        console.log("[DB] Saved:", song.songId);
        resolve(true);
      };

      tx.onerror = (err) => {
        console.log("[DB] Error:", err);
        reject(err);
      };
    };

    request.onerror = reject;
  });
}