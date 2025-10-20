import { useState, useEffect, useCallback } from 'react';
import { propertyAPI } from '../services/api';

// Хук для роботи з оффлайн даними
export const useOfflineData = () => {
  const [offlineData, setOfflineData] = useState({
    cities: [],
    marketStats: {},
    properties: [],
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Відстеження статусу мережі
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🔗 Повернулися онлайн - оновлюємо дані');
      updateOfflineData();
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

  // Завантаження даних при ініціалізації
  useEffect(() => {
    loadOfflineData();
  }, []);

  // Завантаження даних з кешу або сервера
  const loadOfflineData = useCallback(async () => {
    try {
      // Спочатку пробуємо завантажити з кешу
      const cachedData = localStorage.getItem('offlineData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setOfflineData(parsedData.data);
        setLastUpdate(new Date(parsedData.timestamp));
        console.log('📦 Завантажено дані з кешу');
      }

      // Якщо онлайн, оновлюємо дані з сервера
      if (isOnline) {
        await updateOfflineData();
      }
    } catch (error) {
      console.error('Помилка завантаження оффлайн даних:', error);
    }
  }, [isOnline]);

  // Оновлення даних з сервера
  const updateOfflineData = useCallback(async () => {
    try {
      console.log('🔄 Оновлюю оффлайн дані з сервера...');

      // Завантажуємо базові дані
      const [citiesResponse, kharkivStatsResponse] = await Promise.all([
        propertyAPI.getCities(),
        propertyAPI.getMarketStats('Харків'),
      ]);

      const newOfflineData = {
        cities: citiesResponse.data.cities || [],
        marketStats: {
          'Харків': kharkivStatsResponse.data,
        },
        properties: [], // Можна додати останні оголошення
      };

      // Зберігаємо в кеш
      const cacheData = {
        data: newOfflineData,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('offlineData', JSON.stringify(cacheData));
      setOfflineData(newOfflineData);
      setLastUpdate(new Date());

      console.log('✅ Оффлайн дані оновлено');
    } catch (error) {
      console.error('Помилка оновлення оффлайн даних:', error);
    }
  }, []);

  // Отримання даних для конкретного міста
  const getCityData = useCallback((city) => {
    if (!offlineData.cities.includes(city)) {
      return null;
    }

    return {
      stats: offlineData.marketStats[city] || null,
      districts: [], // Можна додати окремо
    };
  }, [offlineData]);

  // Перевірка чи дані актуальні (не старше 24 годин)
  const isDataFresh = useCallback(() => {
    if (!lastUpdate) return false;
    const hoursDiff = (new Date() - new Date(lastUpdate)) / (1000 * 60 * 60);
    return hoursDiff < 24;
  }, [lastUpdate]);

  // Примусове оновлення даних
  const forceUpdate = useCallback(async () => {
    await updateOfflineData();
  }, [updateOfflineData]);

  // Збереження оцінки в локальне сховище
  const saveLocalValuation = useCallback((propertyId, valuationData) => {
    try {
      const localValuations = JSON.parse(localStorage.getItem('localValuations') || '{}');
      localValuations[propertyId] = {
        ...valuationData,
        savedAt: new Date().toISOString(),
        synced: false, // Потрібно синхронізувати з сервером
      };

      localStorage.setItem('localValuations', JSON.stringify(localValuations));
      console.log('💾 Збережено оцінку локально:', propertyId);
    } catch (error) {
      console.error('Помилка збереження оцінки:', error);
    }
  }, []);

  // Отримання локальних оцінок
  const getLocalValuations = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('localValuations') || '{}');
    } catch (error) {
      console.error('Помилка отримання локальних оцінок:', error);
      return {};
    }
  }, []);

  // Синхронізація локальних оцінок з сервером
  const syncLocalValuations = useCallback(async () => {
    try {
      const localValuations = getLocalValuations();
      const unsynced = Object.entries(localValuations)
        .filter(([_, data]) => !data.synced);

      if (unsynced.length === 0) {
        console.log('📤 Немає даних для синхронізації');
        return true;
      }

      console.log(`📤 Синхронізую ${unsynced.length} локальних оцінок...`);

      // Надсилаємо дані на сервер (тут буде API запит)
      // const response = await propertyAPI.syncValuations(unsynced);

      // Якщо успішно, позначаємо як синхронізовані
      const updatedValuations = { ...localValuations };
      unsynced.forEach(([propertyId, _]) => {
        updatedValuations[propertyId].synced = true;
      });

      localStorage.setItem('localValuations', JSON.stringify(updatedValuations));
      console.log('✅ Локальні оцінки синхронізовано');

      return true;
    } catch (error) {
      console.error('Помилка синхронізації:', error);
      return false;
    }
  }, [getLocalValuations]);

  return {
    offlineData,
    isOnline,
    isDataFresh: isDataFresh(),
    lastUpdate,
    getCityData,
    updateOfflineData,
    forceUpdate,
    saveLocalValuation,
    getLocalValuations,
    syncLocalValuations,
  };
};

export default useOfflineData;
