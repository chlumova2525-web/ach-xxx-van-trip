const C = "vandrbuch-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isPage = e.request.mode === "navigate" || e.request.url.endsWith("/index.html") || e.request.url.endsWith("/");
  if (isPage) {
    // stránka: nejdřív síť (čerstvá verze), offline záloha z cache
    e.respondWith(
      fetch(e.request).then(res => {
        const cl = res.clone(); caches.open(C).then(c => c.put(e.request, cl));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    // ikony, manifest: cache-first
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (e.request.url.startsWith(self.location.origin)) {
          const cl = res.clone(); caches.open(C).then(c => c.put(e.request, cl));
        }
        return res;
      }))
    );
  }
});
