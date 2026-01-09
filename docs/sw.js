const CACHE_NAME = 'gta-sa-radio-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.json',
  './ads.json',
  './manifest.webmanifest',
  './assets/icons/sa.png',
  './assets/icons/sa_192.png',
  './assets/icons/sa_512.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Fetch: network-first for core files, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for HTML, JS, CSS, and JSON files
  if (event.request.destination === 'document' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback to cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for other assets (images, fonts, etc.)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
  }
});
