# 🗄️ Налаштування бази даних для KNN оцінки нерухомості

## Огляд

Для роботи KNN алгоритму оцінки нерухомості потрібна база даних з детальною інформацією про оголошення. Нижче наведені SQL запити для створення необхідних таблиць.

## Файли SQL

### 📄 Варіанти для різних баз даних:

1. **`create_tables_postgresql.sql`** - **Для PostgreSQL (рекомендовано)**
2. **`create_all_tables.sql`** - Для MySQL/PostgreSQL (застарілий)
3. **`create_tables_sqlite.sql`** - Універсальний варіант для SQLite
4. **`create_property_listings_table.sql`** - Тільки таблиця оголошень

## Структура таблиць

### 🏙️ cities (міста)
```sql
- id: VARCHAR(255) PRIMARY KEY
- name: VARCHAR(100) NOT NULL
- region: VARCHAR(100) NOT NULL
- latitude, longitude: DECIMAL
- average_price_per_sqm: DECIMAL(10,2)
- population: INTEGER
- is_regional_center: BOOLEAN
```

### 🏘️ districts (райони)
```sql
- id: VARCHAR(255) PRIMARY KEY
- city_id: VARCHAR(255) FK → cities.id
- name: VARCHAR(100) NOT NULL
- type: VARCHAR(20) (district/microdistrict/neighborhood)
- latitude, longitude: DECIMAL
- average_price_per_sqm: DECIMAL(10,2)
- description: TEXT
```

### 🏠 property_listings (оголошення нерухомості)
```sql
-- Ідентифікатори
- id: VARCHAR(255) PRIMARY KEY
- external_id: VARCHAR(255) UNIQUE
- source: VARCHAR(50) NOT NULL

-- Локація
- city_id: VARCHAR(255) FK → cities.id
- district_id: VARCHAR(255) FK → districts.id
- address: VARCHAR(255)
- full_address: VARCHAR(500)
- latitude, longitude: DECIMAL

-- Ціни та площа
- price_uah: INTEGER NOT NULL
- price_usd: INTEGER
- area_total: DECIMAL(8,2) NOT NULL
- area_living: DECIMAL(8,2)
- area_kitchen: DECIMAL(8,2)

-- Параметри квартири
- rooms: INTEGER NOT NULL
- floor: INTEGER
- total_floors: INTEGER

-- Характеристики будинку
- building_type: VARCHAR(50)
- building_series: VARCHAR(100)
- developer: VARCHAR(200)
- year_built: INTEGER

-- Стан та зручності
- condition: VARCHAR(50)
- has_balcony: BOOLEAN
- has_elevator: BOOLEAN
- heating: VARCHAR(50)

-- KNN фактори
- floor_category: VARCHAR(20) (low/middle/high)
- distance_to_center: DECIMAL(8,3)
- price_per_sqm: DECIMAL(10,2) (автообчислення)
- days_on_market: INTEGER

-- Метадані
- images: TEXT (JSON)
- url: VARCHAR(500) NOT NULL
- is_active: BOOLEAN
- created_at, updated_at, last_seen_at: DATETIME
```

## Створення таблиць

### Спосіб 1: Через Python (рекомендовано)

```python
from database import DatabaseManager

db_manager = DatabaseManager()
db_manager.create_tables()
db_manager.initialize_cities_and_districts()
```

### Спосіб 2: Через SQL файли

#### Для PostgreSQL (рекомендовано):
```bash
psql -U username -d database_name -f backend/create_tables_postgresql.sql
```

**PostGIS не потрібен!**
- Файл використовує просту евклідову відстань
- Всі геодезичні функції працюють без додаткових розширень
- Точність достатня для оцінки нерухомості в межах міста

**Якщо у вас є PostGIS (опціонально):**
- Можна використовувати точні геодезичні функції (`ST_DistanceSphere`)
- Максимальна точність для географічних розрахунків
- Змініть запити в файлі на використання `ST_MakePoint` та `ST_DistanceSphere`

#### Тестування підключення:
```bash
pip install psycopg2-binary  # Якщо не встановлено
# Змініть параметри підключення в файлі test_postgresql_connection.py
python backend/test_postgresql_connection.py
```

**Налаштування параметрів підключення:**
Відредагуйте файл `backend/test_postgresql_connection.py` та змініть:
```python
connection_params = {
    'host': 'localhost',        # Ваш хост PostgreSQL
    'port': 5432,              # Порт (зазвичай 5432)
    'database': 'real_estate', # Назва вашої бази даних
    'user': 'postgres',        # Користувач PostgreSQL
    'password': 'your_password_here'  # Ваш пароль
}
```

#### Для MySQL:
```bash
mysql -u username -p database_name < backend/create_all_tables.sql
```

#### Для SQLite:
```bash
sqlite3 database.db < backend/create_tables_sqlite.sql
```

## Оптимізовані індекси

Система створює 10+ індексів для швидкого KNN пошуку:

- `idx_listings_price_area` - ціна + площа
- `idx_listings_location` - місто + район
- `idx_listings_coordinates` - геокоординати
- `idx_knn_similarity` - складений індекс для KNN
- Індекси по типу будинку, забудовнику, стану тощо

## Приклади використання

### ➕ Додавання оголошення

```sql
INSERT INTO property_listings (
    id, city_id, district_id, price_uah, area_total, rooms,
    building_type, year_built, condition, latitude, longitude
) VALUES (
    'prop_123', 'city_kharkiv', 'dist_center', 125000, 65.0, 2,
    'brick', 2015, 'good', 49.9935, 36.2304
);
```

### 🔍 KNN пошук схожих об'єктів

```sql
SELECT
    pl.id,
    pl.price_uah,
    pl.area_total,
    pl.rooms,
    ST_Distance_Sphere(
        POINT(pl.longitude, pl.latitude),
        POINT(36.2304, 49.9935)
    ) / 1000 as distance_km,
    -- Оцінка схожості
    (
        (1 - ABS(pl.area_total - 65.0) / 100) * 0.3 +
        CASE WHEN pl.rooms = 2 THEN 1.0 ELSE 0.0 END * 0.2 +
        CASE WHEN pl.building_type = 'brick' THEN 1.0 ELSE 0.0 END * 0.2
    ) as similarity_score
FROM property_listings pl
WHERE pl.is_active = TRUE
    AND pl.city_id = 'city_kharkiv'
ORDER BY similarity_score DESC, distance_km ASC
LIMIT 10;
```

### 📊 Статистика цін по районах

```sql
SELECT
    c.name as city,
    d.name as district,
    COUNT(*) as listings_count,
    AVG(pl.price_uah) as avg_price,
    AVG(pl.price_per_sqm) as avg_price_per_sqm
FROM property_listings pl
JOIN cities c ON pl.city_id = c.id
LEFT JOIN districts d ON pl.district_id = d.id
WHERE pl.is_active = TRUE AND pl.price_uah > 0
GROUP BY c.name, d.name
ORDER BY avg_price DESC;
```

## Автоматичне заповнення

### Центри міст (для розрахунку відстаней)

```python
# В коді вже є координати центрів міст
city_centers = {
    'харків': (49.9935, 36.2304),
    'київ': (50.4501, 30.5234),
    'львів': (49.8397, 24.0297),
    'одеса': (46.4825, 30.7233),
    'дніпро': (48.4647, 35.0462)
}
```

### Категорії поверхів

```python
def categorize_floor(floor, total_floors):
    if not floor or not total_floors:
        return None

    floor_ratio = floor / total_floors

    if floor_ratio <= 0.33:
        return 'low'
    elif floor_ratio <= 0.67:
        return 'middle'
    else:
        return 'high'
```

## PostgreSQL специфічні функції

### Геодезичні функції
Файл `create_tables_postgresql.sql` включає два варіанти геодезичних функцій:

**Варіант 1: З PostGIS (рекомендовано)**
- `ST_DistanceSphere()` - точна геодезична відстань між точками
- `ST_MakePoint()` - створення геометричних точок
- Висока точність для географічних розрахунків

**Варіант 2: Проста евклідова відстань (без додаткових розширень)**
- Використовує базові математичні функції PostgreSQL
- Працює з будь-якою установкою PostgreSQL
- Менша точність, але достатня для більшості випадків

### Автоматичне оновлення дат
- Тригери для автоматичного оновлення `updated_at` при зміні записів
- Забезпечує цілісність даних та аудит змін

### Моніторинг продуктивності (PostgreSQL):

```sql
-- Перевірка розміру таблиць
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN ('cities', 'districts', 'property_listings');

-- Перевірка використання індексів
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('cities', 'districts', 'property_listings');

-- Аналіз плану запиту
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... FROM property_listings WHERE ...;

-- Статистика по таблицях
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE relname IN ('cities', 'districts', 'property_listings');
```

## Масштабованість

### Для великих об'ємів даних:

1. **Партиціювання** по містах для кращої продуктивності
2. **Архівування** старих оголошень
3. **Кешування** популярних запитів
4. **Асинхронне** оновлення геокоординат

### PostgreSQL специфічні оптимізації:

- **PostGIS** для складних геопросторових запитів
- **pg_stat_statements** для аналізу продуктивності
- **Connection pooling** (PgBouncer)
- **Read replicas** для масштабування читання

## Інтеграція з Python

### Автоматичне створення таблиць:

```python
from database import DatabaseManager

db_manager = DatabaseManager()
db_manager.create_tables()  # Створює всі таблиці з індексами
db_manager.initialize_cities_and_districts()  # Додає базові дані
```

### Робота з моделями:

```python
from models import PropertyListing, City, District

# Створення нового оголошення
listing = PropertyListing(
    id='prop_123',
    city_id='city_kharkiv',
    price_uah=125000,
    area_total=65.0,
    rooms=2,
    building_type='brick',
    year_built=2015,
    condition='good'
)

# Автообчислення додаткових полів
listing.calculate_price_per_sqm()  # 1923.08
listing.categorize_floor()  # 'middle'
```

## Висновки

✅ **Структура готова** для високоточної KNN оцінки нерухомості
✅ **Оптимізовані індекси** для швидкого пошуку схожих об'єктів
✅ **Детальні характеристики** для точного визначення схожості
✅ **Масштабованість** для великих об'ємів даних

Тепер ваша база даних готова для революційної системи оцінки нерухомості! 🚀
