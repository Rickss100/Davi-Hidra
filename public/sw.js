
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});
self.addEventListener('fetch', (e) => {
  // Empty fetch listener to satisfy PWA installability requirements
});
