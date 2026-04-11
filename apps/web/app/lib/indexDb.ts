export function getSong(songId: string) {
  return new Promise<any>((resolve, reject) => {

    const request = indexedDB.open("music-db", 1)

    request.onsuccess = () => {
      const db = request.result

      const tx = db.transaction("songs", "readonly")
      const store = tx.objectStore("songs")

      const getReq = store.get(songId)

      getReq.onsuccess = () => {
        resolve(getReq.result)
      }

      getReq.onerror = reject
    }

    request.onerror = reject

  })
}