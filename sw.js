// BillSync service worker — caches the app shell so it keeps working
// with no signal after the first successful load. Bump CACHE_NAME when
// you deploy an update; that forces everyone's cache to refresh.
const CACHE_NAME = "billsync-v8";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./IMG_3235.png",
  "./IMG_3236.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { mode: url.startsWith("http") ? "no-cors" : "same-origin" })).catch(() => {
            // A single failed precache (e.g. offline during install) shouldn't
            // block the rest of the shell from being cached.
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

// Cache-first for the app shell and its dependencies; network-first
// fallback for anything else, so new content is picked up when online
// but the app still opens when it isn't.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
