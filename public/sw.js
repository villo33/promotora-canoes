const CACHE_NAME = "canoes-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting(); // 🔥 fuerza actualización inmediata

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/contratistas.html",
        "/trabajadores.html",
        "/historial.html",
        "/planilla.html",
        "/logo.png"
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 🧹 borra cache viejo
          }
        })
      );
    })
  );

  self.clients.claim(); // 🔥 toma control inmediato
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});