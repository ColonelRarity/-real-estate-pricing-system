#!/usr/bin/env python3
"""
Тестовий скрипт для перевірки роботи нових парсерів
"""

import os
import sys
import logging

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_collection.scrapers.domria_scraper import DomRiaScraper
from data_collection.scrapers.realt_scraper import RealtScraper
from data_collection.scrapers.address_scraper import AddressScraper

# Налаштування логування
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_domria_scraper():
    """Тест Dom.Ria парсера"""
    print("=== Тест Dom.Ria парсера ===")

    scraper = DomRiaScraper()

    try:
        # Тестуємо тільки для одного міста та однієї сторінки для швидкості
        listings = scraper.scrape_city_listings('Харків', max_pages=1)

        print(f"✓ Зібрано {len(listings)} оголошень з Dom.Ria")

        if listings:
            print("Перше оголошення:")
            listing = listings[0]
            print(f"  - ID: {listing.get('external_id')}")
            print(f"  - Ціна: {listing.get('price_uah')}")
            print(f"  - Район: {listing.get('location')}")
            print(f"  - Кімнат: {listing.get('rooms')}")
            print(f"  - Площа: {listing.get('area_total')}")

    except Exception as e:
        print(f"✗ Помилка тестування Dom.Ria: {e}")

def test_realt_scraper():
    """Тест Realt.ua парсера"""
    print("\n=== Тест Realt.ua парсера ===")

    scraper = RealtScraper()

    try:
        # Тестуємо тільки для одного міста та однієї сторінки для швидкості
        listings = scraper.scrape_city_listings('Харків', max_pages=1)

        print(f"✓ Зібрано {len(listings)} оголошень з Realt.ua")

        if listings:
            print("Перше оголошення:")
            listing = listings[0]
            print(f"  - ID: {listing.get('external_id')}")
            print(f"  - Ціна: {listing.get('price_uah')}")
            print(f"  - Район: {listing.get('location')}")
            print(f"  - Кімнат: {listing.get('rooms')}")
            print(f"  - Площа: {listing.get('area_total')}")

    except Exception as e:
        print(f"✗ Помилка тестування Realt.ua: {e}")

def test_address_scraper():
    """Тест Address.ua парсера"""
    print("\n=== Тест Address.ua парсера ===")

    scraper = AddressScraper()

    try:
        # Тестуємо тільки для одного міста та однієї сторінки для швидкості
        listings = scraper.scrape_city_listings('Харків', max_pages=1)

        print(f"✓ Зібрано {len(listings)} оголошень з Address.ua")

        if listings:
            print("Перше оголошення:")
            listing = listings[0]
            print(f"  - ID: {listing.get('external_id')}")
            print(f"  - Ціна: {listing.get('price_uah')}")
            print(f"  - Район: {listing.get('location')}")
            print(f"  - Кімнат: {listing.get('rooms')}")
            print(f"  - Площа: {listing.get('area_total')}")

    except Exception as e:
        print(f"✗ Помилка тестування Address.ua: {e}")

def test_multiple_scrapers():
    """Тест всіх нових парсерів разом"""
    print("\n=== Тест всіх нових парсерів ===")

    scrapers = [
        ('Dom.Ria', DomRiaScraper()),
        ('Realt.ua', RealtScraper()),
        ('Address.ua', AddressScraper()),
    ]

    total_listings = 0

    for name, scraper in scrapers:
        try:
            print(f"\nТестую {name}...")
            listings = scraper.scrape_city_listings('Харків', max_pages=1)

            count = len(listings)
            total_listings += count
            print(f"✓ {name}: {count} оголошень")

        except Exception as e:
            print(f"✗ {name}: помилка - {e}")

    print(f"\nЗагалом зібрано {total_listings} оголошень з нових джерел")

def main():
    """Основна функція"""
    print("Запускаю тести нових парсерів...\n")

    try:
        test_domria_scraper()
        test_realt_scraper()
        test_address_scraper()
        test_multiple_scrapers()

        print("\n✓ Всі тести завершено!")

    except KeyboardInterrupt:
        print("\nТести перервано користувачем")
    except Exception as e:
        print(f"\n✗ Критична помилка: {e}")
        raise

if __name__ == "__main__":
    main()
