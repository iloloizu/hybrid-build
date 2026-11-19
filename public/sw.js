// Offline support. The app is one file, so: page is network-first (new versions
// arrive when online, cached copy opens offline); fonts and icons are cache-first.
const CACHE = "hb-v4";
const SHELL = ["./", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  // App shell plus every exercise picture (listed in img/repdb/files.json), so workouts show offline.
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(SHELL);
    try { const list = await (await fetch("./img/repdb/files.json")).json(); await c.addAll(list.map(f => "./img/repdb/" + f).concat(["broadjump", "bayesian", "backwalk", "yraise"].flatMap(n => [`./img/own/${n}-start.webp`, `./img/own/${n}-peak.webp`]))); } catch (err) { /* pictures fill in as they're viewed */ }
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return res; })
      .catch(() => caches.match("./")));
    return;
  }
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (fonts || url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
