-- SQL запит для створення таблиць в SQLite (універсальний варіант)
-- Цей файл працює з SQLite та іншими базами даних

-- 1. Таблиця міст
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    average_price_per_sqm REAL,
    population INTEGER,
    is_regional_center BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблиця районів
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'district',
    latitude REAL,
    longitude REAL,
    average_price_per_sqm REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Основна таблиця оголошень нерухомості
CREATE TABLE IF NOT EXISTS property_listings (
    -- Первинний ключ та ідентифікатори
    id TEXT PRIMARY KEY,
    external_id TEXT UNIQUE,
    source TEXT NOT NULL,

    -- Основна інформація
    title TEXT NOT NULL,
    description TEXT,

    -- Локація (зовнішні ключі)
    city_id TEXT NOT NULL REFERENCES cities(id),
    district_id TEXT REFERENCES districts(id),

    -- Адреса та координати
    address TEXT,
    full_address TEXT,
    latitude REAL,
    longitude REAL,

    -- Ціни та площа
    price_uah INTEGER NOT NULL,
    price_usd INTEGER,
    area_total REAL NOT NULL,
    area_living REAL,
    area_kitchen REAL,

    -- Параметри квартири
    rooms INTEGER NOT NULL,
    floor INTEGER,
    total_floors INTEGER,

    -- Характеристики будинку
    building_type TEXT,
    building_series TEXT,
    developer TEXT,
    year_built INTEGER,

    -- Стан та зручності
    condition TEXT,
    has_balcony BOOLEAN DEFAULT 0,
    has_elevator BOOLEAN DEFAULT 0,
    heating TEXT,

    -- Додаткові фактори для KNN оцінки
    floor_category TEXT, -- 'low', 'middle', 'high'
    distance_to_center REAL, -- відстань до центру в км
    price_per_sqm REAL, -- ціна за м² (автообчислення)
    days_on_market INTEGER DEFAULT 0, -- днів на ринку

    -- Контактна інформація
    contact_phone TEXT,
    contact_name TEXT,

    -- Додаткова інформація
    images TEXT, -- JSON масив URL зображень
    url TEXT NOT NULL,

    -- Метадані
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Створюємо індекси для SQLite

-- Індекс для швидкого пошуку за ціною та площею
CREATE INDEX IF NOT EXISTS idx_listings_price_area ON property_listings(price_uah, area_total);

-- Індекс для пошуку по локації
CREATE INDEX IF NOT EXISTS idx_listings_location ON property_listings(city_id, district_id);

-- Індекс для пошуку по кімнатах та поверху
CREATE INDEX IF NOT EXISTS idx_listings_rooms_floor ON property_listings(rooms, floor);

-- Географічний індекс для пошуку по координатах
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON property_listings(latitude, longitude);

-- Індекс для пошуку по типу будинку та року побудови
CREATE INDEX IF NOT EXISTS idx_listings_building ON property_listings(building_type, year_built);

-- Індекс для пошуку по забудовнику
CREATE INDEX IF NOT EXISTS idx_listings_developer ON property_listings(developer);

-- Індекс для пошуку по стану квартири
CREATE INDEX IF NOT EXISTS idx_listings_condition ON property_listings(condition);

-- Індекс для швидкого розрахунку статистики цін
CREATE INDEX IF NOT EXISTS idx_listings_price_per_sqm ON property_listings(price_per_sqm);

-- Індекс для активних оголошень
CREATE INDEX IF NOT EXISTS idx_listings_active_created ON property_listings(is_active, created_at);

-- Індекс для пошуку по джерелу
CREATE INDEX IF NOT EXISTS idx_listings_source ON property_listings(source);

-- Складений індекс для KNN алгоритму (основні фактори схожості)
CREATE INDEX IF NOT EXISTS idx_knn_similarity ON property_listings(
    city_id, district_id, building_type, rooms, area_total, year_built, condition
);

-- Індекси для таблиць cities та districts
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_coordinates ON cities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_districts_city_name ON districts(city_id, name);
CREATE INDEX IF NOT EXISTS idx_districts_coordinates ON districts(latitude, longitude);

-- 5. Вставка базових даних для тестування

-- Додаємо місто Харків
INSERT OR IGNORE INTO cities (id, name, region, latitude, longitude, average_price_per_sqm, population, is_regional_center) VALUES
('city_kharkiv', 'Харків', 'Харківська', 49.9935, 36.2304, 1200, 1430886, 1);

-- Додаємо райони Харкова
INSERT OR IGNORE INTO districts (id, city_id, name, type, latitude, longitude, average_price_per_sqm, description) VALUES
('dist_center', 'city_kharkiv', 'Центр', 'microdistrict', 49.9935, 36.2304, 1400, 'Історичний центр з архітектурними пам''ятками'),
('dist_saltivka', 'city_kharkiv', 'Салтівка', 'microdistrict', 50.0300, 36.2950, 850, 'Найбільший житловий масив з панельною забудовою'),
('dist_oleksiivka', 'city_kharkiv', 'Олексіївка', 'microdistrict', 50.0450, 36.2850, 1300, 'Престижний район з новобудовами та котеджами');

-- 6. Приклад вставки тестового оголошення
INSERT OR IGNORE INTO property_listings (
    id, external_id, source, title, city_id, district_id,
    price_uah, area_total, rooms, building_type, year_built,
    condition, latitude, longitude, building_series, developer,
    floor_category, distance_to_center, price_per_sqm, url
) VALUES (
    'prop_demo_1', 'demo_001', 'demo',
    'Квартира 65м², 2 кімнати, центр Харкова',
    'city_kharkiv', 'dist_center',
    125000, 65.0, 2, 'brick', 2015,
    'good', 49.9935, 36.2304, 'ТС-3', 'ТММ',
    'middle', 2.5, 1923.08,
    'https://demo.example.com/property/1'
);

-- 7. Перевірка створених таблиць
SELECT 'cities' as table_name, COUNT(*) as records FROM cities
UNION ALL
SELECT 'districts' as table_name, COUNT(*) as records FROM districts
UNION ALL
SELECT 'property_listings' as table_name, COUNT(*) as records FROM property_listings;

-- 8. Показуємо статистику цін
SELECT
    c.name as city,
    d.name as district,
    COUNT(*) as listings_count,
    AVG(pl.price_uah) as avg_price,
    AVG(pl.price_per_sqm) as avg_price_per_sqm,
    MIN(pl.price_uah) as min_price,
    MAX(pl.price_uah) as max_price
FROM property_listings pl
JOIN cities c ON pl.city_id = c.id
LEFT JOIN districts d ON pl.district_id = d.id
WHERE pl.is_active = 1 AND pl.price_uah > 0
GROUP BY c.name, d.name
ORDER BY avg_price DESC;

-- 9. Приклад KNN запиту для SQLite (простіша версія без геодезичних функцій)
SELECT
    pl.id,
    pl.price_uah,
    pl.area_total,
    pl.rooms,
    pl.building_type,
    pl.year_built,
    pl.condition,
    c.name as city,
    d.name as district,
    -- Розрахунок простої евклідової відстані (якщо є координати)
    CASE
        WHEN pl.latitude IS NOT NULL AND pl.longitude IS NOT NULL
        THEN SQRT(
            ((pl.latitude - 49.9935) * (pl.latitude - 49.9935)) +
            ((pl.longitude - 36.2304) * (pl.longitude - 36.2304))
        ) * 111 -- приблизно км
        ELSE NULL
    END as distance_km,
    -- Оцінка схожості (спрощена для SQLite)
    (
        (1 - ABS(pl.area_total - 65.0) / 100) * 0.3 +  -- схожість по площі
        CASE WHEN pl.rooms = 2 THEN 1.0 ELSE 0.0 END * 0.2 +  -- точна кількість кімнат
        CASE WHEN pl.building_type = 'brick' THEN 1.0 ELSE 0.0 END * 0.2 +  -- тип будинку
        (1 - ABS(COALESCE(pl.year_built, 2015) - 2015) / 50.0) * 0.2 +  -- схожість по року
        CASE WHEN pl.condition = 'good' THEN 1.0 ELSE 0.0 END * 0.1  -- стан
    ) as similarity_score
FROM property_listings pl
JOIN cities c ON pl.city_id = c.id
LEFT JOIN districts d ON pl.district_id = d.id
WHERE pl.is_active = 1
    AND pl.price_uah > 0
    AND pl.id != 'prop_demo_1'  -- виключаємо сам об'єкт
ORDER BY similarity_score DESC, distance_km ASC
LIMIT 10;

-- 10. Допоміжні функції для SQLite (якщо потрібно)

-- Функція для розрахунку геодезичної відстані (якщо ваша SQLite скомпільована з math функціями)
-- SELECT load_extension('./libsqlitefunctions.so'); -- для Linux/Mac
-- Або використовуйте Python для складних розрахунків
