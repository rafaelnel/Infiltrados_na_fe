// sw.js - Service Worker para Infiltrado na Fé (PWA)
const CACHE_NAME = 'infiltrado-na-fe-v3';

// Recursos essenciais para inicialização do App Shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/app-cover.png',
  '/screenshot-mobile.png'
];

// Instalação do Service Worker e cache inicial resiliente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[PWA SW] Precache tolerante para:', asset, err);
          })
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estratégia de requisição: Network First para navegação e scripts de desenvolvimento, bypass para API e WebSockets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não interceptar requisições não-GET, rotas de API, WebSockets ou módulos do servidor de desenvolvimento Vite
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // Para navegação HTML: Network-first com fallback seguro para cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((matched) => {
            return matched || caches.match('/') || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Para assets estáticos: Network-first com fallback para cache (evita travar em versões antigas)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('', { status: 504 });
        });
      })
  );
});

