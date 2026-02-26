const CACHE_NAME = "holdem-pwa-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/game.js",
  "/poker3d3.js",
  "/game-config/core.js",
  "/game-config/items.js",
  "/game-config/meta.js",
  "/game-modules/dom-refs.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/assets/home/home-screen.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-store" });
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (_error) {
            // Ignore failed precache entries during install.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      if (request.mode === "navigate") {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            await cache.put("/", networkResponse.clone());
          }
          return networkResponse;
        } catch (_error) {
          return (
            (await cache.match("/")) ||
            (await cache.match("/index.html")) ||
            Response.error()
          );
        }
      }

      const cachedResponse = await cache.match(request);
      const networkPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || (await networkPromise) || Response.error();
    })()
  );
});
