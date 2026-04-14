const CACHE_NAME = "music-cache-v1";

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
  const cache = await caches.open(CACHE_NAME);

  for (const song of songs) {
    try {
      if (!song.url) {
        console.log("[SW] Invalid song:", song);
        continue;
      }

      const cached = await cache.match(song.url);

      if (cached) {
        console.log("[SW] Already cached:", song.songId);
        continue;
      }

      console.log("[SW] Fetching & caching:", song.songId);

      const response = await fetch(song.url);

      await cache.put(song.url, response.clone());

      console.log("[SW] Cached successfully:", song.songId);

    } catch (err) {
      console.log("[SW] Cache failed:", err);
    }
  }
})

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (url.includes(".mp3") || url.includes(".m4a") || url.includes("audio")) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);

        if (cached) {
          console.log("[SW] Serving from cache:", url);
          return cached;
        }

        console.log("[SW] Fetching from network:", url);

        const response = await fetch(event.request);
        cache.put(event.request, response.clone());

        return response;
      })
    );
  }
});