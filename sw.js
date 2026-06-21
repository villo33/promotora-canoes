self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("canoes-cache").then((cache) => {
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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});