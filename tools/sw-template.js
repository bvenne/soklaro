const scope = self.registration.scope;
const prefix = 'soklaro-shell:' + scope + ':';
const CACHE = prefix + '__VERSION__';
const FILES = __FILES__;
const pages = new Set(['/', '/app', '/privacy', '/impressum']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(path => new URL(path.slice(1), scope).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(scope)) return;
  const path = '/' + url.pathname.slice(new URL(scope).pathname.length);
  const route = path.replace(/\/$/, '') || '/';
  if (event.request.mode === 'navigate' && pages.has(route) && !path.endsWith('/')) {
    event.respondWith(Response.redirect(url.origin + url.pathname + '/' + url.search, 301));
    return;
  }
  const key = event.request.mode === 'navigate' && pages.has(route) ? (route === '/' ? '' : route) + '/index.html' : path;
  if (!FILES.includes(key)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(new URL(key.slice(1), scope).href)) || fetch(event.request)));
});
