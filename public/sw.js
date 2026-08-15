/* SVOLTA service worker — cache shell per l'avvio offline, network-first per pagine e API. */
const CACHE = "svolta-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  // Le API vanno sempre in rete (dati vivi); niente cache.
  if (url.pathname.startsWith("/api/")) return;

  // Asset statici Next: cache-first (hanno hash nel nome).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Pagine: network-first con fallback alla cache (apertura offline).
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("/")))
  );
});

/* FASE 2 — notifiche push: handler già pronto, si attiva quando arriveranno le VAPID keys. */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const { title, body } = event.data.json();
    event.waitUntil(
      self.registration.showNotification(title || "SVOLTA", {
        body: body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      })
    );
  } catch {
    /* payload non valido: ignora */
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
