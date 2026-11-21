// Service Worker per ASD Cynthia 1920 (PWA Network-First per dati + Web Push)
const CACHE_NAME = 'cynthia-pwa-v3';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './assets/cynthia_logo.png',
  './favicon.png',
  './standalone.html',
];

// Installazione: precaching degli asset essenziali della shell applicativa
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('Precaching parziale degli asset PWA:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione: pulizia vecchie cache e attivazione immediata sui client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Strategia Network-First rigorosa per dati gare (Google Sheets / CSV / JSON) e navigazione HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Riconoscimento richieste dati dinamiche (Google Sheets, CSV, JSON dati, API)
  const isManifest =
    url.pathname.endsWith('manifest.json') || url.pathname.endsWith('manifest.webmanifest');
  const isDataFeed =
    url.hostname.includes('docs.google.com') ||
    url.hostname.includes('sheets.googleapis.com') ||
    url.pathname.includes('/data/') ||
    url.pathname.includes('/api/') ||
    url.pathname.endsWith('.csv') ||
    (url.pathname.endsWith('.json') && !isManifest);

  if (isDataFeed) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Richieste terze parti non font (es. Open-Meteo, Mappe) passano direttamente alla rete
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes('googleapis.com') &&
    !url.hostname.includes('gstatic.com')
  ) {
    return;
  }

  // Navigazione HTML (pagina principale): Network-First con fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Asset statici (immagini, icone, font, css, js compilati): Cache con revalidazione in background
  const isStaticAsset =
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico') ||
    isManifest;

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Fallback predefinito: Network-First
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Click su notifica push: porta in primo piano la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

// Listener messaggi dall'applicazione
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: './pwa-192x192.png',
      badge: './pwa-192x192.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
});
