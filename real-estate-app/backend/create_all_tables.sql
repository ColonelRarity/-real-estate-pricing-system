-- Повний SQL запит для створення всіх таблиць бази даних для системи оцінки нерухомості

-- 1. Таблиця міст
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    average_price_per_sqm DECIMAL(10, 2),
    population INTEGER,
    is_regional_center BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_cities_name (name),
    INDEX idx_cities_coordinates (latitude, longitude)
);

-- 2. Таблиця районів
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(255) PRIMARY KEY,
    city_id VARCHAR(255) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'district', -- 'district', 'microdistrict', 'neighborhood'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    average_price_per_sqm DECIMAL(10, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_districts_city_name (city_id, name),
    INDEX idx_districts_coordinates (latitude, longitude),
    INDEX idx_districts_city_type (city_id, type)
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
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Ціни та площа
    price_uah INTEGER NOT NULL,
    price_usd INTEGER,
    area_total DECIMAL(8, 2) NOT NULL,
    area_living DECIMAL(8, 2),
    area_kitchen DECIMAL(8, 2),

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
    distance_to_center DECIMAL(8, 3), -- відстань до центру в км
    price_per_sqm DECIMAL(10, 2), -- ціна за м² (автообчислення)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Створюємо індекси для оптимізації запитів

-- Індекси для property_listings
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

-- Складений індекс для KNN алгоритму
CREATE INDEX IF NOT EXISTS idx_knn_similarity ON property_listings(
    city_id, district_id, building_type, rooms, area_total, year_built, condition
);

-- 5. Таблиця статистики ринку (опціонально)
CREATE TABLE IF NOT EXISTS market_stats (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    city_id VARCHAR(255) NOT NULL REFERENCES cities(id),
    district_id VARCHAR(255) REFERENCES districts(id),
    date DATE NOT NULL,

    -- Статистика
    total_listings INTEGER DEFAULT 0,
    average_price_per_sqm DECIMAL(10, 2),
    median_price_per_sqm DECIMAL(10, 2),
    price_change_percent DECIMAL(5, 2),
    average_area DECIMAL(8, 2),
    demand_level VARCHAR(20), -- 'high', 'medium', 'low'

    -- Деталі по кімнатах
    avg_price_1_room DECIMAL(10, 2),
    avg_price_2_room DECIMAL(10, 2),
    avg_price_3_room DECIMAL(10, 2),
    avg_price_4_plus_room DECIMAL(10, 2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_stats_city_date (city_id, date),
    INDEX idx_stats_district_date (district_id, date),
    UNIQUE KEY unique_stats_date (city_id, district_id, date)
);

-- 6. Вставка базових даних для Харкова

-- Додаємо місто Харків
INSERT IGNORE INTO cities (id, name, region, latitude, longitude, average_price_per_sqm, population, is_regional_center) VALUES
('city_kharkiv', 'Харків', 'Харківська', 49.9935, 36.2304, 1200, 1430886, TRUE);

-- Додаємо райони Харкова
INSERT IGNORE INTO districts (id, city_id, name, type, latitude, longitude, average_price_per_sqm, description) VALUES
('dist_center', 'city_kharkiv', 'Центр', 'microdistrict', 49.9935, 36.2304, 1400, 'Історичний центр з архітектурними пам\'ятками'),
('dist_saltivka', 'city_kharkiv', 'Салтівка', 'microdistrict', 50.0300, 36.2950, 850, 'Найбільший житловий масив з панельною забудовою'),
('dist_oleksiivka', 'city_kharkiv', 'Олексіївка', 'microdistrict', 50.0450, 36.2850, 1300, 'Престижний район з новобудовами та котеджами'),
('dist_shevchenkivskyi', 'city_kharkiv', 'Шевченківський', 'district', 50.0050, 36.2250, 1250, 'Престижний район з парками та університетами'),
('dist_kyivskyi', 'city_kharkiv', 'Київський', 'district', 50.0250, 36.3400, 1300, 'Район з новобудовами та хорошою інфраструктурою'),
('dist_saltivskyi', 'city_kharkiv', 'Салтівський', 'district', 50.0350, 36.3000, 900, 'Найбільший житловий масив Харкова'),
('dist_osnovyanskyi', 'city_kharkiv', 'Основ\'янський', 'district', 49.9845, 36.2428, 1150, 'Центральний район з історичною забудовою'),
('dist_novobavarskyi', 'city_kharkiv', 'Новобаварський', 'district', 49.9550, 36.2000, 850, 'Район з приватним сектором та промисловими зонами');

-- 7. Приклад вставки тестового оголошення
INSERT IGNORE INTO property_listings (
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

-- 8. Перевірка створених таблиць
SELECT 'cities' as table_name, COUNT(*) as records FROM cities
UNION ALL
SELECT 'districts' as table_name, COUNT(*) as records FROM districts
UNION ALL
SELECT 'property_listings' as table_name, COUNT(*) as records FROM property_listings;

-- 9. Показуємо статистику цін
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
WHERE pl.is_active = TRUE AND pl.price_uah > 0
GROUP BY c.name, d.name
ORDER BY avg_price DESC;

-- 10. Приклад KNN запиту для пошуку схожих об'єктів
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
    -- Розрахунок геодезичної відстані до цільового об'єкта
    ST_Distance_Sphere(
        POINT(pl.longitude, pl.latitude),
        POINT(36.2304, 49.9935) -- координати центру Харкова
    ) / 1000 as distance_km,
    -- Оцінка схожості (спрощена)
    (
        (1 - ABS(pl.area_total - 65.0) / 100) * 0.3 +  -- схожість по площі
        (CASE WHEN pl.rooms = 2 THEN 1.0 ELSE 0.0 END) * 0.2 +  -- точна кількість кімнат
        (CASE WHEN pl.building_type = 'brick' THEN 1.0 ELSE 0.0 END) * 0.2 +  -- тип будинку
        (1 - ABS(pl.year_built - 2015) / 50) * 0.2 +  -- схожість по року
        (CASE WHEN pl.condition = 'good' THEN 1.0 ELSE 0.0 END) * 0.1  -- стан
    ) as similarity_score
FROM property_listings pl
JOIN cities c ON pl.city_id = c.id
LEFT JOIN districts d ON pl.district_id = d.id
WHERE pl.is_active = TRUE
    AND pl.price_uah > 0
    AND pl.id != 'prop_demo_1'  -- виключаємо сам об'єкт
ORDER BY similarity_score DESC, distance_km ASC
LIMIT 10;
