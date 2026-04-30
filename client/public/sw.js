const CACHE_NAME = 'verdara-v6';
const MAX_API_ENTRIES = 50;
const MAX_IMAGE_ENTRIES = 100;

const STALE_WHILE_REVALIDATE_URLS = [
  '/api/trails',
  '/api/trails/featured',
  '/api/activities',
  '/api/campgrounds',
];

const NETWORK_FIRST_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/user\//,
  /^\/api\/bookings/,
  /^\/api\/arborist\//,
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll().then((clients) => {
       clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
     }))
  );
});

function isImageRequest(url) {
  return url.pathname.startsWith('/images/');
}

function isStaleWhileRevalidate(url) {
  return STALE_WHILE_REVALIDATE_URLS.some((path) => url.pathname === path);
}

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxEntries);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
        trimCache(CACHE_NAME, MAX_API_ENTRIES).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      trimCache(CACHE_NAME, MAX_IMAGE_ENTRIES).catch(() => {});
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
  } else if (isStaleWhileRevalidate(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(event.request));
  }
});
