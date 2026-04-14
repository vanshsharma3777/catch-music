self.addEventListener("install", () => {
  console.log("SW Installed")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("SW Activated")
  event.waitUntil(self.clients.claim())
})

self.addEventListener("message", async (event) => {

  console.log("SW received:", event.data)

  let songs = event.data

  if (!Array.isArray(songs)) {
    songs = [songs]
  }

  const request = indexedDB.open("music-db", 1)

  request.onupgradeneeded = (event) => {
    const db = event.target.result
    db.createObjectStore("songs", { keyPath: "songId" })
  }

  request.onsuccess = async () => {

    const db = request.result

    for (const song of songs) {

  try {

    if (!song.songId || !song.url) {
      console.log("Invalid song", song)
      continue
    }

    const checkTx = db.transaction("songs", "readonly")
    const checkStore = checkTx.objectStore("songs")

    const existing = await new Promise((resolve) => {
      const req = checkStore.get(song.songId)
      req.onsuccess = () => resolve(req.result)
    })

    if (existing) {
      console.log("Already downloaded", song.songId)
      continue
    }

    const res = await fetch(song.url)
    const blob = await res.blob()

    const tx = db.transaction("songs", "readwrite")
    const store = tx.objectStore("songs")

    store.put({
      songId: song.songId,
      name: song.name,
      singerId : song.singerId,
      image : song.image,
      duration:song.duration,
      label: song.label,
      blob
    })

    console.log("song stored", song.songId)

  } catch (error) {
    console.log("download failed", error)
  }

}

  }

})