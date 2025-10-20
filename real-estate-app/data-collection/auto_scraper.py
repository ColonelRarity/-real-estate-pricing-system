#!/usr/bin/env python3
"""
Автоматична система парсингу нерухомості з планувальником завдань
"""

import os
import sys
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import requests
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.olx_scraper import OLXScraper
from scrapers.domria_scraper import DomRiaScraper
from scrapers.realt_scraper import RealtScraper
from scrapers.address_scraper import AddressScraper
from models import PropertyListing, City, District
from database import DatabaseManager
from config import Config

class AutoScrapingManager:
    """Менеджер автоматичного парсингу з планувальником"""

    def __init__(self):
        self.config = Config()
        self.db = DatabaseManager(self.config.DATABASE_URL)
        self.scheduler = BackgroundScheduler()

        # Ініціалізуємо скрапери з покращеною конфігурацією
        self.scrapers = {
            'olx': OLXScraper(),
            'dom_ria': DomRiaScraper(),
            'realt': RealtScraper(),
            'address': AddressScraper(),
        }

        # Статистика для моніторингу
        self.stats = {
            'total_runs': 0,
            'successful_runs': 0,
            'failed_runs': 0,
            'total_listings_collected': 0,
            'last_run_time': None,
            'errors': []
        }

        self._setup_logging()
        self._setup_scrapers()

    def _setup_logging(self):
        """Налаштовує розширене логування"""
        # Створюємо форматер для логів
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Налаштовуємо файловий логер з ротацією
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            self.config.LOG_FILE,
            maxBytes=self.config.LOG_MAX_SIZE,
            backupCount=self.config.LOG_BACKUP_COUNT
        )
        file_handler.setFormatter(formatter)

        # Налаштовуємо консольний логер
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)

        # Налаштовуємо кореневий логер
        logger = logging.getLogger()
        logger.setLevel(getattr(logging, self.config.LOG_LEVEL.upper()))
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        self.logger = logging.getLogger(__name__)

    def _setup_scrapers(self):
        """Налаштовує скрапери з анти-блокувальними заходами"""
        import random

        for scraper_name, scraper in self.scrapers.items():
            # Вибираємо випадковий User-Agent
            random_ua = random.choice(self.config.USER_AGENTS_POOL)
            scraper.session.headers.update({
                'User-Agent': random_ua,
                'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
                'Referer': 'https://www.google.com/',
            })

            self.logger.info(f"Налаштовано {scraper_name} з User-Agent: {random_ua[:50]}...")

    def collect_data_from_source(self, source: str, cities: List[str]) -> Dict[str, List[Dict]]:
        """Збирає дані з одного джерела для всіх міст"""
        if source not in self.scrapers:
            self.logger.error(f"Непідтримуваний джерело: {source}")
            return {}

        scraper = self.scrapers[source]
        self.logger.info(f"Починаю збір даних з {source} для міст: {cities}")

        try:
            # Збираємо дані з одного джерела для всіх міст
            source_data = scraper.scrape_multiple_cities(
                cities,
                self.config.MAX_PAGES_PER_CITY
            )

            # Зберігаємо дані в базу
            self._save_listings_to_db(source_data, source)

            listings_count = sum(len(listings) for listings in source_data.values())
            self.logger.info(f"Завершено збір з {source}: {listings_count} оголошень")

            return source_data

        except Exception as e:
            self.logger.error(f"Помилка при зборі з {source}: {e}")
            self.stats['errors'].append({
                'source': source,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
            return {}

    def _save_listings_to_db(self, source_data: Dict[str, List[Dict]], source: str):
        """Зберігає оголошення в базу даних з дедуплікацією"""
        with self.db.get_session() as session:
            for city_name, listings in source_data.items():
                self.logger.info(f"Зберігаю {len(listings)} оголошень для {city_name}")

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
                        self.logger.error(f"Помилка при збереженні оголошення {listing_data.get('external_id')}: {e}")

            session.commit()

    def run_full_scraping_cycle(self):
        """Запускає повний цикл парсингу всіх джерел"""
        self.logger.info("=" * 50)
        self.logger.info(f"ПОЧИНАЮ АВТОМАТИЧНИЙ ЦИКЛ ПАРСИНГУ #{self.stats['total_runs'] + 1}")
        self.logger.info("=" * 50)

        start_time = time.time()
        self.stats['total_runs'] += 1

        try:
            all_data = {}

            # Проходимо по всіх джерелах
            for source in self.config.SOURCES:
                source_data = self.collect_data_from_source(source, self.config.CITIES)
                all_data[source] = source_data

                # Пауза між джерелами
                time.sleep(5)

            # Підраховуємо статистику
            total_listings = sum(
                sum(len(listings) for listings in city_listings.values())
                for city_listings in all_data.values()
            )

            self.stats['total_listings_collected'] += total_listings
            self.stats['successful_runs'] += 1
            self.stats['last_run_time'] = datetime.utcnow()

            # Очищаємо старі помилки (залишаємо тільки останні 10)
            if len(self.stats['errors']) > 10:
                self.stats['errors'] = self.stats['errors'][-10:]

            execution_time = time.time() - start_time

            self.logger.info("=" * 50)
            self.logger.info(f"ЦИКЛ ПАРСИНГУ ЗАВЕРШЕНО УСПІШНО")
            self.logger.info(f"Час виконання: {execution_time:.2f} секунд")
            self.logger.info(f"Зібрано оголошень: {total_listings}")
            self.logger.info(f"Загалом за всі цикли: {self.stats['total_listings_collected']}")
            self.logger.info("=" * 50)

            # Надсилаємо сповіщення в Telegram (якщо налаштовано)
            self._send_telegram_notification(total_listings, execution_time)

        except Exception as e:
            self.stats['failed_runs'] += 1
            self.logger.error(f"Критична помилка в циклі парсингу: {e}")
            self.stats['errors'].append({
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })

    def _send_telegram_notification(self, listings_count: int, execution_time: float):
        """Надсилає сповіщення в Telegram про результати парсингу"""
        if not (self.config.TELEGRAM_BOT_TOKEN and self.config.TELEGRAM_CHAT_ID):
            return

        try:
            message = f"""
🤖 Автоматичний парсинг завершено

📊 Результати:
• Зібрано оголошень: {listings_count}
• Час виконання: {execution_time:.2f}с
• Цикл: #{self.stats['total_runs']}
• Загалом за всі цикли: {self.stats['total_listings_collected']}

⏰ Наступний цикл через {self.config.SCRAPING_INTERVAL_HOURS} годину
            """.strip()

            url = f"https://api.telegram.org/bot{self.config.TELEGRAM_BOT_TOKEN}/sendMessage"
            data = {
                'chat_id': self.config.TELEGRAM_CHAT_ID,
                'text': message,
                'parse_mode': 'HTML'
            }

            response = requests.post(url, data=data, timeout=10)
            if response.status_code == 200:
                self.logger.info("Сповіщення надіслано в Telegram")
            else:
                self.logger.warning(f"Помилка надсилання в Telegram: {response.status_code}")

        except Exception as e:
            self.logger.warning(f"Не вдалося надіслати сповіщення в Telegram: {e}")

    def get_status_report(self) -> Dict[str, Any]:
        """Повертає звіт про стан системи"""
        uptime = None
        if self.stats['last_run_time']:
            uptime = datetime.utcnow() - self.stats['last_run_time']

        return {
            'system_status': 'running',
            'total_runs': self.stats['total_runs'],
            'successful_runs': self.stats['successful_runs'],
            'failed_runs': self.stats['failed_runs'],
            'success_rate': (self.stats['successful_runs'] / max(1, self.stats['total_runs'])) * 100,
            'total_listings_collected': self.stats['total_listings_collected'],
            'last_run_time': self.stats['last_run_time'].isoformat() if self.stats['last_run_time'] else None,
            'uptime_seconds': uptime.total_seconds() if uptime else None,
            'recent_errors': self.stats['errors'][-5:],  # Останні 5 помилок
            'next_run_in': self._get_next_run_time(),
        }

    def _get_next_run_time(self) -> Optional[str]:
        """Повертає час наступного запуску"""
        try:
            # Отримуємо наступний запланований запуск
            job = self.scheduler.get_job('scraping_cycle')
            if job and job.next_run_time:
                return job.next_run_time.isoformat()
        except:
            pass
        return None

    def start_scheduler(self):
        """Запускає планувальник завдань"""
        self.logger.info("Запускаю планувальник автоматичного парсингу...")

        # Плануємо завдання парсингу
        trigger = IntervalTrigger(hours=self.config.SCRAPING_INTERVAL_HOURS)

        self.scheduler.add_job(
            func=self.run_full_scraping_cycle,
            trigger=trigger,
            id='scraping_cycle',
            name='Full Scraping Cycle',
            replace_existing=True
        )

        # Додаємо обробники подій для моніторингу
        def job_executed_listener(event):
            self.logger.info(f"Завдання {event.job_id} виконано успішно")

        def job_error_listener(event):
            self.logger.error(f"Помилка в завданні {event.job_id}: {event.exception}")

        self.scheduler.add_listener(job_executed_listener, EVENT_JOB_EXECUTED)
        self.scheduler.add_listener(job_error_listener, EVENT_JOB_ERROR)

        # Запускаємо планувальник
        self.scheduler.start()
        self.logger.info(f"Планувальник запущено. Наступний цикл через {self.config.SCRAPING_INTERVAL_HOURS} годину")

        # Запускаємо перший цикл негайно (для тестування)
        # self.run_full_scraping_cycle()

    def stop_scheduler(self):
        """Зупиняє планувальник"""
        self.logger.info("Зупиняю планувальник...")
        self.scheduler.shutdown()
        self.logger.info("Планувальник зупинено")

    def run_once(self):
        """Запускає один цикл парсингу (для тестування)"""
        self.run_full_scraping_cycle()


def main():
    """Головна функція"""
    manager = AutoScrapingManager()

    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        # Запуск одного циклу (для тестування)
        manager.run_once()
    else:
        # Запуск планувальника
        try:
            manager.start_scheduler()

            # Безкінечний цикл для підтримки роботи планувальника
            while True:
                time.sleep(60)  # Перевіряємо кожну хвилину

                # Логуємо статус кожну годину
                if int(time.time()) % 3600 < 60:
                    status = manager.get_status_report()
                    manager.logger.info(f"Статус системи: {status}")

        except KeyboardInterrupt:
            manager.logger.info("Отримано сигнал завершення")
        finally:
            manager.stop_scheduler()


if __name__ == "__main__":
    main()
