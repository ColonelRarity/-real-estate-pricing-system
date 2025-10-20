import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { KHARKIV_CITY, getDistrictById } from '../types/location';
import GeocodingService from './GeocodingService';

export interface PropertyData {
  id?: string;
  city: string;
  district: string;
  address: string;
  fullAddress?: string; // Повна адреса для геокодування
  area: number;
  rooms: number;
  floor: number;
  totalFloors: number;
  buildingType: 'brick' | 'panel' | 'monolithic' | 'wood';
  yearBuilt?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  hasBalcony: boolean;
  hasElevator: boolean;
  heating: 'central' | 'individual' | 'none';
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Додані поля для кращого порівняння
  pricePerSqm?: number;
  distanceToCenter?: number;
  similarProperties?: Array<{
    id: string;
    address: string;
    price: number;
    area: number;
    distance: number;
    similarity: number;
  }>;
}

export interface PropertyValuation {
  propertyId: string;
  estimatedValue: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  factors: {
    location: number;
    area: number;
    condition: number;
    building: number;
    floor: number;
  };
  comparableProperties: Array<{
    address: string;
    price: number;
    area: number;
    distance: number;
  }>;
  marketTrends: {
    averagePricePerSqm: number;
    priceChangeLastMonth: number;
    demandLevel: 'high' | 'medium' | 'low';
  };
}

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api'
  : 'https://your-api-domain.com/api'; // Замінити на реальний домен

export class PropertyService {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Налаштування axios для API запитів
      axios.defaults.baseURL = API_BASE_URL;
      axios.defaults.timeout = 10000;

      // Додати перехоплювач для обробки помилок авторизації
      axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          if (error.response?.status === 401) {
            // Обробка помилки авторизації
            await this.handleUnauthorized();
          }
          return Promise.reject(error);
        }
      );

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing PropertyService:', error);
    }
  }

  private static async handleUnauthorized(): Promise<void> {
    // Очистити токени авторизації
    await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
    // Можна додати логіку перенаправлення на екран логіну
  }

  static async saveProperty(propertyData: PropertyData): Promise<string> {
    try {
      const propertyId = propertyData.id || this.generateId();

      // Геокодуємо адресу, якщо є координати або повна адреса
      let coordinates = propertyData.coordinates;
      if (!coordinates && (propertyData.address || propertyData.fullAddress)) {
        const addressToGeocode = propertyData.fullAddress || `${propertyData.address}, ${propertyData.city}`;
        const geocodingResult = await GeocodingService.geocodeAddress(addressToGeocode, propertyData.city);

        if (geocodingResult) {
          coordinates = {
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
          };
        }
      }

      const propertyToSave = {
        ...propertyData,
        id: propertyId,
        coordinates,
        fullAddress: propertyData.fullAddress || propertyData.address,
        createdAt: new Date().toISOString(),
      };

      // Зберегти локально для офлайн режиму
      const savedProperties = await this.getSavedProperties();
      savedProperties[propertyId] = propertyToSave;

      await AsyncStorage.setItem('savedProperties', JSON.stringify(savedProperties));

      // Відправити на сервер, якщо є з'єднання
      try {
        await axios.post('/properties', propertyToSave);
      } catch (error) {
        console.warn('Could not sync with server, saved locally:', error);
      }

      return propertyId;
    } catch (error) {
      console.error('Error saving property:', error);
      throw new Error('Не вдалося зберегти дані про нерухомість');
    }
  }

  static async getProperty(propertyId: string): Promise<PropertyData | null> {
    try {
      // Спочатку спробувати отримати з сервера
      try {
        const response = await axios.get(`/properties/${propertyId}`);
        return response.data;
      } catch (error) {
        // Якщо не вдалося отримати з сервера, спробувати локально
        const savedProperties = await this.getSavedProperties();
        return savedProperties[propertyId] || null;
      }
    } catch (error) {
      console.error('Error getting property:', error);
      return null;
    }
  }

  static async getSavedProperties(): Promise<{ [key: string]: PropertyData }> {
    try {
      const saved = await AsyncStorage.getItem('savedProperties');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error getting saved properties:', error);
      return {};
    }
  }

  static async getValuation(propertyId: string): Promise<PropertyValuation> {
    try {
      // Спочатку спробувати отримати з сервера
      try {
        const response = await axios.get(`/properties/${propertyId}/valuation`);
        return response.data;
      } catch (error) {
        // Якщо не вдалося отримати з сервера, показати оцінку на основі локальних даних
        return this.getLocalValuation(propertyId);
      }
    } catch (error) {
      console.error('Error getting valuation:', error);
      throw new Error('Не вдалося отримати оцінку вартості');
    }
  }

  private static async getLocalValuation(propertyId: string): Promise<PropertyValuation> {
    const property = await this.getProperty(propertyId);
    if (!property) {
      throw new Error('Дані про нерухомість не знайдені');
    }

    // Спробуємо отримати оцінку з сервера (з ML моделлю)
    try {
      const serverValuation = await this.getValuation(propertyId);
      return serverValuation;
    } catch (error) {
      console.warn('Не вдалося отримати оцінку з сервера, використовую локальну:', error);
    }

    // Fallback на локальну оцінку (якщо сервер недоступний)
    const basePricePerSqm = this.getBasePricePerSqm(property.city, property.district);
    const estimatedValue = Math.round(property.area * basePricePerSqm * this.getConditionMultiplier(property.condition));

    return {
      propertyId,
      estimatedValue,
      priceRange: {
        min: Math.round(estimatedValue * 0.85),
        max: Math.round(estimatedValue * 1.15),
      },
      confidence: 0.7, // Низька впевненість для локальної оцінки
      factors: {
        location: 0.8,
        area: 0.9,
        condition: this.getConditionScore(property.condition),
        building: 0.8,
        floor: this.getFloorScore(property.floor, property.totalFloors),
      },
      comparableProperties: [], // Порожній масив для локальної оцінки
      marketTrends: {
        averagePricePerSqm: basePricePerSqm,
        priceChangeLastMonth: 0.5, // Прикладне значення
        demandLevel: 'medium',
      },
    };
  }

  private static getBasePricePerSqm(city: string, district: string): number {
    // Для MVP фокусуємося тільки на Харкові
    if (city.toLowerCase() !== 'харків') return 1000;

    // Якщо вказано район, шукаємо його ціну
    if (district) {
      const districtData = KHARKIV_CITY.districts.find(d =>
        d.name.toLowerCase() === district.toLowerCase() ||
        d.name.toLowerCase().includes(district.toLowerCase())
      );
      if (districtData?.averagePricePerSqm) {
        return districtData.averagePricePerSqm;
      }
    }

    // Повертаємо базову ціну Харкова
    return KHARKIV_CITY.averagePricePerSqm;
  }

  private static getConditionMultiplier(condition: string): number {
    const multipliers = {
      'excellent': 1.2,
      'good': 1.0,
      'fair': 0.8,
      'poor': 0.6,
    };
    return multipliers[condition as keyof typeof multipliers] || 1.0;
  }

  private static getConditionScore(condition: string): number {
    const scores = {
      'excellent': 0.95,
      'good': 0.85,
      'fair': 0.7,
      'poor': 0.5,
    };
    return scores[condition as keyof typeof scores] || 0.7;
  }

  private static getFloorScore(floor: number, totalFloors: number): number {
    if (floor === 1) return 0.8; // Перший поверх дешевший
    if (floor === totalFloors) return 0.9; // Останній поверх дешевший
    if (floor <= 3) return 0.95; // Нижні поверхи
    if (floor >= totalFloors - 2) return 0.85; // Верхні поверхи
    return 1.0; // Середні поверхи
  }

  private static generateId(): string {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  static async searchProperties(city: string, district?: string): Promise<PropertyData[]> {
    try {
      const response = await axios.get('/properties/search', {
        params: { city, district },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  static async getMarketStats(city: string, district?: string): Promise<any> {
    try {
      const response = await axios.get('/market/stats', {
        params: { city, district },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting market stats:', error);
      return null;
    }
  }

  /**
   * Знаходить подібні об'єкти нерухомості в заданому радіусі
   */
  static async findSimilarProperties(
    propertyId: string,
    radiusMeters: number = 1000,
    maxResults: number = 10
  ): Promise<PropertyData[]> {
    try {
      const property = await this.getProperty(propertyId);
      if (!property || !property.coordinates) {
        return [];
      }

      // Отримуємо всі збережені об'єкти
      const savedProperties = await this.getSavedProperties();
      const allProperties = Object.values(savedProperties).filter(p => p.id !== propertyId && p.coordinates);

      // Знаходимо об'єкти в заданому радіусі
      const nearbyProperties = GeocodingService.findNearbyProperties(
        property.coordinates.latitude,
        property.coordinates.longitude,
        allProperties.map(p => ({
          latitude: p.coordinates!.latitude,
          longitude: p.coordinates!.longitude,
          id: p.id!
        })),
        radiusMeters
      ).slice(0, maxResults);

      // Фільтруємо за схожістю характеристик
      const similarProperties = nearbyProperties
        .map(({ id }) => savedProperties[id])
        .filter(p => this.calculateSimilarity(property, p) > 0.6) // Рівень схожості > 60%
        .map(p => ({
          ...p,
          distance: this.calculateDistanceToProperty(property, p),
          similarity: this.calculateSimilarity(property, p)
        }))
        .sort((a, b) => b.similarity - a.similarity);

      return similarProperties;
    } catch (error) {
      console.error('Error finding similar properties:', error);
      return [];
    }
  }

  /**
   * Обчислює схожість між двома об'єктами нерухомості
   */
  private static calculateSimilarity(property1: PropertyData, property2: PropertyData): number {
    let similarity = 0;
    let factors = 0;

    // Кількість кімнат (вага 25%)
    if (property1.rooms === property2.rooms) {
      similarity += 0.25;
    } else if (Math.abs(property1.rooms - property2.rooms) === 1) {
      similarity += 0.15;
    }
    factors += 0.25;

    // Площа (вага 20%)
    const areaDiff = Math.abs(property1.area - property2.area) / Math.max(property1.area, property2.area);
    if (areaDiff < 0.1) { // Відхилення менше 10%
      similarity += 0.20;
    } else if (areaDiff < 0.2) { // Відхилення менше 20%
      similarity += 0.15;
    } else if (areaDiff < 0.3) { // Відхилення менше 30%
      similarity += 0.10;
    }
    factors += 0.20;

    // Тип будинку (вага 15%)
    if (property1.buildingType === property2.buildingType) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Стан (вага 15%)
    if (property1.condition === property2.condition) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Поверх (вага 10%)
    const floorDiff = Math.abs(property1.floor - property2.floor);
    if (floorDiff === 0) {
      similarity += 0.10;
    } else if (floorDiff <= 2) {
      similarity += 0.05;
    }
    factors += 0.10;

    // Загальна кількість поверхів (вага 10%)
    const totalFloorsDiff = Math.abs(property1.totalFloors - property2.totalFloors);
    if (totalFloorsDiff === 0) {
      similarity += 0.10;
    } else if (totalFloorsDiff <= 3) {
      similarity += 0.05;
    }
    factors += 0.10;

    // Балкон (вага 5%)
    if (property1.hasBalcony === property2.hasBalcony) {
      similarity += 0.05;
    }
    factors += 0.05;

    return similarity;
  }

  /**
   * Обчислює відстань до іншого об'єкта
   */
  private static calculateDistanceToProperty(property1: PropertyData, property2: PropertyData): number {
    if (!property1.coordinates || !property2.coordinates) {
      return Infinity;
    }

    return GeocodingService.calculateDistance(
      property1.coordinates.latitude,
      property1.coordinates.longitude,
      property2.coordinates.latitude,
      property2.coordinates.longitude
    );
  }

  /**
   * Отримує об'єкти в заданому радіусі від точки
   */
  static async getPropertiesInRadius(
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000,
    limit: number = 50
  ): Promise<PropertyData[]> {
    try {
      const savedProperties = await this.getSavedProperties();
      const allProperties = Object.values(savedProperties).filter(p => p.coordinates);

      const nearbyProperties = GeocodingService.findNearbyProperties(
        latitude,
        longitude,
        allProperties.map(p => ({
          latitude: p.coordinates!.latitude,
          longitude: p.coordinates!.longitude,
          id: p.id!
        })),
        radiusMeters
      ).slice(0, limit);

      return nearbyProperties.map(({ id }) => savedProperties[id]);
    } catch (error) {
      console.error('Error getting properties in radius:', error);
      return [];
    }
  }

  /**
   * Геокодує адресу та повертає координати
   */
  static async geocodeAddress(address: string, city: string = 'Харків'): Promise<{ latitude: number; longitude: number } | null> {
    const result = await GeocodingService.geocodeAddress(address, city);
    return result ? {
      latitude: result.latitude,
      longitude: result.longitude
    } : null;
  }

  /**
   * Перетворює координати в адресу
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const result = await GeocodingService.reverseGeocode(latitude, longitude);
    return result?.address || null;
  }
}
