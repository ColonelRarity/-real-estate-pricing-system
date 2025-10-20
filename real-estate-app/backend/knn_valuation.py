"""
KNN-based valuation system for real estate pricing
Алгоритм оцінки на основі K найближчих сусідів з вагуванням факторів схожості
"""

import logging
import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np

from database import DatabaseManager
from models import PropertyListing, City, District

logger = logging.getLogger(__name__)


@dataclass
class SimilarityWeights:
    """Ваги для факторів схожості"""
    # Локація та географія
    city_match: float = 1.0
    district_match: float = 0.9
    location_distance: float = 0.8  # вага для відстані між координатами
    distance_to_center: float = 0.6

    # Фізичні характеристики
    area_similarity: float = 0.9
    rooms_match: float = 0.8
    floor_similarity: float = 0.7
    total_floors_similarity: float = 0.6
    floor_category_match: float = 0.5

    # Будівля та якість
    building_type_match: float = 0.8
    year_built_similarity: float = 0.7
    condition_match: float = 0.6
    developer_match: float = 0.5
    building_series_match: float = 0.4

    # Зручності
    balcony_match: float = 0.3
    elevator_match: float = 0.3
    heating_match: float = 0.3

    # Тимчасові фактори
    days_on_market: float = 0.2
    listing_age: float = 0.1


class KNNValuator:
    """Алгоритм оцінки на основі K найближчих сусідів"""

    def __init__(self, db_manager: DatabaseManager, k: int = 10):
        self.db_manager = db_manager
        self.k = k
        self.weights = SimilarityWeights()
        self.city_centers = {
            'харків': (49.9935, 36.2304),
            'київ': (50.4501, 30.5234),
            'львів': (49.8397, 24.0297),
            'одеса': (46.4825, 30.7233),
            'дніпро': (48.4647, 35.0462)
        }

    def calculate_similarity_score(self, prop1: Dict[str, Any], prop2: Dict[str, Any]) -> float:
        """
        Обчислює показник схожості між двома об'єктами нерухомості
        Повертає значення від 0 до 1 (1 = ідентичні об'єкти)
        """
        score = 0.0
        total_weight = 0.0

        # Місто (критично важливий фактор)
        if prop1.get('city') and prop2.get('city'):
            city_match = 1.0 if prop1['city'].lower() == prop2['city'].lower() else 0.0
            score += city_match * self.weights.city_match
            total_weight += self.weights.city_match

        # Район
        if prop1.get('district') and prop2.get('district'):
            district_match = 1.0 if prop1['district'].lower() == prop2['district'].lower() else 0.0
            score += district_match * self.weights.district_match
            total_weight += self.weights.district_match

        # Відстань між координатами
        if all(key in prop1 and prop1[key] and key in prop2 and prop2[key]
               for key in ['latitude', 'longitude']):
            distance = self._calculate_distance(
                prop1['latitude'], prop1['longitude'],
                prop2['latitude'], prop2['longitude']
            )
            # Нормалізуємо відстань (чим ближче, тим вищий score)
            distance_score = max(0, 1 - (distance / 10))  # 10км максимум
            score += distance_score * self.weights.location_distance
            total_weight += self.weights.location_distance

        # Відстань до центру
        if prop1.get('distance_to_center') and prop2.get('distance_to_center'):
            center_dist_diff = abs(prop1['distance_to_center'] - prop2['distance_to_center'])
            center_score = max(0, 1 - (center_dist_diff / 5))  # 5км максимум
            score += center_score * self.weights.distance_to_center
            total_weight += self.weights.distance_to_center

        # Площа (чим ближче, тим краще)
        if prop1.get('area_total') and prop2.get('area_total'):
            area_diff = abs(prop1['area_total'] - prop2['area_total'])
            area_score = max(0, 1 - (area_diff / 100))  # 100м² максимум
            score += area_score * self.weights.area_similarity
            total_weight += self.weights.area_similarity

        # Кількість кімнат
        if prop1.get('rooms') and prop2.get('rooms'):
            rooms_match = 1.0 if prop1['rooms'] == prop2['rooms'] else 0.0
            score += rooms_match * self.weights.rooms_match
            total_weight += self.weights.rooms_match

        # Поверх
        if prop1.get('floor') and prop2.get('floor'):
            floor_diff = abs(prop1['floor'] - prop2['floor'])
            floor_score = max(0, 1 - (floor_diff / 20))  # 20 поверхів максимум
            score += floor_score * self.weights.floor_similarity
            total_weight += self.weights.floor_similarity

        # Загальна поверховість
        if prop1.get('total_floors') and prop2.get('total_floors'):
            floors_diff = abs(prop1['total_floors'] - prop2['total_floors'])
            floors_score = max(0, 1 - (floors_diff / 30))  # 30 поверхів максимум
            score += floors_score * self.weights.total_floors_similarity
            total_weight += self.weights.total_floors_similarity

        # Категорія поверху
        if prop1.get('floor_category') and prop2.get('floor_category'):
            floor_cat_match = 1.0 if prop1['floor_category'] == prop2['floor_category'] else 0.0
            score += floor_cat_match * self.weights.floor_category_match
            total_weight += self.weights.floor_category_match

        # Тип будинку
        if prop1.get('building_type') and prop2.get('building_type'):
            building_match = 1.0 if prop1['building_type'] == prop2['building_type'] else 0.0
            score += building_match * self.weights.building_type_match
            total_weight += self.weights.building_type_match

        # Рік будування
        if prop1.get('year_built') and prop2.get('year_built'):
            year_diff = abs(prop1['year_built'] - prop2['year_built'])
            year_score = max(0, 1 - (year_diff / 50))  # 50 років максимум
            score += year_score * self.weights.year_built_similarity
            total_weight += self.weights.year_built_similarity

        # Стан
        if prop1.get('condition') and prop2.get('condition'):
            condition_match = 1.0 if prop1['condition'] == prop2['condition'] else 0.0
            score += condition_match * self.weights.condition_match
            total_weight += self.weights.condition_match

        # Забудовник
        if prop1.get('developer') and prop2.get('developer'):
            dev_match = 1.0 if prop1['developer'].lower() == prop2['developer'].lower() else 0.0
            score += dev_match * self.weights.developer_match
            total_weight += self.weights.developer_match

        # Серія будинку
        if prop1.get('building_series') and prop2.get('building_series'):
            series_match = 1.0 if prop1['building_series'].lower() == prop2['building_series'].lower() else 0.0
            score += series_match * self.weights.building_series_match
            total_weight += self.weights.building_series_match

        # Балкон
        if prop1.get('has_balcony') is not None and prop2.get('has_balcony') is not None:
            balcony_match = 1.0 if prop1['has_balcony'] == prop2['has_balcony'] else 0.0
            score += balcony_match * self.weights.balcony_match
            total_weight += self.weights.balcony_match

        # Ліфт
        if prop1.get('has_elevator') is not None and prop2.get('has_elevator') is not None:
            elevator_match = 1.0 if prop1['has_elevator'] == prop2['has_elevator'] else 0.0
            score += elevator_match * self.weights.elevator_match
            total_weight += self.weights.elevator_match

        # Опалення
        if prop1.get('heating') and prop2.get('heating'):
            heating_match = 1.0 if prop1['heating'] == prop2['heating'] else 0.0
            score += heating_match * self.weights.heating_match
            total_weight += self.weights.heating_match

        # Повертаємо нормалізований score
        if total_weight > 0:
            return score / total_weight
        return 0.0

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Обчислює відстань між двома точками в кілометрах"""
        # Простий евклідовий розрахунок (достатній для міста)
        # Для більшої точності можна використовувати формулу гаверсинуса

        # Евклідова відстань
        distance = math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)

        # Перетворення в кілометри (приблизний коефіцієнт)
        # 1 градус широти ≈ 111 км, 1 градус довготи ≈ 111*cos(широта) км
        avg_lat = (lat1 + lat2) / 2
        km_per_degree_lat = 111.0
        km_per_degree_lon = 111.0 * math.cos(math.radians(avg_lat))

        distance_km = distance * km_per_degree_lat  # приблизний розрахунок

        return distance_km

    def find_similar_properties(self, target_property: Dict[str, Any], limit: int = None) -> List[Tuple[PropertyListing, float]]:
        """
        Знаходить схожі об'єкти нерухомості в базі даних
        Повертає список (об'єкт, score_схожості) відсортований за score
        """
        if limit is None:
            limit = self.k

        try:
            with self.db_manager.get_session() as session:
                # Отримуємо активні оголошення
                query = session.query(PropertyListing).filter(
                    PropertyListing.is_active == True,
                    PropertyListing.price_uah > 0,
                    PropertyListing.area_total > 0
                )

                # Фільтр по місту (якщо вказано)
                if target_property.get('city'):
                    city_obj = session.query(City).filter(
                        City.name.ilike(f"%{target_property['city']}%")
                    ).first()
                    if city_obj:
                        query = query.filter(PropertyListing.city_id == city_obj.id)

                # Фільтр по району (якщо вказано)
                if target_property.get('district'):
                    district_obj = session.query(District).filter(
                        District.name.ilike(f"%{target_property['district']}%")
                    ).first()
                    if district_obj:
                        query = query.filter(PropertyListing.district_id == district_obj.id)

                properties = query.all()

                # Обчислюємо схожість для кожного об'єкта
                similarities = []

                for prop in properties:
                    # Конвертуємо PropertyListing в словник для порівняння
                    prop_dict = {
                        'city': prop.city.name if prop.city else '',
                        'district': prop.district.name if prop.district else '',
                        'area_total': prop.area_total,
                        'rooms': prop.rooms,
                        'floor': prop.floor,
                        'total_floors': prop.total_floors,
                        'building_type': prop.building_type,
                        'year_built': prop.year_built,
                        'condition': prop.condition,
                        'has_balcony': prop.has_balcony,
                        'has_elevator': prop.has_elevator,
                        'heating': prop.heating,
                        'latitude': prop.latitude,
                        'longitude': prop.longitude,
                        'distance_to_center': prop.distance_to_center,
                        'floor_category': prop.floor_category,
                        'developer': prop.developer,
                        'building_series': prop.building_series
                    }

                    # Обчислюємо score схожості
                    similarity = self.calculate_similarity_score(target_property, prop_dict)

                    # Виключаємо сам об'єкт, якщо він вже є в базі
                    if target_property.get('id') != prop.id:
                        similarities.append((prop, similarity))

                # Сортуємо за схожістю (спадання)
                similarities.sort(key=lambda x: x[1], reverse=True)

                return similarities[:limit]

        except Exception as e:
            logger.error(f"Помилка пошуку схожих об'єктів: {e}")
            return []

    def estimate_price(self, target_property: Dict[str, Any], k: int = None) -> Dict[str, Any]:
        """
        Оцінює вартість нерухомості на основі схожих об'єктів
        """
        if k is None:
            k = self.k

        # Знаходимо схожі об'єкти
        similar_properties = self.find_similar_properties(target_property, k)

        if not similar_properties:
            return {
                'error': 'Не знайдено схожих об\'єктів для оцінки',
                'estimated_price': None,
                'confidence': 0.0,
                'similar_properties_count': 0
            }

        # Отримуємо ціни схожих об'єктів
        prices = []
        weights = []
        property_details = []

        for prop, similarity in similar_properties:
            if similarity > 0.1:  # Мінімальний поріг схожості
                prices.append(prop.price_uah)
                weights.append(similarity)
                property_details.append({
                    'id': prop.id,
                    'price_uah': prop.price_uah,
                    'area_total': prop.area_total,
                    'rooms': prop.rooms,
                    'address': prop.address,
                    'similarity': similarity,
                    'city': prop.city.name if prop.city else None,
                    'district': prop.district.name if prop.district else None,
                    'building_type': prop.building_type,
                    'year_built': prop.year_built
                })

        if not prices:
            return {
                'error': 'Недостатньо схожих об\'єктів для оцінки',
                'estimated_price': None,
                'confidence': 0.0,
                'similar_properties_count': len(similar_properties)
            }

        # Обчислюємо зважену середню ціну
        if weights:
            # Нормалізуємо ваги
            total_weight = sum(weights)
            if total_weight > 0:
                normalized_weights = [w / total_weight for w in weights]
                estimated_price = sum(p * w for p, w in zip(prices, normalized_weights))
            else:
                estimated_price = sum(prices) / len(prices)
        else:
            estimated_price = sum(prices) / len(prices)

        # Обчислюємо впевненість на основі кількості схожих об'єктів та їх ваги
        avg_similarity = sum(weights) / len(weights) if weights else 0
        confidence = min(0.95, avg_similarity * (len(prices) / k))

        # Обчислюємо діапазон цін
        if len(prices) >= 3:
            sorted_prices = sorted(prices)
            price_range = {
                'min': sorted_prices[int(len(sorted_prices) * 0.1)],  # 10-й перцентиль
                'max': sorted_prices[int(len(sorted_prices) * 0.9)]   # 90-й перцентиль
            }
        else:
            price_range = {
                'min': min(prices),
                'max': max(prices)
            }

        return {
            'estimated_price': int(estimated_price),
            'confidence': round(confidence, 2),
            'price_range': price_range,
            'similar_properties_count': len(prices),
            'avg_similarity': round(avg_similarity, 2),
            'similar_properties': property_details,
            'method': 'knn_weighted_average'
        }

    def get_market_stats(self, city: str = None, district: str = None) -> Dict[str, Any]:
        """Отримує статистику ринку для оцінки"""
        try:
            with self.db_manager.get_session() as session:
                query = session.query(PropertyListing).filter(
                    PropertyListing.is_active == True,
                    PropertyListing.price_uah > 0,
                    PropertyListing.area_total > 0
                )

                if city:
                    city_obj = session.query(City).filter(
                        City.name.ilike(f"%{city}%")
                    ).first()
                    if city_obj:
                        query = query.filter(PropertyListing.city_id == city_obj.id)

                if district:
                    district_obj = session.query(District).filter(
                        District.name.ilike(f"%{district}%")
                    ).first()
                    if district_obj:
                        query = query.filter(PropertyListing.district_id == district_obj.id)

                properties = query.all()

                if not properties:
                    return {}

                prices = [p.price_uah for p in properties]
                areas = [p.area_total for p in properties]

                return {
                    'total_listings': len(properties),
                    'avg_price': int(sum(prices) / len(prices)),
                    'median_price': int(sorted(prices)[len(prices) // 2]),
                    'avg_price_per_sqm': int((sum(prices) / sum(areas))),
                    'min_price': min(prices),
                    'max_price': max(prices),
                    'price_std': int(np.std(prices)) if len(prices) > 1 else 0
                }

        except Exception as e:
            logger.error(f"Помилка отримання статистики: {e}")
            return {}
