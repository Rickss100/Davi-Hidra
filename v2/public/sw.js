const CACHE_NAME = 'norte-invest-private-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Zero-Trust: NUNCA faz cache de endpoints /api/ ou documentos autenticados com dados financeiros
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    !url.pathname.startsWith('/_next/static/')
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const fresh = await fetch(event.request);
      if (fresh.ok) {
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    })
  );
});
