const CACHE_NAME = "douae-bac2-v33-pwa-offline";

const STATIC_ASSETS = [
  "./",
  "./chemistry-equations.html",
  "./index.html",
  "./math-common-mistakes.html",
  "./math-exercises.html",
  "./math-for-physics.html",
  "./math-formulas.html",
  "./math-methodology.html",
  "./math.html",
  "./offline.html",
  "./philosophy.html",
  "./physics-common-mistakes.html",
  "./physics-equations.html",
  "./physics-exercises.html",
  "./physics-methodology.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./pwa-register.js",
  "./DB2_logo.png",
  "./favicon.ico",
  "./manifest.webmanifest",
  "./icons/README.md",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/favicon-48.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./fonts/Cairo-Bold.ttf",
  "./fonts/Cairo-Regular.ttf",
  "./fonts/Cairo-VariableFont_slnt,wght.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const isHtmlRequest =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

  if (isHtmlRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() =>
          caches.match(request)
            .then((cachedResponse) => cachedResponse || caches.match("./offline.html") || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "opaque") {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === "image") return caches.match("./DB2_logo.png");
          return caches.match("./offline.html");
        });
    })
  );
});
