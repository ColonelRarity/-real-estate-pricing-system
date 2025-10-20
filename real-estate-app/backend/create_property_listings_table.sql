-- SQL запит для створення таблиці property_listings з усіма колонками для KNN оцінки нерухомості

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

-- Створюємо індекси для оптимізації запитів

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

-- Складений індекс для KNN алгоритму (основні фактори схожості)
CREATE INDEX IF NOT EXISTS idx_knn_similarity ON property_listings(
    city_id, district_id, building_type, rooms, area_total, year_built, condition
);

-- Індекс для пошуку по джерелу
CREATE INDEX IF NOT EXISTS idx_listings_source ON property_listings(source);

-- Індекс для пошуку дублікатів по external_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_external_id ON property_listings(external_id);

-- Показуємо структуру створеної таблиці
DESCRIBE property_listings;

-- Приклад вставки тестового запису
INSERT INTO property_listings (
    id, external_id, source, title, city_id, district_id,
    price_uah, area_total, rooms, building_type, year_built,
    condition, latitude, longitude, building_series, developer,
    floor_category, distance_to_center, price_per_sqm, url
) VALUES (
    'prop_example', 'ext_12345', 'olx',
    'Квартира 65м², 2 кімнати, центр Харкова',
    'city_kharkiv', 'dist_center',
    125000, 65.0, 2, 'brick', 2015,
    'good', 49.9935, 36.2304, 'ТС-3', 'ТММ',
    'middle', 2.5, 1923.08,
    'https://example.com/property/12345'
) ON DUPLICATE KEY UPDATE
    price_uah = VALUES(price_uah),
    updated_at = CURRENT_TIMESTAMP,
    last_seen_at = CURRENT_TIMESTAMP;

-- Перевіряємо кількість записів
SELECT COUNT(*) as total_listings FROM property_listings;

-- Показуємо статистику цін
SELECT
    COUNT(*) as total,
    AVG(price_uah) as avg_price,
    MIN(price_uah) as min_price,
    MAX(price_uah) as max_price,
    AVG(price_per_sqm) as avg_price_per_sqm
FROM property_listings
WHERE is_active = TRUE AND price_uah > 0;

-- Приклад KNN запиту (пошук схожих об'єктів)
SELECT
    id,
    price_uah,
    area_total,
    rooms,
    building_type,
    year_built,
    condition,
    -- Розрахунок відстані для KNN (якщо є координати)
    CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_Distance_Sphere(
            POINT(longitude, latitude),
            POINT(36.2304, 49.9935) -- координати центру Харкова
        ) / 1000 -- конвертація в км
        ELSE NULL
    END as distance_to_center_km
FROM property_listings
WHERE is_active = TRUE
    AND city_id = 'city_kharkiv'
    AND price_uah > 0
    AND area_total > 0
ORDER BY
    -- Схожість за основними факторами
    ABS(area_total - 65.0) ASC, -- схожість по площі
    ABS(rooms - 2) ASC, -- схожість по кімнатах
    ABS(year_built - 2015) ASC -- схожість по року
LIMIT 10;
