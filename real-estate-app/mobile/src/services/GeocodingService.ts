import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    suburb?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface ReverseGeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  district?: string;
  city?: string;
}

class GeocodingService {
  private static nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Перетворює адресу в координати
   */
  static async geocodeAddress(address: string, city: string = 'Харків'): Promise<GeocodingResult | null> {
    try {
      const query = `${address}, ${city}, Україна`;
      const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          countrycodes: 'ua',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'RealEstateApp/1.0',
        },
        timeout: 10000,
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
          address: result.address || {},
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Перетворює координати в адресу (reverse geocoding)
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      const response = await axios.get(`${this.nominatimBaseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'RealEstateApp/1.0',
        },
        timeout: 10000,
      });

      if (response.data) {
        const { lat, lon, display_name, address } = response.data;

        return {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          address: display_name,
          district: address.suburb || address.district || address.city_district,
          city: address.city || address.town || address.village,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Перевіряє, чи знаходиться адреса в межах Харкова
   */
  static isWithinKharkiv(latitude: number, longitude: number): boolean {
    // Межі Харкова (приблизні координати)
    const kharkivBounds = {
      north: 50.15,
      south: 49.85,
      east: 36.50,
      west: 36.05,
    };

    return (
      latitude >= kharkivBounds.south &&
      latitude <= kharkivBounds.north &&
      longitude >= kharkivBounds.west &&
      longitude <= kharkivBounds.east
    );
  }

  /**
   * Обчислює відстань між двома точками в метрах
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Радіус Землі в метрах
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Знаходить найближчі об'єкти в заданому радіусі
   */
  static findNearbyProperties(
    latitude: number,
    longitude: number,
    properties: Array<{ latitude: number; longitude: number; id: string }>,
    radiusMeters: number = 500
  ): Array<{ id: string; distance: number }> {
    return properties
      .map((property) => ({
        id: property.id,
        distance: this.calculateDistance(
          latitude,
          longitude,
          property.latitude,
          property.longitude
        ),
      }))
      .filter((property) => property.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }
}

export default GeocodingService;
