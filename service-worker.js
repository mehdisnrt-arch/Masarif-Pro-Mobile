const APP_CACHE_PREFIX = "masarif-static";

function clearAppCaches() {
  return caches.keys().then(cacheNames =>
    Promise.all(
      cacheNames
        .filter(cacheName => cacheName.startsWith(APP_CACHE_PREFIX))
        .map(cacheName => caches.delete(cacheName))
    )
  );
}

self.addEventListener("install", event => {
  event.waitUntil(clearAppCaches().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    clearAppCaches()
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(clients => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      })
  );
});
