const CACHE_NAME = 'norte-invest-private-v2.2';
const IS_LOCAL_DEV =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      if (IS_LOCAL_DEV) {
        // Ambiente local (next dev): limpa 100% dos caches para não congelar Hot-Reload e desregistra o SW
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.navigate(client.url);
        }
        return;
      }

      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Zero-Trust: NUNCA faz cache em localhost nem de endpoints /api/ ou documentos autenticados
self.addEventListener('fetch', (event) => {
  if (IS_LOCAL_DEV) return;

  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    !url.pathname.startsWith('/_next/static/')
  ) {
    return;
  }

  // Em produção HTTPS: Network-First com fallback seguro para não prender versões antigas
  event.respondWith(
    fetch(event.request)
      .then(async (fresh) => {
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, fresh.clone());
        }
        return fresh;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw new Error('Network unavailable');
      })
  );
});
