#!/usr/bin/env python3
"""
Скрипт для запуску автоматичної системи парсингу нерухомості
"""

import os
import sys
import subprocess
import time
import logging
from pathlib import Path

def setup_logging():
    """Налаштовує логування для скрипту запуску"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('auto_scraper_startup.log'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def check_dependencies():
    """Перевіряє чи встановлені всі необхідні залежності"""
    logger = logging.getLogger(__name__)
    logger.info("Перевіряю залежності...")

    required_packages = [
        'requests', 'beautifulsoup4', 'sqlalchemy', 'apscheduler', 'fake-useragent'
    ]

    missing_packages = []

    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"✓ {package}")
        except ImportError:
            logger.error(f"✗ {package} не встановлено")
            missing_packages.append(package)

    if missing_packages:
        logger.error(f"Відсутні пакети: {', '.join(missing_packages)}")
        logger.info("Встановлюю відсутні залежності...")
        install_dependencies()
    else:
        logger.info("Всі залежності встановлені ✓")

def install_dependencies():
    """Встановлює відсутні залежності"""
    logger = logging.getLogger(__name__)

    try:
        # Встановлюємо залежності з requirements.txt
        requirements_file = Path(__file__).parent / 'requirements.txt'
        if requirements_file.exists():
            logger.info("Встановлюю залежності з requirements.txt...")
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ])
            logger.info("Залежності успішно встановлені ✓")
        else:
            logger.error("Файл requirements.txt не знайдено")
            sys.exit(1)

    except subprocess.CalledProcessError as e:
        logger.error(f"Помилка при встановленні залежностей: {e}")
        sys.exit(1)

def initialize_database():
    """Ініціалізує базу даних"""
    logger = logging.getLogger(__name__)

    try:
        # Імпортуємо та запускаємо ініціалізацію бази даних
        from database import DatabaseManager

        logger.info("Ініціалізую базу даних...")
        db = DatabaseManager()
        db.create_tables()
        db.initialize_cities_and_districts()
        logger.info("База даних ініціалізована ✓")

    except Exception as e:
        logger.error(f"Помилка ініціалізації бази даних: {e}")
        logger.info("Продовжую без ініціалізації бази даних...")
        # Не виходимо з помилкою, просто логуємо попередження

def check_environment_variables():
    """Перевіряє змінні оточення"""
    logger = logging.getLogger(__name__)

    # Перевіряємо основні змінні
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.info("DATABASE_URL не встановлено, використовую SQLite за замовчуванням")
    else:
        logger.info(f"DATABASE_URL: {db_url[:50]}...")

    # Перевіряємо Telegram налаштування
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')

    if bot_token and chat_id:
        logger.info("Telegram сповіщення налаштовано ✓")
    else:
        logger.info("Telegram сповіщення не налаштовано (опціонально)")

def create_pid_file():
    """Створює PID файл для відстеження процесу"""
    pid = os.getpid()
    pid_file = Path(__file__).parent / 'auto_scraper.pid'

    with open(pid_file, 'w') as f:
        f.write(str(pid))

    return pid_file

def cleanup_pid_file(pid_file):
    """Видаляє PID файл при завершенні"""
    try:
        if pid_file.exists():
            pid_file.unlink()
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.warning(f"Не вдалося видалити PID файл: {e}")

def start_scraper():
    """Запускає автоматичну систему парсингу"""
    logger = logging.getLogger(__name__)

    logger.info("=" * 60)
    logger.info("🚀 ЗАПУСК АВТОМАТИЧНОЇ СИСТЕМИ ПАРСИНГУ НЕРУХОМОСТІ")
    logger.info("=" * 60)

    # Перевіряємо залежності
    check_dependencies()

    # Ініціалізуємо базу даних
    initialize_database()

    # Перевіряємо змінні оточення
    check_environment_variables()

    # Створюємо PID файл
    pid_file = create_pid_file()

    try:
        logger.info("Запускаю основний процес парсингу...")

        # Запускаємо основний процес
        from auto_scraper import main

        # Обробляємо сигнали для корректного завершення
        import signal
        import atexit

        def signal_handler(signum, frame):
            logger.info(f"Отримано сигнал {signum}, завершую роботу...")
            cleanup_pid_file(pid_file)
            sys.exit(0)

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        atexit.register(lambda: cleanup_pid_file(pid_file))

        # Запускаємо основну функцію
        main()

    except KeyboardInterrupt:
        logger.info("Отримано сигнал завершення від користувача")
    except Exception as e:
        logger.error(f"Критична помилка: {e}")
        raise
    finally:
        cleanup_pid_file(pid_file)
        logger.info("Процес завершено")

def check_running_process():
    """Перевіряє чи вже запущено процес парсингу"""
    logger = logging.getLogger(__name__)

    pid_file = Path(__file__).parent / 'auto_scraper.pid'

    if pid_file.exists():
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())

            # Перевіряємо чи процес ще запущено
            import psutil
            if psutil.pid_exists(pid):
                process = psutil.Process(pid)
                if 'python' in process.name().lower():
                    logger.warning(f"Процес вже запущено (PID: {pid})")
                    return True
                else:
                    logger.info(f"PID файл містить не Python процес, видаляю")
                    pid_file.unlink()
            else:
                logger.info(f"Процес з PID {pid} не знайдено, видаляю PID файл")
                pid_file.unlink()

        except Exception as e:
            logger.warning(f"Помилка при перевірці PID файлу: {e}")
            pid_file.unlink()

    return False

def main():
    """Головна функція скрипту"""
    logger = setup_logging()

    # Перевіряємо чи вже запущено
    if check_running_process():
        logger.error("Процес автоматичного парсингу вже запущено!")
        logger.info("Використовуйте --force для примусового запуску")
        if len(sys.argv) > 1 and sys.argv[1] == '--force':
            logger.info("Примусово запускаю новий процес...")
        else:
            sys.exit(1)

    # Запускаємо систему
    start_scraper()

if __name__ == "__main__":
    main()
