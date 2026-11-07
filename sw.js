const V = "inventario-v1";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Archivos de la app: primero la red (así llegan las actualizaciones) y, sin internet, lo guardado.
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match("./index.html"))));
  } else if (u.hostname === "www.gstatic.com") {
    // Librerías de Firebase: guardadas para poder abrir la app sin internet.
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => {
      const f = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => m);
      return m || f;
    })));
  }
  // Todo lo demás (la base de datos y el ingreso) pasa directo, sin tocarlo.
});
