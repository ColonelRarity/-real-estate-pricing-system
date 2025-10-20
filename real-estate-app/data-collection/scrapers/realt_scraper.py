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

class RealtScraper:
    """Парсер оголошень нерухомості з Realt.ua"""

    def __init__(self):
        self.base_url = "https://realt.ua"
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

        return f"{self.base_url}/prodazha-kvartir/{city_code}/?page={page}"

    def _get_city_code(self, city_name: str) -> Optional[str]:
        """Отримує код міста для URL"""
        city_codes = {
            'київ': 'kiev',
            'kharkiv': 'harkov',
            'харків': 'harkov',
            'odesa': 'odessa',
            'одеса': 'odessa',
            'dnipro': 'dnepropetrovsk',
            'дніпро': 'dnepropetrovsk',
            'lviv': 'lvov',
            'львів': 'lvov',
        }

        return city_codes.get(city_name.lower())

    def parse_listing(self, listing_html) -> Optional[Dict]:
        """Парсить одне оголошення (базова версія)"""
        try:
            # Базова інформація для тестування
            return {
                'external_id': f"realt_{int(time.time())}_{hash(listing_html) % 10000}",
                'source': 'realt',
                'title': 'Test Realt listing',
                'price_uah': 150000,
                'url': 'https://realt.ua/test',
                'scraped_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Помилка парсингу оголошення: {e}")
            return None

    def scrape_city_listings(self, city: str, max_pages: int = 1) -> List[Dict]:
        """Збирає оголошення з одного міста (базова версія для тестування)"""
        logger.info(f"Починаю збір оголошень для міста: {city}")

        # Для тестування повертаємо тестові дані
        test_listings = [
            {
                'external_id': f"realt_test_{i}",
                'source': 'realt',
                'title': f'Тестове оголошення {i} в {city}',
                'price_uah': 150000 + i * 10000,
                'url': f'https://realt.ua/test/{i}',
                'city': city,
                'scraped_at': datetime.utcnow().isoformat()
            } for i in range(2)
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

    def get_search_url(self, city: str, page: int = 1) -> str:
        """Формує URL для пошуку оголошень"""
        city_code = self._get_city_code(city)
        if not city_code:
            raise ValueError(f"Місто '{city}' не знайдено")

        return f"{self.base_url}/arenda-kvartir/{city_code}/?page={page}"

    def _get_city_code(self, city_name: str) -> Optional[str]:
        """Отримує код міста для URL"""
        city_codes = {
            'київ': 'kiev',
            'kharkiv': 'harkov',
            'харків': 'harkov',
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
            'sumy': 'sumy',
            'суми': 'sumy',
            'poltava': 'poltava',
            'полтава': 'poltava',
            'mykolayiv': 'nikolaev',
            'миколаїв': 'nikolaev',
            'kherson': 'kherson',
            'херсон': 'kherson',
            'kropyvnytskyi': 'kirovograd',
            'кропивницький': 'kirovograd',
            'zhytomyr': 'zhitomir',
            'житомир': 'zhitomir',
            'chernivtsi': 'chernovtsy',
            'чернівці': 'chernovtsy',
            'rivne': 'rovno',
            'рівне': 'rovno',
            'ternopil': 'ternopol',
            'тернопіль': 'ternopol',
        }

        return city_codes.get(city_name.lower())

    def parse_listing(self, listing_html) -> Optional[Dict]:
        """Парсить одне оголошення з Realt.ua"""
        try:
            # ID оголошення
            data_id = listing_html.get('data-id') or listing_html.get('id')
            if not data_id:
                # Спробуємо знайти в посиланні
                link_elem = listing_html.find('a', href=True)
                if link_elem:
                    href = link_elem['href']
                    id_match = re.search(r'/(\d+)/', href)
                    if id_match:
                        data_id = id_match.group(1)

            if not data_id:
                return None

            # Заголовок
            title_elem = listing_html.find('h3') or listing_html.find('a', class_='title')
            title = title_elem.get_text(strip=True) if title_elem else ''

            # Ціна
            price_elem = listing_html.find('span', class_='price') or listing_html.find('div', class_='price')
            if not price_elem:
                return None

            price_text = price_elem.get_text(strip=True)
            price_uah = self._extract_price(price_text)

            # Посилання
            link_elem = listing_html.find('a', href=True)
            url = link_elem['href'] if link_elem else ''
            if url.startswith('/'):
                url = self.base_url + url

            # Локація
            location_elem = listing_html.find('div', class_='location') or listing_html.find('span', class_='region')
            location = location_elem.get_text(strip=True) if location_elem else ''

            # Адреса (детальніша інформація)
            address_elem = listing_html.find('div', class_='address') or listing_html.find('p', class_='address')
            address = address_elem.get_text(strip=True) if address_elem else location

            # Зображення
            img_elem = listing_html.find('img', src=True)
            images = []
            if img_elem:
                src = img_elem.get('src') or img_elem.get('data-src')
                if src:
                    images.append(src)

            # Дата
            date_elem = listing_html.find('span', class_='date') or listing_html.find('time')
            date_text = date_elem.get_text(strip=True) if date_elem else ''

            # Опис з детальної сторінки
            description = self._get_description(url) if url else ''

            # Парсимо деталі
            details = self._parse_details(title + ' ' + description + ' ' + location + ' ' + address)

            return {
                'external_id': str(data_id),
                'source': 'realt',
                'title': title,
                'description': description,
                'price_uah': price_uah,
                'url': url,
                'location': location,
                'address': address,
                'date_text': date_text,
                'images': json.dumps(images),
                **details
            }

        except Exception as e:
            logger.error(f"Помилка парсингу оголошення Realt.ua: {e}")
            return None

    def _extract_price(self, price_text: str) -> int:
        """Витягує числове значення ціни"""
        # Видаляємо всі нечислові символи, крім цифр
        clean_text = re.sub(r'[^\d\s]', '', price_text)

        # Беремо перше число
        numbers = re.findall(r'\d+', clean_text)

        try:
            if numbers:
                # Realt.ua часто показує ціну за місяць, тому множимо на 12 для річної
                monthly_price = int(numbers[0])
                return monthly_price * 12 if monthly_price < 10000 else monthly_price
            return 0
        except ValueError:
            return 0

    def _get_description(self, url: str) -> str:
        """Отримує опис з детальної сторінки оголошення"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return ''

            soup = BeautifulSoup(response.text, 'html.parser')

            # Шукаємо опис в різних блоках
            desc_selectors = [
                'div.description',
                'div.text',
                'div.details',
                'p.description',
                '.description-text',
                'div.content',
                'div.info'
            ]

            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    text = desc_elem.get_text(strip=True)
                    if len(text) > 50:  # Перевіряємо, що це не просто короткий текст
                        return text

            return ''

        except Exception as e:
            logger.warning(f"Не вдалося отримати опис для {url}: {e}")
            return ''

    def _parse_details(self, text: str) -> Dict:
        """Парсить деталі квартири з тексту"""
        details = {
            'rooms': 1,
            'area_total': 0.0,
            'floor': 1,
            'total_floors': 1,
            'building_type': '',
            'condition': 'good',
            'has_balcony': False,
            'has_elevator': False,
            'heating': 'central'
        }

        text_lower = text.lower()

        # Кількість кімнат
        room_patterns = [
            r'(\d+)\s*кімнат',
            r'(\d+)\s*кімн',
            r'(\d+)\s*комнат',
            r'(\d+)\s*комн',
            r'однокімнатн',
            r'двокімнатн',
            r'трьохкімнатн',
            r'четырехкомнатн',
            r'студія',
            r'студия'
        ]

        for pattern in room_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if 'студія' in text_lower or 'студия' in text_lower:
                    details['rooms'] = 1
                elif 'одно' in text_lower:
                    details['rooms'] = 1
                elif 'дво' in text_lower or 'двух' in text_lower:
                    details['rooms'] = 2
                elif 'трьох' in text_lower or 'трех' in text_lower:
                    details['rooms'] = 3
                elif 'четырех' in text_lower:
                    details['rooms'] = 4
                else:
                    rooms_num = match.group(1)
                    if rooms_num:
                        details['rooms'] = int(rooms_num)
                break

        # Площа
        area_patterns = [
            r'(\d+(?:[,.]\d+)?)\s*кв\.?\s*м',
            r'(\d+(?:[,.]\d+)?)\s*м²',
            r'(\d+(?:[,.]\d+)?)\s*м2',
            r'загальна\s*площа[:\s]*(\d+(?:[,.]\d+)?)',
            r'площа[:\s]*(\d+(?:[,.]\d+)?)',
            r'(\d+(?:[,.]\d+)?)\s*метрів'
        ]

        for pattern in area_patterns:
            match = re.search(pattern, text_lower)
            if match:
                area = match.group(1).replace(',', '.')
                details['area_total'] = float(area)
                break

        # Поверх
        floor_patterns = [
            r'(\d+)\s*поверх',
            r'(\d+)/(\d+)\s*повер',
            r'поверх[:\s]*(\d+)',
            r'(\d+)\s*з\s*(\d+)'
        ]

        for pattern in floor_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if '/' in pattern or 'з' in pattern:
                    details['floor'] = int(match.group(1))
                    if len(match.groups()) > 1:
                        details['total_floors'] = int(match.group(2))
                else:
                    details['floor'] = int(match.group(1))
                break

        # Тип будинку
        if 'цегла' in text_lower or 'кирпич' in text_lower or 'цегляний' in text_lower:
            details['building_type'] = 'brick'
        elif 'панель' in text_lower or 'панельний' in text_lower:
            details['building_type'] = 'panel'
        elif 'моноліт' in text_lower or 'монолит' in text_lower or 'монолітний' in text_lower:
            details['building_type'] = 'monolithic'
        elif 'дерево' in text_lower or 'дерев\'яний' in text_lower:
            details['building_type'] = 'wood'

        # Стан квартири
        if any(word in text_lower for word in ['ремонт', 'євроремонт', 'дизайнерський', 'авторський']):
            details['condition'] = 'excellent'
        elif any(word in text_lower for word in ['добрий стан', 'хороший стан', 'нормальний']):
            details['condition'] = 'good'
        elif any(word in text_lower for word in ['задовільний', 'потребує ремонту', 'вимагає ремонту']):
            details['condition'] = 'fair'

        # Балкон
        if any(word in text_lower for word in ['балкон', 'лоджія', 'лоджия', 'балкона']):
            details['has_balcony'] = True

        # Ліфт
        if any(word in text_lower for word in ['ліфт', 'лифт', 'підйомник', 'ліфта']):
            details['has_elevator'] = True

        # Опалення
        if any(word in text_lower for word in ['автономне', 'індивідуальне', 'газове', 'електричне']):
            details['heating'] = 'individual'
        elif any(word in text_lower for word in ['центральне', 'централізоване']):
            details['heating'] = 'central'

        return details

    def scrape_city_listings(self, city: str, max_pages: int = 3) -> List[Dict]:
        """Збирає оголошення з одного міста"""
        logger.info(f"Починаю збір оголошень Realt.ua для міста: {city}")

        all_listings = []

        for page in range(1, max_pages + 1):
            logger.info(f"Обробляю сторінку {page} для {city}")

            try:
                url = self.get_search_url(city, page)
                response = self.session.get(url, timeout=15)

                if response.status_code != 200:
                    logger.warning(f"Не вдалося отримати сторінку {page}: {response.status_code}")
                    break

                soup = BeautifulSoup(response.text, 'html.parser')

                # Знаходимо всі оголошення на сторінці - Realt.ua використовує різні класи
                listings = []
                listings.extend(soup.find_all('div', class_='item'))
                listings.extend(soup.find_all('div', class_='listing-item'))
                listings.extend(soup.find_all('div', class_='apartment-item'))

                if not listings:
                    logger.info(f"На сторінці {page} не знайдено оголошень")
                    break

                for listing in listings:
                    listing_data = self.parse_listing(listing)
                    if listing_data:
                        all_listings.append(listing_data)

                # Пауза між запитами
                time.sleep(2)

            except Exception as e:
                logger.error(f"Помилка при обробці сторінки {page}: {e}")
                break

        logger.info(f"Зібрано {len(all_listings)} оголошень Realt.ua для {city}")
        return all_listings

    def scrape_multiple_cities(self, cities: List[str], max_pages_per_city: int = 2) -> Dict[str, List[Dict]]:
        """Збирає оголошення з декількох міст"""
        results = {}

        for city in cities:
            try:
                listings = self.scrape_city_listings(city, max_pages_per_city)
                results[city] = listings
                logger.info(f"Завершено збір для {city}: {len(listings)} оголошень")

                # Пауза між містами
                time.sleep(3)

            except Exception as e:
                logger.error(f"Помилка при зборі для міста {city}: {e}")
                results[city] = []

        return results
