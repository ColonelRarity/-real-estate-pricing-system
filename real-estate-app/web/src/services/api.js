import axios from 'axios';

// Конфігурація API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Інтерцептор для обробки помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      throw new Error('Місто або район не знайдено');
    } else if (error.response?.status === 500) {
      throw new Error('Помилка сервера. Спробуйте пізніше.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Час очікування вичерпано. Перевірте підключення до інтернету.');
    } else {
      throw new Error(error.message || 'Невідома помилка');
    }
  }
);

// API функції для взаємодії з backend

export const propertyAPI = {
  // Отримання списку міст
  getCities: () => api.get('/cities'),

  // Отримання районів для міста
  getDistricts: (city) => api.get(`/cities/${city}/districts`),

  // Збереження даних про нерухомість
  saveProperty: (propertyData) => api.post('/properties', propertyData),

  // Отримання оцінки вартості
  getValuation: (propertyId) => api.get(`/properties/${propertyId}/valuation`),

  // Пошук оголошень
  searchProperties: (city, district) => api.get('/properties/search', {
    params: { city, district }
  }),

  // Отримання статистики ринку
  getMarketStats: (city, district) => api.get('/market/stats', {
    params: { city, district }
  }),

  // Отримання трендів цін
  getPriceTrends: (city, months = 6) => api.get('/market/trends', {
    params: { city, months }
  }),
};

export const mlAPI = {
  // Прогнозування ціни з ML моделі
  predictPrice: (propertyData) => api.post('/ml/predict', propertyData),

  // Навчання моделі
  trainModel: (data) => api.post('/ml/train', data),

  // Отримання метрик моделі
  getModelMetrics: () => api.get('/ml/metrics'),
};

export default api;
