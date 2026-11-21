const CACHE = 'soklaro-shell-__VERSION__';
const FILES = __FILES__;
const pages = new Set(['/', '/app', '/privacy', '/impressum']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('soklaro-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const route = url.pathname.replace(/\/$/, '') || '/';
  const key = event.request.mode === 'navigate' && pages.has(route) ? (route === '/' ? '' : route) + '/index.html' : url.pathname;
  if (!FILES.includes(key)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(key)) || fetch(event.request)));
});
