/* Service Worker — Lela Eventos
   Objetivo: acelerar visitas repetidas y evitar errores si no hay conexión.
   No implementa un modo offline complejo: solo cachea el "app shell". */

const VERSION = "lela-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

/* Rutas relativas a la ubicación de este archivo (raíz del sitio,
   por ejemplo /deyoutube/) — funcionan sin asumir que el sitio
   está publicado en la raíz del dominio. */
const SHELL_ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "main.js",
  "manifest.webmanifest",
  "favicon.ico",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => (key.startsWith("qb-") || key.startsWith("lela-")) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    /* Recursos externos (fuentes, mapa de Google, WhatsApp): red directa,
       sin interceptar, para no complicar la app con cacheo de terceros. */
    return;
  }

  /* Navegación (carga de la página): red primero, con reserva en caché. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("index.html", copy));
          return res;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  /* Imágenes: stale-while-revalidate. */
  if (req.destination === "image") {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  /* CSS / JS / iconos: caché primero, red como reserva. */
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
