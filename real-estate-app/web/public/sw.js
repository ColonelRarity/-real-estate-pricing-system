// Service Worker для оффлайн режиму веб-додатку оцінки нерухомості

const CACHE_NAME = 'real-estate-app-v1';
const API_CACHE_NAME = 'real-estate-api-v1';

// Ресурси для кешування при першому завантаженні
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
];

// API ендпоінти для кешування
const API_ENDPOINTS = [
  '/api/cities',
  '/api/cities/*/districts',
  '/api/market/stats',
  '/api/market/trends',
];

// Встановлення Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Static resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static resources', error);
      })
  );
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Перехоплення запитів
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Обробка API запитів
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  }
  // Обробка статичних ресурсів
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Обробка API запитів з кешуванням
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Спочатку пробуємо отримати з мережі
    console.log('Service Worker: Fetching from network', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Кешуємо успішний відповідь
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: API response cached', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);

    // Якщо мережа недоступна, пробуємо кеш
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('Service Worker: Returning cached API response', request.url);
      return cachedResponse;
    }

    // Якщо немає в кеші, повертаємо помилку
    return new Response(
      JSON.stringify({
        error: 'Оффлайн режим',
        message: 'Дані недоступні без інтернету',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Обробка статичних ресурсів
async function handleStaticRequest(request) {
  try {
    // Спочатку пробуємо мережу
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Якщо мережа недоступна, пробуємо кеш
    const cachedResponse = await caches.open(CACHE_NAME).then(cache => cache.match(request));

    if (cachedResponse) {
      console.log('Service Worker: Returning cached static resource', request.url);
      return cachedResponse;
    }

    // Для критичних ресурсів повертаємо fallback
    if (request.destination === 'document') {
      return caches.match('/');
    }

    throw error;
  }
}

// Синхронізація даних при поверненні онлайн
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncData());
  }
});

// Фонова синхронізація даних
async function syncData() {
  try {
    console.log('Service Worker: Starting background sync');

    // Отримуємо всі клієнти (відкриті вкладки)
    const clients = await self.clients.matchAll();

    // Надсилаємо повідомлення про синхронізацію
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: Date.now()
      });
    });

    // Тут можна додати логіку синхронізації локальних даних з сервером
    // Наприклад, надіслати збережені оцінки, які не були синхронізовані

    console.log('Service Worker: Background sync completed');

    // Повідомляємо клієнтів про завершення синхронізації
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    });

  } catch (error) {
    console.error('Service Worker: Background sync failed', error);

    // Повідомляємо про помилку
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// Обробка push-сповіщень (для майбутнього використання)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'notification',
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Обробка кліків по сповіщеннях
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Обробка дій сповіщення
    console.log('Notification action clicked:', event.action);
  } else {
    // Відкриваємо додаток при кліку на сповіщення
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          if (clients.length > 0) {
            return clients[0].focus();
          } else {
            return self.clients.openWindow('/');
          }
        })
    );
  }
});

// Періодичне оновлення кешу (background sync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    console.log('Service Worker: Periodic sync for cache update');
    event.waitUntil(updateCache());
  }
});

// Оновлення кешу в фоні
async function updateCache() {
  try {
    console.log('Service Worker: Updating cache in background');

    // Оновлюємо API кеш
    const apiCache = await caches.open(API_CACHE_NAME);

    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint.replace('*', 'Харків'));
        if (response.ok) {
          await apiCache.put(endpoint.replace('*', 'Харків'), response);
          console.log('Service Worker: Updated cache for', endpoint);
        }
      } catch (error) {
        console.log('Service Worker: Failed to update cache for', endpoint, error);
      }
    }

  } catch (error) {
    console.error('Service Worker: Cache update failed', error);
  }
}
