#!/usr/bin/env python3
"""
Скрипт для геокодування існуючих адрес в базі даних
"""

import os
import sys
import logging
from typing import Dict, List, Optional
import time

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import PropertyListing, City
from database import DatabaseManager
import requests

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('geocoding_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GeocodingMigrator:
    """Мігратор для геокодування адрес"""

    def __init__(self, db_url: str = None):
        self.db = DatabaseManager(db_url or os.getenv('DATABASE_URL', 'sqlite:///real_estate.db'))
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'RealEstateMigration/1.0',
        })

    def geocode_address(self, address: str, city: str = 'Харків') -> Optional[Dict[str, float]]:
        """Геокодує адресу використовуючи Nominatim"""
        try:
            query = f"{address}, {city}, Україна"
            url = "https://nominatim.openstreetmap.org/search"

            response = self.session.get(url, params={
                'q': query,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'ua',
            }, timeout=10)

            if response.status_code == 200 and response.json():
                result = response.json()[0]
                return {
                    'latitude': float(result['lat']),
                    'longitude': float(result['lon'])
                }

            return None

        except Exception as e:
            logger.error(f"Помилка геокодування адреси '{address}': {e}")
            return None

    def migrate_existing_data(self):
        """Міграція існуючих даних"""
        logger.info("Починаю міграцію геоданих...")

        with self.db.get_session() as session:
            # Отримуємо всі оголошення без координат
            listings_without_coords = session.query(PropertyListing).filter(
                PropertyListing.latitude.is_(None),
                PropertyListing.longitude.is_(None),
                PropertyListing.address.isnot(None)
            ).all()

            logger.info(f"Знайдено {len(listings_without_coords)} оголошень без координат")

            updated_count = 0

            for listing in listings_without_coords:
                try:
                    # Отримуємо місто
                    city = session.query(City).filter_by(id=listing.city_id).first()
                    city_name = city.name if city else 'Харків'

                    # Спробуємо геокодувати адресу
                    coordinates = self.geocode_address(listing.address, city_name)

                    if coordinates:
                        listing.latitude = coordinates['latitude']
                        listing.longitude = coordinates['longitude']

                        # Оновлюємо також full_address якщо його немає
                        if not listing.full_address:
                            listing.full_address = listing.address

                        updated_count += 1
                        logger.info(f"Геокодовано: {listing.address} -> {coordinates}")

                        # Пауза між запитами для уникнення блокування
                        time.sleep(1)
                    else:
                        logger.warning(f"Не вдалося геокодувати: {listing.address}")

                except Exception as e:
                    logger.error(f"Помилка обробки оголошення {listing.id}: {e}")

            # Зберігаємо зміни
            session.commit()
            logger.info(f"Міграцію завершено. Оновлено {updated_count} записів")

    def cleanup_invalid_coordinates(self):
        """Очищає недійсні координати"""
        logger.info("Починаю очистку недійсних координат...")

        with self.db.get_session() as session:
            # Знаходимо записи з недійсними координатами (поза межами України)
            invalid_coords = session.query(PropertyListing).filter(
                PropertyListing.latitude.isnot(None),
                PropertyListing.longitude.isnot(None),
                ~((PropertyListing.latitude.between(44.0, 53.0)) &
                  (PropertyListing.longitude.between(22.0, 41.0)))
            ).all()

            logger.info(f"Знайдено {len(invalid_coords)} записів з недійсними координатами")

            for listing in invalid_coords:
                logger.warning(f"Недійсні координати: {listing.address} -> {listing.latitude}, {listing.longitude}")
                listing.latitude = None
                listing.longitude = None

            session.commit()
            logger.info("Очистку завершено")

    def add_indexes_for_performance(self):
        """Додає індекси для кращої продуктивності"""
        logger.info("Додаю індекси для геоданих...")

        # Створюємо індекси напряму через SQLAlchemy
        from sqlalchemy import Index

        # Індекс для геопошуку
        geo_index = Index('idx_property_geo', PropertyListing.latitude, PropertyListing.longitude)
        geo_index.create(self.db.engine)

        logger.info("Індекси додано")

def main():
    """Основна функція"""
    migrator = GeocodingMigrator()

    try:
        logger.info("Запускаю міграцію геоданих...")

        # Міграція існуючих даних
        migrator.migrate_existing_data()

        # Очистка недійсних координат
        migrator.cleanup_invalid_coordinates()

        # Додавання індексів
        migrator.add_indexes_for_performance()

        logger.info("Міграцію геоданих завершено успішно!")

    except KeyboardInterrupt:
        logger.info("Міграцію перервано користувачем")
    except Exception as e:
        logger.error(f"Критична помилка під час міграції: {e}")
        raise

if __name__ == "__main__":
    main()
