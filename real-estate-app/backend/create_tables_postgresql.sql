-- SQL запит для створення таблиць в PostgreSQL для системи оцінки нерухомості
-- Сумісний з PostgreSQL 12+

-- 1. Таблиця міст
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    average_price_per_sqm NUMERIC(10, 2),
    population INTEGER,
    is_regional_center BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблиця районів
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(255) PRIMARY KEY,
    city_id VARCHAR(255) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'district',
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    average_price_per_sqm NUMERIC(10, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Основна таблиця оголошень нерухомості
CREATE TABLE IF NOT EXISTS property_listings (
    -- Первинний ключ та ідентифікатори
    id VARCHAR(255) PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,
    source VARCHAR(50) NOT NULL,

    -- Основна інформація
    title TEXT NOT NULL,
    description TEXT,

    -- Локація (зовнішні ключі)
    city_id VARCHAR(255) NOT NULL REFERENCES cities(id),
    district_id VARCHAR(255) REFERENCES districts(id),

    -- Адреса та координати
    address VARCHAR(255),
    full_address VARCHAR(500),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- Ціни та площа
    price_uah INTEGER NOT NULL,
    price_usd INTEGER,
    area_total NUMERIC(8, 2) NOT NULL,
    area_living NUMERIC(8, 2),
    area_kitchen NUMERIC(8, 2),

    -- Параметри квартири
    rooms INTEGER NOT NULL,
    floor INTEGER,
    total_floors INTEGER,

    -- Характеристики будинку
    building_type VARCHAR(50),
    building_series VARCHAR(100),
    developer VARCHAR(200),
    year_built INTEGER,

    -- Стан та зручності
    condition VARCHAR(50),
    has_balcony BOOLEAN DEFAULT FALSE,
    has_elevator BOOLEAN DEFAULT FALSE,
    heating VARCHAR(50),

    -- Додаткові фактори для KNN оцінки
    floor_category VARCHAR(20), -- 'low', 'middle', 'high'
    distance_to_center NUMERIC(8, 3), -- відстань до центру в км
    price_per_sqm NUMERIC(10, 2), -- ціна за м² (автообчислення)
    days_on_market INTEGER DEFAULT 0, -- днів на ринку

    -- Контактна інформація
    contact_phone VARCHAR(20),
    contact_name VARCHAR(100),

    -- Додаткова інформація
    images TEXT, -- JSON масив URL зображень
    url VARCHAR(500) NOT NULL,

    -- Метадані
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблиця статистики ринку (опціонально)
CREATE TABLE IF NOT EXISTS market_stats (
    id SERIAL PRIMARY KEY,
    city_id VARCHAR(255) NOT NULL REFERENCES cities(id),
    district_id VARCHAR(255) REFERENCES districts(id),
    date DATE NOT NULL,

    -- Статистика
    total_listings INTEGER DEFAULT 0,
    average_price_per_sqm NUMERIC(10, 2),
    median_price_per_sqm NUMERIC(10, 2),
    price_change_percent NUMERIC(5, 2),
    average_area NUMERIC(8, 2),
    demand_level VARCHAR(20),

    -- Деталі по кімнатах
    avg_price_1_room NUMERIC(10, 2),
    avg_price_2_room NUMERIC(10, 2),
    avg_price_3_room NUMERIC(10, 2),
    avg_price_4_plus_room NUMERIC(10, 2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Створюємо індекси для PostgreSQL

-- Індекси для таблиці міст
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_coordinates ON cities(latitude, longitude);

-- Індекси для таблиці районів
CREATE INDEX IF NOT EXISTS idx_districts_city_name ON districts(city_id, name);
CREATE INDEX IF NOT EXISTS idx_districts_coordinates ON districts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_districts_city_type ON districts(city_id, type);

-- Індекси для основної таблиці property_listings
CREATE INDEX IF NOT EXISTS idx_listings_price_area ON property_listings(price_uah, area_total);
CREATE INDEX IF NOT EXISTS idx_listings_location ON property_listings(city_id, district_id);
CREATE INDEX IF NOT EXISTS idx_listings_rooms_floor ON property_listings(rooms, floor);
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON property_listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_building ON property_listings(building_type, year_built);
CREATE INDEX IF NOT EXISTS idx_listings_developer ON property_listings(developer);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON property_listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_price_per_sqm ON property_listings(price_per_sqm);
CREATE INDEX IF NOT EXISTS idx_listings_active_created ON property_listings(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_listings_source ON property_listings(source);

-- Складений індекс для KNN алгоритму (основні фактори схожості)
CREATE INDEX IF NOT EXISTS idx_knn_similarity ON property_listings(
    city_id, district_id, building_type, rooms, area_total, year_built, condition
);

-- Індекси для таблиці статистики
CREATE INDEX IF NOT EXISTS idx_stats_city_date ON market_stats(city_id, date);
CREATE INDEX IF NOT EXISTS idx_stats_district_date ON market_stats(district_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS unique_stats_date ON market_stats(city_id, district_id, date);

-- 6. Функція для автоматичного оновлення updated_at (PostgreSQL специфічна)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер для автоматичного оновлення updated_at в таблиці міст
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Тригер для автоматичного оновлення updated_at в основній таблиці
CREATE TRIGGER update_property_listings_updated_at BEFORE UPDATE ON property_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Вставка базових даних для Харкова

-- Додаємо місто Харків
INSERT INTO cities (id, name, region, latitude, longitude, average_price_per_sqm, population, is_regional_center) VALUES
('city_kharkiv', 'Харків', 'Харківська', 49.9935, 36.2304, 1200, 1430886, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Додаємо райони Харкова
INSERT INTO districts (id, city_id, name, type, latitude, longitude, average_price_per_sqm, description) VALUES
('dist_center', 'city_kharkiv', 'Центр', 'microdistrict', 49.9935, 36.2304, 1400, 'Історичний центр з архітектурними пам''ятками'),
('dist_saltivka', 'city_kharkiv', 'Салтівка', 'microdistrict', 50.0300, 36.2950, 850, 'Найбільший житловий масив з панельною забудовою'),
('dist_oleksiivka', 'city_kharkiv', 'Олексіївка', 'microdistrict', 50.0450, 36.2850, 1300, 'Престижний район з новобудовами та котеджами'),
('dist_shevchenkivskyi', 'city_kharkiv', 'Шевченківський', 'district', 50.0050, 36.2250, 1250, 'Престижний район з парками та університетами'),
('dist_kyivskyi', 'city_kharkiv', 'Київський', 'district', 50.0250, 36.3400, 1300, 'Район з новобудовами та хорошою інфраструктурою'),
('dist_saltivskyi', 'city_kharkiv', 'Салтівський', 'district', 50.0350, 36.3000, 900, 'Найбільший житловий масив Харкова'),
('dist_osnovyanskyi', 'city_kharkiv', 'Основ''янський', 'district', 49.9845, 36.2428, 1150, 'Центральний район з історичною забудовою'),
('dist_novobavarskyi', 'city_kharkiv', 'Новобаварський', 'district', 49.9550, 36.2000, 850, 'Район з приватним сектором та промисловими зонами')
ON CONFLICT (id) DO NOTHING;

-- 8. Приклад вставки тестового оголошення
INSERT INTO property_listings (
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
) ON CONFLICT (id) DO NOTHING;

-- 9. Перевірка створених таблиць (сумісний з різними версіями PostgreSQL)
SELECT
    n.nspname as schemaname,
    c.relname as tablename,
    a.attname as column_name,
    format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as not_null,
    CASE
        WHEN a.attnum > 0 THEN 'column'
        ELSE 'system_column'
    END as column_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('cities', 'districts', 'property_listings', 'market_stats')
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

-- 10. Статистика по таблицях (сумісний з різними версіями PostgreSQL)
SELECT
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE relname IN ('cities', 'districts', 'property_listings', 'market_stats')
ORDER BY relname;

-- 11. Перевірка індексів (сумісний з різними версіями PostgreSQL)
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('cities', 'districts', 'property_listings', 'market_stats')
ORDER BY tablename, indexname;

-- 12. Приклад KNN запиту для PostgreSQL з простою евклідовою відстанню
-- ВАРІАНТ 1: Простий варіант (працює без PostGIS)
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
    -- Розрахунок простої евклідової відстані в км (якщо є координати)
    CASE
        WHEN pl.latitude IS NOT NULL AND pl.longitude IS NOT NULL
        THEN SQRT(
            ((pl.latitude - 49.9935) * (pl.latitude - 49.9935)) +
            ((pl.longitude - 36.2304) * (pl.longitude - 36.2304))
        ) * 111 -- приблизний коефіцієнт для км
        ELSE NULL
    END as distance_km,
    -- Оцінка схожості (спрощена для демонстрації)
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
WHERE pl.is_active = TRUE
    AND pl.price_uah > 0
    AND pl.id != 'prop_demo_1'  -- виключаємо сам об'єкт
ORDER BY similarity_score DESC, distance_km ASC
LIMIT 10;


-- 13. Статистика цін по районах (PostgreSQL варіант)
SELECT
    c.name as city,
    d.name as district,
    COUNT(*) as listings_count,
    ROUND(AVG(pl.price_uah), 0) as avg_price,
    ROUND(AVG(pl.price_per_sqm), 2) as avg_price_per_sqm,
    MIN(pl.price_uah) as min_price,
    MAX(pl.price_uah) as max_price,
    ROUND(STDDEV(pl.price_uah), 0) as price_std_dev
FROM property_listings pl
JOIN cities c ON pl.city_id = c.id
LEFT JOIN districts d ON pl.district_id = d.id
WHERE pl.is_active = TRUE AND pl.price_uah > 0
GROUP BY c.name, d.name
ORDER BY avg_price DESC;

-- 14. Включення розширення для геодезичних функцій (ОПЦІОНАЛЬНО)
-- Якщо ви хочете використовувати точні геодезичні функції, встановіть PostGIS:
-- CREATE EXTENSION IF NOT EXISTS postgis;
--
-- АБО для простих геодезичних функцій (входить в базову установку PostgreSQL):
-- CREATE EXTENSION IF NOT EXISTS earthdistance;
--
-- ПРИМІТКА: Запити в цьому файлі використовують просту евклідову відстань,
-- яка працює без додаткових розширень і достатня для більшості випадків.

-- 15. Показуємо розмір таблиць в байтах (сумісний з різними версіями PostgreSQL)
SELECT
    schemaname,
    tablename,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('cities', 'districts', 'property_listings', 'market_stats')
ORDER BY size_bytes DESC;
