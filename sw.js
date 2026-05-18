const CACHE_NAME = "douae-bac2-v43-svt-qcm";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./philosophy.html",
  "./physics-equations.html",
  "./physics-methodology.html",
  "./physics-common-mistakes.html",
  "./physics-exercises.html",
  "./chemistry-equations.html",
  "./math.html",
  "./svt.html",
  "./svt-energie.html",
  "./svt-exercices.html",
  "./svt-geologie.html",
  "./svt-genetique-expression.html",
  "./svt-methodologie.html",
  "./svt-nutrition.html",
  "./svt-qcm.html",
  "./svt-reproduction-sexuee.html",
  "./math-formulas.html",
  "./math-methodology.html",
  "./math-common-mistakes.html",
  "./math-exercises.html",
  "./math-for-physics.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./DB2_logo.png",
  "./favicon.ico",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/favicon-48.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.webmanifest",
  "./fonts/Cairo-Regular.ttf",
  "./fonts/Cairo-Bold.ttf",
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
  const isHtmlRequest = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");

  if (isHtmlRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
