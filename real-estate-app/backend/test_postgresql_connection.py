#!/usr/bin/env python3
"""
Тест підключення до PostgreSQL та перевірка створених таблиць
"""

import psycopg2
import sys
import os

def test_postgresql_connection():
    """Тестує підключення до PostgreSQL"""
    print("🧪 Тестування підключення до PostgreSQL...")

    # Параметри підключення (змініть на ваші)
    connection_params = {
        'host': 'localhost',
        'port': 5432,
        'database': 'real_estate',
        'user': 'postgres',
        'password': 'your_password_here'  # Змініть на ваш пароль
    }

    try:
        # Підключення до бази даних
        conn = psycopg2.connect(**connection_params)
        conn.autocommit = True
        cursor = conn.cursor()

        print("✅ Підключення до PostgreSQL встановлено успішно!")

        # Перевірка версії PostgreSQL
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"📋 Версія PostgreSQL: {version}")

        # Перевірка таблиць
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
                AND table_name IN ('cities', 'districts', 'property_listings', 'market_stats');
        """)

        tables = cursor.fetchall()
        print(f"📊 Знайдено таблиць: {len(tables)}")

        for table in tables:
            print(f"   - {table[0]}")

        # Перевірка кількості записів в таблиці міст
        cursor.execute("SELECT COUNT(*) FROM cities;")
        cities_count = cursor.fetchone()[0]
        print(f"🏙️  Кількість міст: {cities_count}")

        # Перевірка кількості записів в таблиці районів
        cursor.execute("SELECT COUNT(*) FROM districts;")
        districts_count = cursor.fetchone()[0]
        print(f"🏘️  Кількість районів: {districts_count}")

        # Перевірка кількості оголошень
        cursor.execute("SELECT COUNT(*) FROM property_listings;")
        listings_count = cursor.fetchone()[0]
        print(f"🏠 Кількість оголошень: {listings_count}")

        # Тест KNN запиту з простою евклідовою відстанню
        print("\n🔍 Тест KNN запиту...")
        cursor.execute("""
            SELECT
                pl.id,
                pl.price_uah,
                pl.area_total,
                c.name as city,
                -- Проста евклідова відстань (працює без PostGIS)
                CASE
                    WHEN pl.latitude IS NOT NULL AND pl.longitude IS NOT NULL
                    THEN SQRT(
                        ((pl.latitude - 49.9935) * (pl.latitude - 49.9935)) +
                        ((pl.longitude - 36.2304) * (pl.longitude - 36.2304))
                    ) * 111
                    ELSE NULL
                END as distance_km
            FROM property_listings pl
            JOIN cities c ON pl.city_id = c.id
            WHERE pl.is_active = TRUE AND pl.price_uah > 0
            ORDER BY distance_km ASC
            LIMIT 5;
        """)

        knn_results = cursor.fetchall()
        print(f"📍 Знайдено {len(knn_results)} записів для KNN тесту")

        for result in knn_results:
            print(f"   - {result[0]}: {result[1]} грн, {result[2]}м², відстань: {result[3]:.1f} км" if result[3] else f"   - {result[0]}: {result[1]} грн, {result[2]}м²")

        # Тест статистики цін
        print("\n📈 Тест статистики цін...")
        cursor.execute("""
            SELECT
                c.name as city,
                COUNT(*) as listings_count,
                AVG(pl.price_uah) as avg_price,
                AVG(pl.price_per_sqm) as avg_price_per_sqm
            FROM property_listings pl
            JOIN cities c ON pl.city_id = c.id
            WHERE pl.is_active = TRUE AND pl.price_uah > 0
            GROUP BY c.name
            ORDER BY avg_price DESC;
        """)

        stats = cursor.fetchall()
        print(f"📊 Статистика по {len(stats)} містах:")

        for stat in stats:
            print(f"   - {stat[0]}: {stat[1]} оголошень, сер. ціна: {stat[2]:.0f} грн, за м²: {stat[3]:.0f} грн")

        # Закриваємо з'єднання
        cursor.close()
        conn.close()

        print("\n🎉 Всі тести пройдені успішно!")
        print("💡 Ваша PostgreSQL база даних готова для KNN оцінки нерухомості")
        return True

    except psycopg2.Error as e:
        print(f"❌ Помилка PostgreSQL: {e}")
        print("🔧 Перевірте параметри підключення та чи запущений сервер PostgreSQL")
        return False
    except Exception as e:
        print(f"❌ Загальна помилка: {e}")
        return False

def print_connection_help():
    """Друкує допомогу по налаштуванню підключення"""
    print("\n🔧 Допомога по налаштуванню PostgreSQL:")
    print("1. Встановіть PostgreSQL: https://postgresql.org/download/")
    print("2. Створіть базу даних: CREATE DATABASE real_estate;")
    print("3. Змініть параметри підключення в цьому файлі:")
    print("   connection_params = {")
    print("       'host': 'localhost',")
    print("       'port': 5432,")
    print("       'database': 'real_estate',")
    print("       'user': 'postgres',")
    print("       'password': 'your_password_here'")
    print("   }")
    print("4. Запустіть: python test_postgresql_connection.py")

if __name__ == "__main__":
    print("🚀 Тестування підключення до PostgreSQL бази даних\n")

    success = test_postgresql_connection()

    if not success:
        print("\n❌ Тест не пройшов")
        print_connection_help()
        sys.exit(1)
    else:
        print("\n✅ Тест пройшов успішно!")
        sys.exit(0)
