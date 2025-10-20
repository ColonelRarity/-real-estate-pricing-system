# Автоматична система парсингу нерухомості

## Огляд

Автоматична система парсингу призначена для регулярного збору даних про нерухомість з різних джерел (OLX, Dom.ria, Realt, Address) та автоматичного оновлення бази даних кожну годину.

## Архітектура

- **`auto_scraper.py`** - Основний модуль з планувальником завдань (APScheduler)
- **`config.py`** - Конфігурація системи (міста, джерела, налаштування)
- **`start_auto_scraper.py`** - Скрипт запуску з перевірками та ініціалізацією

## Джерела даних

Система парсить оголошення з наступних сайтів:

1. **OLX.ua** (`olx_scraper.py`)
   - Найбільша база оголошень в Україні
   - Детальні фільтри по районах та параметрах
   - Регулярні оновлення

2. **Dom.ria.com** (`domria_scraper.py`)
   - Професійна платформа для ріелторів
   - Якісні фото та детальна інформація
   - Широкий вибір об'єктів

3. **Realt.ua** (`realt_scraper.py`)
   - Спеціалізована платформа нерухомості
   - Детальна інформація про об'єкти
   - Професійні оголошення

4. **Address.ua** (`address_scraper.py`)
   - Агрегатор оголошень нерухомості
   - Об'єднує дані з різних джерел
   - Зручний інтерфейс

## Функціонал

### Автоматичне планування
- Запуск кожну годину (configurable)
- Асинхронна обробка для продуктивності
- Відновлення після збоїв

### Анти-блокувальні заходи
- Ротація User-Agent'ів
- Випадкові паузи між запитами
- Обробка помилок та повторні спроби

### Моніторинг та логування
- Детальні логи з ротацією
- Статистика успішності парсингу
- Сповіщення в Telegram (опціонально)

### Управління даними
- Дедуплікація оголошень
- Очищення застарілих даних
- Автоматичне обчислення похідних полів

## Встановлення та запуск

### 1. Встановлення залежностей

```bash
cd data-collection
pip install -r requirements.txt
```

### 2. Налаштування бази даних

```bash
# Ініціалізація SQLite (за замовчуванням)
python -c "from database import DatabaseManager; db = DatabaseManager(); db.create_tables(); db.initialize_cities_and_districts()"

# Або для PostgreSQL (якщо налаштовано)
DATABASE_URL="postgresql://user:pass@localhost/real_estate" python -c "from database import DatabaseManager; db = DatabaseManager(); db.create_tables(); db.initialize_cities_and_districts()"
```

### 3. Запуск системи

#### Ручний запуск одного циклу (для тестування)
```bash
python auto_scraper.py --once
```

#### Автоматичний режим (рекомендовано)
```bash
python start_auto_scraper.py
```

#### Як фоновий процес
```bash
nohup python start_auto_scraper.py > auto_scraper.out 2>&1 &
```

## Конфігурація

Основні налаштування в `config.py`:

```python
# Міста для парсингу
CITIES = ['Харків', 'Київ', 'Одеса', 'Дніпро', 'Львів']

# Джерела даних
SOURCES = ['olx', 'dom_ria', 'realt', 'address']

# Інтервал між запусками (години)
SCRAPING_INTERVAL_HOURS = 1

# Кількість сторінок для парсингу
MAX_PAGES_PER_CITY = 3
```

### Змінні оточення

```bash
# База даних (опціонально, за замовчуванням SQLite)
DATABASE_URL="postgresql://user:pass@localhost/real_estate"

# Telegram сповіщення (опціонально)
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
```

## Моніторинг

### Логи
- `auto_scraping.log` - основні логи парсингу
- `auto_scraper_startup.log` - логи запуску системи

### Статистика
Система автоматично веде статистику:
- Кількість успішних/невдалих циклів
- Загальна кількість зібраних оголошень
- Час останнього запуску
- Останні помилки

### Сповіщення в Telegram
При кожному успішному циклі надсилається звіт:
```
🤖 Автоматичний парсинг завершено

📊 Результати:
• Зібрано оголошень: 150
• Час виконання: 45.2с
• Цикл: #25
• Загалом за всі цикли: 3750

⏰ Наступний цикл через 1 годину
```

## Управління процесом

### Перевірка статусу
```bash
# Перевірити чи запущено
ps aux | grep auto_scraper

# Переглянути логи
tail -f auto_scraping.log
```

### Зупинка процесу
```bash
# Знайти PID
ps aux | grep auto_scraper

# Зупинити
kill PID_NUMBER

# Або за назвою
pkill -f auto_scraper.py
```

### Примусовий перезапуск
```bash
python start_auto_scraper.py --force
```

## Налаштування для продакшену

### Systemd service (Linux)
Створіть файл `/etc/systemd/system/real-estate-scraper.service`:

```ini
[Unit]
Description=Real Estate Auto Scraper
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/real-estate-app/data-collection
ExecStart=/usr/bin/python3 start_auto_scraper.py
Restart=always
RestartSec=10

# Environment variables
Environment=DATABASE_URL=postgresql://...
Environment=TELEGRAM_BOT_TOKEN=...
Environment=TELEGRAM_CHAT_ID=...

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable real-estate-scraper
sudo systemctl start real-estate-scraper
sudo systemctl status real-estate-scraper
```

### Docker контейнер
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY data-collection/requirements.txt .
RUN pip install -r requirements.txt

COPY real-estate-app/data-collection/ .
RUN python -c "from database import DatabaseManager; db = DatabaseManager(); db.create_tables(); db.initialize_cities_and_districts()"

CMD ["python", "start_auto_scraper.py"]
```

## Безпека та оптимізація

### Анти-блокувальні заходи
- Ротація User-Agent'ів кожні 10-20 запитів
- Випадкові паузи 1-3 секунди між запитами
- Обмеження швидкості парсингу

### Обробка помилок
- Автоматичне повторення невдалих запитів
- Логування всіх помилок з деталями
- Продовження роботи при помилках окремих джерел

### Продуктивність
- Асинхронні запити для кращої продуктивності
- Кешування результатів геокодування
- Оптимізація запитів до бази даних

## Пошук та усунення несправностей

### Поширені проблеми

1. **Процес не запускається**
   - Перевірити логи: `tail -f auto_scraper_startup.log`
   - Переконатися що встановлені всі залежності
   - Перевірити права доступу до файлів

2. **Немає нових оголошень**
   - Перевірити чи доступні сайти-джерела
   - Перевірити налаштування міст та джерел
   - Подивитися логи парсингу

3. **Telegram сповіщення не надходять**
   - Перевірити токен бота та chat_id
   - Переконатися що бот має права на надсилання повідомлень

4. **Високе завантаження CPU**
   - Зменшити MAX_PAGES_PER_CITY
   - Збільшити REQUEST_DELAY
   - Перевірити чи не зависають запити

### Діагностика
```bash
# Детальні логи
tail -f auto_scraping.log | grep -E "(ERROR|WARNING)"

# Статистика бази даних
python -c "from database import DatabaseManager; db = DatabaseManager(); print(db.get_stats_summary())"

# Тест одного джерела
python -c "from scrapers.olx_scraper import OLXScraper; scraper = OLXScraper(); print(scraper.scrape_city_listings('Харків', 1))"
```

## Масштабування

### Додавання нових міст
1. Додати місто до `CITIES` в `config.py`
2. Переконатися що скрапери підтримують код міста
3. Додати геодані для нового міста

### Додавання нових джерел
1. Створити новий скрапер за зразком існуючих
2. Додати до `SOURCES` в `config.py`
3. Додати конфігурацію в `get_source_config()`

### Розподілений парсинг
Для великого навантаження можна розподілити парсинг:
- Окремі процеси для кожного джерела
- Розподіл міст між серверами
- Черга завдань (Redis/RabbitMQ)

## Підтримка

При виникненні проблем:
1. Перевірити логи
2. Виконати тестовий запуск з `--once`
3. Перевірити доступність сайтів-джерел
4. Звернутися до документації скраперів

---

*Автоматична система парсингу забезпечує стабільний потік актуальних даних про ринок нерухомості України.*
