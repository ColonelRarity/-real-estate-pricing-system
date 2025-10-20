import requests
from bs4 import BeautifulSoup
import re
import json
import time
from datetime import datetime, timedelta
from fake_useragent import UserAgent
import logging
from typing import List, Dict, Optional, Tuple
import asyncio
import aiohttp

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OLXScraper:
    """Парсер оголошень нерухомості з OLX.ua"""

    def __init__(self):
        self.base_url = "https://www.olx.ua"
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

        return f"{self.base_url}/neruhomist/kvartyry/prodazha-kvartyr/{city_code}/?page={page}"

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
        """Парсить одне оголошення"""
        try:
            # ID оголошення
            data_id = listing_html.get('data-id')
            if not data_id:
                return None

            # Заголовок
            title_elem = listing_html.find('h6', class_='css-16v5mdi')
            title = title_elem.get_text(strip=True) if title_elem else ''

            # Ціна
            price_elem = listing_html.find('p', class_='css-10b0gli')
            price_text = price_elem.get_text(strip=True) if price_elem else '0'

            # Очищаємо ціну від зайвих символів
            price_uah = self._extract_price(price_text)

            # Посилання
            link_elem = listing_html.find('a', class_='css-rc5s2u')
            url = link_elem['href'] if link_elem else ''
            if url.startswith('/'):
                url = self.base_url + url

            # Локація (район)
            location_elem = listing_html.find('p', class_='css-veheph')
            location = location_elem.get_text(strip=True) if location_elem else ''

            # Спробуємо витягти адресу з детальнішої інформації
            address = self._extract_address_from_listing(listing_html)

            # Дата публікації
            date_elem = listing_html.find('p', class_='css-1mwd0pk')
            date_text = date_elem.get_text(strip=True) if date_elem else ''

            # Зображення
            img_elem = listing_html.find('img')
            images = [img_elem['src']] if img_elem and img_elem.get('src') else []

            # Опис (з детальної сторінки)
            description = self._get_description(url) if url else ''

            # Парсимо деталі з заголовка та опису
            details = self._parse_details(title + ' ' + description + ' ' + location)

            # Спробуємо витягти координати з карти (якщо є)
            coordinates = self._extract_coordinates(url)

            return {
                'external_id': data_id,
                'source': 'olx',
                'title': title,
                'description': description,
                'price_uah': price_uah,
                'url': url,
                'location': location,
                'address': address,  # Детальніша адреса
                'date_text': date_text,
                'images': json.dumps(images),
                'latitude': coordinates.get('latitude') if coordinates else None,
                'longitude': coordinates.get('longitude') if coordinates else None,
                **details
            }

        except Exception as e:
            logger.error(f"Помилка парсингу оголошення: {e}")
            return None

    def _extract_price(self, price_text: str) -> int:
        """Витягує числове значення ціни"""
        # Видаляємо всі нечислові символи, крім цифр та ком
        clean_text = re.sub(r'[^\d,]', '', price_text)
        # Замінюємо кому на крапку для float
        clean_text = clean_text.replace(',', '')

        try:
            return int(float(clean_text))
        except ValueError:
            return 0

    def _extract_address_from_listing(self, listing_html) -> str:
        """Витягує детальнішу адресу з оголошення"""
        try:
            # Шукаємо елемент з адресою
            address_elem = listing_html.find('p', class_='css-1mwd0pk')
            if address_elem:
                address_text = address_elem.get_text(strip=True)
                # Видаляємо зайві слова типу "Сьогодні" або "Опубліковано"
                address = re.sub(r'^(Сьогодні|Опубліковано|оновлено)\s*', '', address_text)
                return address

            return ''
        except Exception as e:
            logger.warning(f"Не вдалося витягти адресу: {e}")
            return ''

    def _extract_coordinates(self, url: str) -> Optional[Dict[str, float]]:
        """Спробуємо витягти координати з карти на сторінці оголошення"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # Шукаємо карту або координати в мета-тегах
            map_script = soup.find('script', string=re.compile('latitude|longitude|lat|lng'))
            if map_script:
                script_text = map_script.string

                # Шукаємо координати в JavaScript коді
                lat_match = re.search(r'latitude["\s]*:?\s*([0-9.-]+)', script_text)
                lng_match = re.search(r'longitude["\s]*:?\s*([0-9.-]+)', script_text)

                if lat_match and lng_match:
                    return {
                        'latitude': float(lat_match.group(1)),
                        'longitude': float(lng_match.group(1))
                    }

            # Альтернативний пошук в мета-тегах
            meta_og_lat = soup.find('meta', property='og:latitude')
            meta_og_lng = soup.find('meta', property='og:longitude')

            if meta_og_lat and meta_og_lng:
                return {
                    'latitude': float(meta_og_lat.get('content', '')),
                    'longitude': float(meta_og_lng.get('content', ''))
                }

            return None

        except Exception as e:
            logger.warning(f"Не вдалося витягти координати для {url}: {e}")
            return None

    def _get_description(self, url: str) -> str:
        """Отримує опис з детальної сторінки оголошення"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code != 200:
                return ''

            soup = BeautifulSoup(response.text, 'html.parser')

            # Шукаємо опис
            desc_elem = soup.find('div', class_='css-g5mtbi')
            if desc_elem:
                return desc_elem.get_text(strip=True)

            # Альтернативний селектор
            desc_elem = soup.find('div', class_='css-1t507yq')
            if desc_elem:
                return desc_elem.get_text(strip=True)

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
            r'четырехкомнатн'
        ]

        for pattern in room_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if 'одно' in text_lower:
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
        area_match = re.search(r'(\d+(?:[,.]\d+)?)\s*м²', text_lower)
        if area_match:
            area = area_match.group(1).replace(',', '.')
            details['area_total'] = float(area)

        # Площа з кв.м.
        if details['area_total'] == 0.0:
            area_match = re.search(r'(\d+(?:[,.]\d+)?)\s*кв\.?\s*м', text_lower)
            if area_match:
                area = area_match.group(1).replace(',', '.')
                details['area_total'] = float(area)

        # Поверх
        floor_match = re.search(r'(\d+)/(\d+)\s*повер', text_lower)
        if floor_match:
            details['floor'] = int(floor_match.group(1))
            details['total_floors'] = int(floor_match.group(2))

        # Альтернативний пошук поверхів
        if details['floor'] == 1 and details['total_floors'] == 1:
            floor_match = re.search(r'поверх?\s*(\d+)[^\d]*(\d+)', text_lower)
            if floor_match:
                details['floor'] = int(floor_match.group(1))
                details['total_floors'] = int(floor_match.group(2))

        # Тип будинку
        if 'цегла' in text_lower or 'кирпич' in text_lower or 'цегляний' in text_lower:
            details['building_type'] = 'brick'
        elif 'панель' in text_lower or 'панельний' in text_lower:
            details['building_type'] = 'panel'
        elif 'моноліт' in text_lower or 'монолит' in text_lower or 'монолітний' in text_lower:
            details['building_type'] = 'monolithic'
        elif 'дерево' in text_lower or 'дерев\'яний' in text_lower:
            details['building_type'] = 'wood'

        # Балкон
        if 'балкон' in text_lower or 'лоджія' in text_lower or 'балкона' in text_lower:
            details['has_balcony'] = True

        # Ліфт
        if 'ліфт' in text_lower or 'лифт' in text_lower or 'ліфта' in text_lower:
            details['has_elevator'] = True

        # Опалення
        if 'автономне' in text_lower or 'індивідуальне' in text_lower or 'автономного' in text_lower:
            details['heating'] = 'individual'
        elif 'центральне' in text_lower or 'центрального' in text_lower:
            details['heating'] = 'central'

        # Стан квартири
        if 'євроремонт' in text_lower or 'євро ремонт' in text_lower or 'дизайнерський' in text_lower:
            details['condition'] = 'excellent'
        elif 'косметичний' in text_lower or 'добрий стан' in text_lower:
            details['condition'] = 'good'
        elif 'потребує ремонту' in text_lower or 'ремонту' in text_lower:
            details['condition'] = 'fair'

        return details

    def scrape_city_listings(self, city: str, max_pages: int = 5) -> List[Dict]:
        """Збирає оголошення з одного міста"""
        logger.info(f"Починаю збір оголошень для міста: {city}")

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

                # Знаходимо всі оголошення на сторінці
                listings = soup.find_all('div', {'data-testid': 'listing-ad'})

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

        logger.info(f"Зібрано {len(all_listings)} оголошень для {city}")
        return all_listings

    def scrape_multiple_cities(self, cities: List[str], max_pages_per_city: int = 3) -> Dict[str, List[Dict]]:
        """Збирає оголошення з декількох міст"""
        results = {}

        for city in cities:
            try:
                listings = self.scrape_city_listings(city, max_pages_per_city)
                results[city] = listings
                logger.info(f"Завершено збір для {city}: {len(listings)} оголошень")

                # Пауза між містами
                time.sleep(5)

            except Exception as e:
                logger.error(f"Помилка при зборі для міста {city}: {e}")
                results[city] = []

        return results

# Асинхронна версія для кращої продуктивності
class AsyncOLXScraper:
    """Асинхронний парсер OLX"""

    def __init__(self):
        self.base_url = "https://www.olx.ua"
        self.ua = UserAgent()

    async def scrape_listing_async(self, session: aiohttp.ClientSession, listing_html: str) -> Optional[Dict]:
        """Асинхронний парсинг одного оголошення"""
        try:
            soup = BeautifulSoup(listing_html, 'html.parser')

            # ID оголошення
            data_id = soup.find('div', {'data-id': True})
            if not data_id:
                return None

            data_id = data_id['data-id']

            # Заголовок
            title_elem = soup.find('h6', class_='css-16v5mdi')
            title = title_elem.get_text(strip=True) if title_elem else ''

            # Ціна
            price_elem = soup.find('p', class_='css-10b0gli')
            price_text = price_elem.get_text(strip=True) if price_elem else '0'
            price_uah = self._extract_price(price_text)

            # Посилання
            link_elem = soup.find('a', class_='css-rc5s2u')
            url = link_elem['href'] if link_elem else ''
            if url.startswith('/'):
                url = self.base_url + url

            return {
                'external_id': data_id,
                'source': 'olx',
                'title': title,
                'price_uah': price_uah,
                'url': url,
                'scraped_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Помилка асинхронного парсингу: {e}")
            return None

    def _extract_price(self, price_text: str) -> int:
        """Витягує числове значення ціни"""
        clean_text = re.sub(r'[^\d,]', '', price_text)
        clean_text = clean_text.replace(',', '')

        try:
            return int(float(clean_text))
        except ValueError:
            return 0
