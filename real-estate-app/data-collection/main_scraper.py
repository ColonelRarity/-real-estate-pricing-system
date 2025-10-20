#!/usr/bin/env python3
"""
Основний скрипт для збору даних про нерухомість з різних джерел
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any
import asyncio
import aiohttp

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.olx_scraper import OLXScraper
from scrapers.domria_scraper import DomRiaScraper
from scrapers.realt_scraper import RealtScraper
from scrapers.address_scraper import AddressScraper
from models import PropertyListing, City, District, MarketStats
from database import DatabaseManager

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraping.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataCollector:
    """Основний клас для збору та обробки даних"""

    def __init__(self, db_url: str = None):
        self.db = DatabaseManager(db_url or os.getenv('DATABASE_URL', 'sqlite:///real_estate.db'))

        # Ініціалізуємо парсери
        self.scrapers = {
            'olx': OLXScraper(),
            'dom_ria': DomRiaScraper(),
            'realt': RealtScraper(),
            'address': AddressScraper(),
        }


    def collect_data(self, cities: List[str], sources: List[str] = None, max_pages: int = 3) -> Dict:
        """Збирає дані з вказаних джерел для міст"""
        if sources is None:
            sources = ['olx', 'dom_ria']

        logger.info(f"Починаю збір даних для міст: {cities}")
        logger.info(f"Джерела: {sources}")

        all_data = {}

        for source in sources:
            if source not in self.scrapers:
                logger.warning(f"Непідтримуваний джерело: {source}")
                continue

            scraper = self.scrapers[source]
            logger.info(f"Збираю дані з {source}")

            try:
                # Збираємо дані з одного джерела для всіх міст
                source_data = scraper.scrape_multiple_cities(cities, max_pages)

                # Зберігаємо дані в базу
                self._save_listings_to_db(source_data, source)

                all_data[source] = source_data
                logger.info(f"Завершено збір з {source}")

            except Exception as e:
                logger.error(f"Помилка при зборі з {source}: {e}")

        return all_data

    def _save_listings_to_db(self, source_data: Dict[str, List[Dict]], source: str):
        """Зберігає оголошення в базу даних"""
        with self.db.get_session() as session:
            for city_name, listings in source_data.items():
                logger.info(f"Зберігаю {len(listings)} оголошень для {city_name}")

                for listing_data in listings:
                    try:
                        # Створюємо або оновлюємо оголошення
                        listing = session.query(PropertyListing).filter_by(
                            external_id=listing_data['external_id'],
                            source=source
                        ).first()

                        if listing:
                            # Оновлюємо існуюче оголошення
                            for key, value in listing_data.items():
                                if hasattr(listing, key):
                                    setattr(listing, key, value)
                            listing.last_seen_at = datetime.utcnow()
                        else:
                            # Створюємо нове оголошення
                            listing = PropertyListing(**listing_data)
                            session.add(listing)

                    except Exception as e:
                        logger.error(f"Помилка при збереженні оголошення {listing_data.get('external_id')}: {e}")

            session.commit()

    def get_latest_data(self, city: str = None, limit: int = 100) -> List[Dict]:
        """Отримує останні оголошення з бази даних"""
        with self.db.get_session() as session:
            query = session.query(PropertyListing).filter_by(is_active=True)

            if city:
                # Фільтруємо по місту
                city_obj = session.query(City).filter_by(name=city).first()
                if city_obj:
                    query = query.filter_by(city_id=city_obj.id)

            query = query.order_by(PropertyListing.created_at.desc()).limit(limit)

            listings = query.all()
            return [listing.to_dict() for listing in listings]

    def cleanup_old_data(self, days_old: int = 30):
        """Видаляє старі оголошення"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        with self.db.get_session() as session:
            deleted_count = session.query(PropertyListing).filter(
                PropertyListing.last_seen_at < cutoff_date
            ).update({'is_active': False})

            session.commit()
            logger.info(f"Деактивовано {deleted_count} старих оголошень")

    def export_to_json(self, filename: str = None, cities: List[str] = None):
        """Експортує дані в JSON файл"""
        if filename is None:
            filename = f"real_estate_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        data = {}
        if cities:
            for city in cities:
                data[city] = self.get_latest_data(city, limit=1000)
        else:
            data['all_cities'] = self.get_latest_data(limit=10000)

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

        logger.info(f"Експортовано дані в файл: {filename}")
        return filename

def main():
    """Основна функція"""
    parser = argparse.ArgumentParser(description='Збір даних про нерухомість')
    parser.add_argument('--cities', nargs='+', default=['Київ', 'Харків', 'Одеса'],
                        help='Міста для збору даних')
    parser.add_argument('--sources', nargs='+', default=['olx', 'dom_ria', 'realt', 'address'],
                        help='Джерела даних')
    parser.add_argument('--pages', type=int, default=2,
                        help='Кількість сторінок для парсингу')
    parser.add_argument('--export', action='store_true',
                        help='Експортувати дані в JSON')
    parser.add_argument('--cleanup', action='store_true',
                        help='Очистити старі дані')

    args = parser.parse_args()

    # Ініціалізуємо колектор
    collector = DataCollector()

    try:
        # Збираємо дані
        data = collector.collect_data(args.cities, args.sources, args.pages)

        # Показуємо статистику
        total_listings = sum(len(listings) for city_listings in data.values()
                           for listings in city_listings.values())

        logger.info(f"Загалом зібрано {total_listings} оголошень")

        # Експортуємо в JSON, якщо потрібно
        if args.export:
            collector.export_to_json(cities=args.cities)

        # Очищаємо старі дані, якщо потрібно
        if args.cleanup:
            collector.cleanup_old_data()

        logger.info("Збір даних завершено успішно")

    except KeyboardInterrupt:
        logger.info("Збір даних перервано користувачем")
    except Exception as e:
        logger.error(f"Критична помилка: {e}")
        raise

if __name__ == "__main__":
    main()
