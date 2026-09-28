// BillSync service worker — caches the complete app shell for offline use.
const CACHE_NAME = "billsync-v14-statistics";

const APP_SHELL = [
  "./",
  "./index.html",
  "./app-shell.html",
  "./indexeddb-storage.js",
  "./auto-history.js",
  "./ui-redesign.js",
  "./ui-consolidate.js",
  "./ui-statistics.js",
  "./manifest.json",
  "./IMG_3235.png",
  "./IMG_3236.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { mode: url.startsWith("http") ? "no-cors" : "same-origin" })).catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate";
  const isBootstrap = requestUrl.pathname.endsWith("/index.html") || requestUrl.pathname.endsWith("/BillSync/");

  if (isNavigation || isBootstrap) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse?.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true })
          .then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse?.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
