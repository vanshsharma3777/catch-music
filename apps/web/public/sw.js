const APP_CACHE = "catchmusic-app-v1";
const MUSIC_CACHE = "catchmusic-music-v1";
const IMAGE_CACHE = "catchmusic-images-v1";

const OFFLINE_PAGE = "/offline-play";

/*
 * Install
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(async (cache) => {
     console.log("sw installed")
      await cache.add(OFFLINE_PAGE);
    })
  );

  self.skipWaiting();
});

/*
 * Activate
 */
 self.addEventListener("activate", (event) => {
   event.waitUntil(
     caches.keys().then((cacheNames) => {
       return Promise.all(
         cacheNames
           .filter((cacheName) => {
             return (
               cacheName.startsWith("catchmusic-") &&
               ![
                 APP_CACHE,
                 MUSIC_CACHE,
                 IMAGE_CACHE,
               ].includes(cacheName)
             );
           })
           .map((cacheName) => caches.delete(cacheName))
       );
     })
   );

   self.clients.claim();
 });

/*
 * Fetch handler
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  /*
   * Only deal with GET requests.
   */
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
   * -----------------------------------------
   * 1. Cached music
   * -----------------------------------------
   *
   * /cached-music/123
   */
  if (url.pathname.startsWith("/cached-music/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return new Response("Song not found", {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      })
    );

    return;
  }

  /*
   * -----------------------------------------
   * 2. Cached artwork
   * -----------------------------------------
   */
  if (url.pathname.startsWith("/cached-artwork/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request);
      })
    );

    return;
  }

  /*
   * -----------------------------------------
   * 3. Navigation requests
   * -----------------------------------------
   *
   * Example:
   *
   * /
   * /offline-play
   * /search
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          /*
           * Save successful page responses.
           */
          const responseClone = networkResponse.clone();

          caches.open(APP_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(async () => {
          /*
           * Internet failed.
           *
           * Return offline page.
           */
          const cache = await caches.open(APP_CACHE);

          const offlinePage = await cache.match(OFFLINE_PAGE);

          if (offlinePage) {
            return offlinePage;
          }

          return new Response("You are offline.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain",
            },
          });
        })
    );

    return;
  }

  /*
   * -----------------------------------------
   * 4. JS / CSS / images / fonts
   * -----------------------------------------
   *
   * Runtime cache.
   */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            /*
             * Only cache successful responses.
             */
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();

              caches.open(APP_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }

            return networkResponse;
          })
          .catch(() => {
            return new Response("", {
              status: 503,
            });
          });
      })
    );

    return;
  }
});
