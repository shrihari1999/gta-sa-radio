const CACHE_NAME = 'gta-sa-radio-v1';
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
  // Add other assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});