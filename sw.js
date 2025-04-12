const CACHE_NAME = 'controle-gastos-v1';
const urlsToCache = [
  './',  // Mudamos de '/' para './'
  './index.html',  // Mudamos todos os caminhos para relativos
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/android-icon-192x192.png',
  './icons/apple-icon-180x180.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Se encontrou no cache, retorna o cache
        }
        return fetch(event.request).catch(() => {
          // Se falhar o fetch, retorna uma página offline personalizada
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});