/* TimeLuxe service worker.
 * Strategy summary:
 *   - App shell (this worker, icons, manifest, offline page): precached on install.
 *   - Navigations: network-first, fall back to cached shell, then offline.html.
 *   - Same-origin static assets (hashed JS/CSS/fonts/images): cache-first.
 *   - API and auth traffic (/api/*, non-GET, cross-origin): never cached, straight to network.
 *
 * Updates: a new worker installs but does not take over on its own, so the page can
 * show its "new version" banner. Clicking Reload posts SKIP_WAITING below.
 *
 * Bump CACHE_VERSION whenever the precache list or caching rules change, and serve
 * this file with `Cache-Control: no-cache` so browsers actually re-check it.
 */

const CACHE_VERSION = 'timeluxe-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const SHELL_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './favicon.ico',
  './favicon-32.png',
  './apple-touch-icon.png',
];

const OFFLINE_URL = './offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** API calls, auth, and anything non-GET must always hit the network. */
const isBypassed = (request, url) =>
  request.method !== 'GET' ||
  url.origin !== self.location.origin ||
  url.pathname.startsWith('/api/') ||
  url.pathname.startsWith('/api-docs');

/** Hashed build output and static media can be served from cache forever. */
const isStaticAsset = (url) =>
  /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico|mp4|webm)$/i.test(
    url.pathname
  );

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isBypassed(request, url)) return;

  // SPA navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match(OFFLINE_URL)) || Response.error();
        })
    );
    return;
  }

  // Static assets
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network, with a cache fallback if it was seen before
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});

// Let the page trigger an immediate update from a "new version" prompt.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
