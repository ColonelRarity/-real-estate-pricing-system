import requests
from bs4 import BeautifulSoup
import re
import json
import time
from datetime import datetime
from fake_useragent import UserAgent
import logging
from typing import List, Dict, Optional

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DomRiaScraper:
    """Парсер оголошень нерухомості з Dom.ria.com"""

    def __init__(self):
        self.base_url = "https://dom.ria.com"
        self.ua = UserAgent()
        self.session = requests.Session()

        # Заголовки для обходу блокувань
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def get_search_url(self, city: str, page: int = 1) -> str:
        """Формує URL для пошуку оголошень"""
        city_code = self._get_city_code(city)
        if not city_code:
            raise ValueError(f"Місто '{city}' не знайдено")

        return f"{self.base_url}/uk/prodazha-kvartir-{city_code}/?page={page}"

    def _get_city_code(self, city_name: str) -> Optional[str]:
        """Отримує код міста для URL"""
        city_codes = {
            'київ': 'kiev',
            'kharkiv': 'kharkov',
            'харків': 'kharkov',
            'odesa': 'odessa',
            'одеса': 'odessa',
            'dnipro': 'dnepropetrovsk',
            'дніпро': 'dnepropetrovsk',
            'lviv': 'lvov',
            'львів': 'lvov',
            'zaporizhzhya': 'zaporozhe',
            'запоріжжя': 'zaporozhe',
            'vinnytsya': 'vinnitsa',
            'вінниця': 'vinnitsa',
            'chernihiv': 'chernigov',
            'чернігів': 'chernigov',
            'cherkasy': 'cherkassy',
            'черкаси': 'cherkassy',
        }

        return city_codes.get(city_name.lower())

    def parse_listing(self, listing_html) -> Optional[Dict]:
        """Парсить одне оголошення (базова версія)"""
        try:
            # Базова інформація для тестування
            return {
                'external_id': f"domria_{int(time.time())}_{hash(listing_html) % 10000}",
                'source': 'dom_ria',
                'title': 'Test Dom.ria listing',
                'price_uah': 100000,
                'url': 'https://dom.ria.com/test',
                'scraped_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Помилка парсингу оголошення: {e}")
            return None

    def scrape_city_listings(self, city: str, max_pages: int = 1) -> List[Dict]:
        """Збирає оголошення з одного міста (базова версія для тестування)"""
        logger.info(f"Починаю збір оголошень для міста: {city}")

        all_listings = []

        # Для тестування повертаємо тестові дані
        test_listings = [
            {
                'external_id': f"domria_test_{i}",
                'source': 'dom_ria',
                'title': f'Тестове оголошення {i} в {city}',
                'price_uah': 100000 + i * 10000,
                'url': f'https://dom.ria.com/test/{i}',
                'city': city,
                'scraped_at': datetime.utcnow().isoformat()
            } for i in range(3)
        ]

        logger.info(f"Зібрано {len(test_listings)} тестових оголошень для {city}")
        return test_listings

    def scrape_multiple_cities(self, cities: List[str], max_pages_per_city: int = 1) -> Dict[str, List[Dict]]:
        """Збирає оголошення з декількох міст"""
        results = {}

        for city in cities:
            try:
                listings = self.scrape_city_listings(city, max_pages_per_city)
                results[city] = listings
                logger.info(f"Завершено збір для {city}: {len(listings)} оголошень")

                # Пауза між містами
                time.sleep(2)

            except Exception as e:
                logger.error(f"Помилка при зборі для міста {city}: {e}")
                results[city] = []

        return results
