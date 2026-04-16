// Service Worker for 奧斯捷饗宴 12天 PWA
// v1.0.0 - 2026-04-16

const CACHE_NAME = 'auslocztrip-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Noto+Serif+TC:wght@300;400;600&family=Cinzel:wght@400;600&display=swap'
];

// Install: 預先快取核心資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS).catch(err => {
        console.warn('[SW] 部分資源快取失敗:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: 清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first，失敗時回傳快取
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  // 即時 API（天氣、匯率、航班）不快取，讓它直接走網路
  const url = event.request.url;
  if (url.includes('api.') || url.includes('open-meteo') || url.includes('frankfurter') || url.includes('aviationstack')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功就更新快取
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 網路失敗時回傳快取
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
