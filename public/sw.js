// Driftloop service worker — offline app shell.
const CACHE = "driftloop-v1";
const CORE = ["/","/index.html","/station.html","/midi.js","/patch.js",
  "/bowl.mp3","/cathedral.mp3","/manifest.webmanifest","/station.webmanifest",
  "/icon-192.png","/icon-512.png","/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    try { if (res && res.ok && new URL(req.url).origin === location.origin) {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } } catch (_) {}
    return res;
  }).catch(() => hit)));
});
