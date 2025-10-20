"""
Конфігурація для системи автоматичного парсингу нерухомості
"""

import os
from typing import List, Dict, Any

class Config:
    """Конфігурація системи парсингу"""

    # Налаштування парсингу
    CITIES = ['Харків', 'Київ', 'Одеса', 'Дніпро', 'Львів']
    SOURCES = ['olx', 'dom_ria', 'realt', 'address']
    MAX_PAGES_PER_CITY = 3
    REQUEST_DELAY = 2  # секунди між запитами

    # Налаштування бази даних
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///real_estate.db')

    # Налаштування планувальника
    SCRAPING_INTERVAL_HOURS = 1  # інтервал між запусками парсингу

    # Налаштування логування
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'auto_scraping.log'
    LOG_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5

    # Налаштування анти-блокувань
    USER_AGENTS_POOL = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ]

    # Налаштування проксі (якщо потрібно)
    USE_PROXIES = False
    PROXY_LIST = []

    # Налаштування телеграм сповіщень (опціонально)
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

    # Черга завдань для асинхронного парсингу
    ASYNC_WORKERS = 4

    @classmethod
    def get_source_config(cls) -> Dict[str, Any]:
        """Конфігурація для кожного джерела"""
        return {
            'olx': {
                'base_url': 'https://www.olx.ua',
                'search_path': '/neruhomist/kvartyry/prodazha-kvartyr',
                'encoding': 'utf-8',
                'request_delay': cls.REQUEST_DELAY,
            },
            'dom_ria': {
                'base_url': 'https://dom.ria.com',
                'search_path': '/uk/prodazha-kvartir',
                'encoding': 'utf-8',
                'request_delay': cls.REQUEST_DELAY,
            },
            'realt': {
                'base_url': 'https://realt.ua',
                'search_path': '/arenda-kvartir',
                'encoding': 'utf-8',
                'request_delay': cls.REQUEST_DELAY,
            },
            'address': {
                'base_url': 'https://address.ua',
                'search_path': '/prodazha-kvartir',
                'encoding': 'utf-8',
                'request_delay': cls.REQUEST_DELAY,
            }
        }
