// This is a simple service worker that caches assets and API responses
// for better offline support and faster loading times

const CACHE_NAME = 'rideshare-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/images/logo/rideshare-logo-dark.svg',
  '/images/logo/auth-bg.svg',
  // Add routes that should be available offline
  '/dashboard',
  '/rides',
  '/faq',
  '/contact',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' ||
      !event.request.url.startsWith('http')) {
    return;
  }

  // For API requests, use network first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const responseToCache = response.clone();

          // Only cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .catch(err => console.error('Cache put error:', err));
              })
              .catch(err => console.error('Cache open error:', err));
          }

          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  }
  // For navigation requests (HTML), use cache first but fall back to index.html
  else if (event.request.mode === 'navigate' ||
           (event.request.method === 'GET' &&
            event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, return the cached index.html
          return caches.match('/index.html');
        })
    );
  }
  // For static assets, use cache first strategy
  else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return from cache if available
          if (response) {
            return response;
          }

          // Otherwise fetch from network
          return fetch(event.request).then((response) => {
            // Clone the response to store in cache
            const responseToCache = response.clone();

            // Only cache successful responses
            if (response.status === 200) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                    .catch(err => console.error('Cache put error:', err));
                })
                .catch(err => console.error('Cache open error:', err));
            }

            return response;
          });
        })
    );
  }
});
