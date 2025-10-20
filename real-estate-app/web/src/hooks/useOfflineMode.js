import { useState, useEffect, useCallback } from 'react';

// Хук для роботи з оффлайн режимом
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

  // Відстеження статусу мережі
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🔗 Повернулися онлайн');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Перейшли в оффлайн режим');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Реєстрація Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker зареєстровано');
          setIsServiceWorkerReady(true);

          // Слухаємо повідомлення від Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, timestamp } = event.data;

            switch (type) {
              case 'SYNC_STARTED':
                setSyncStatus('syncing');
                break;
              case 'SYNC_COMPLETED':
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 3000);
                break;
              case 'SYNC_FAILED':
                setSyncStatus('error');
                setTimeout(() => setSyncStatus('idle'), 5000);
                break;
              default:
                break;
            }
          });

          // Реєструємо фоновий sync (якщо підтримується)
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            registration.sync.register('background-sync').catch((error) => {
              console.log('Background sync registration failed:', error);
            });
          }

          // Реєструємо періодичне оновлення кешу (якщо підтримується)
          if ('periodicSync' in window.ServiceWorkerRegistration.prototype) {
            registration.periodicSync.register('update-cache', {
              minInterval: 24 * 60 * 60 * 1000, // 24 години
            }).catch((error) => {
              console.log('Periodic sync registration failed:', error);
            });
          }
        })
        .catch((error) => {
          console.error('❌ Помилка реєстрації Service Worker:', error);
        });
    }
  }, []);

  // Функція для ручної синхронізації
  const syncData = useCallback(async () => {
    if (!isServiceWorkerReady) {
      console.warn('Service Worker не готовий');
      return false;
    }

    try {
      setSyncStatus('syncing');

      // Надсилаємо повідомлення Service Worker для запуску синхронізації
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({ type: 'MANUAL_SYNC' });

      // Чекаємо на завершення синхронізації
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          setSyncStatus('idle');
          resolve(false);
        }, 10000);

        const messageHandler = (event) => {
          if (event.data.type === 'SYNC_COMPLETED' || event.data.type === 'SYNC_FAILED') {
            clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('message', messageHandler);
            setSyncStatus(event.data.type === 'SYNC_COMPLETED' ? 'synced' : 'error');
            setTimeout(() => setSyncStatus('idle'), 3000);
            resolve(event.data.type === 'SYNC_COMPLETED');
          }
        };

        navigator.serviceWorker.addEventListener('message', messageHandler);
      });
    } catch (error) {
      console.error('Помилка синхронізації:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
      return false;
    }
  }, [isServiceWorkerReady]);

  // Функція для перевірки кешу
  const checkCache = useCallback(async () => {
    if (!('caches' in window)) {
      return { hasCache: false, cacheSize: 0 };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
      }

      return {
        hasCache: totalSize > 0,
        cacheSize: totalSize,
        cacheNames,
      };
    } catch (error) {
      console.error('Помилка перевірки кешу:', error);
      return { hasCache: false, cacheSize: 0 };
    }
  }, []);

  // Функція для очищення кешу
  const clearCache = useCallback(async () => {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      console.log('🗑️ Кеш очищено');
      return true;
    } catch (error) {
      console.error('Помилка очищення кешу:', error);
      return false;
    }
  }, []);

  return {
    isOnline,
    isServiceWorkerReady,
    syncStatus,
    syncData,
    checkCache,
    clearCache,
  };
};

export default useOfflineMode;
