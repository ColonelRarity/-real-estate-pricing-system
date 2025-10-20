#!/usr/bin/env python3
"""
Міграція для додавання нових полів до таблиці PropertyListing
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))

from database import DatabaseManager
from models import PropertyListing

def add_new_fields():
    """Додає нові поля до таблиці PropertyListing"""
    print("🔄 Виконуємо міграцію бази даних...")

    db_manager = DatabaseManager()

    try:
        # Створюємо таблиці з новими полями
        db_manager.create_tables()

        print("✅ Міграція виконана успішно!")
        print("📋 Додано нові поля:")
        print("   - building_series (серія будинку)")
        print("   - developer (забудовник)")
        print("   - floor_category (категорія поверху)")
        print("   - distance_to_center (відстань до центру)")
        print("   - price_per_sqm (ціна за м²)")
        print("   - days_on_market (днів на ринку)")
        print("   - Оновлено індекси для кращої продуктивності")

        return True

    except Exception as e:
        print(f"❌ Помилка міграції: {e}")
        return False

def check_database_structure():
    """Перевіряє структуру бази даних"""
    print("🔍 Перевірка структури бази даних...")

    db_manager = DatabaseManager()

    try:
        with db_manager.get_session() as session:
            # Перевіряємо чи є таблиці
            tables = db_manager.engine.table_names()
            print(f"📊 Знайдено таблиці: {tables}")

            # Перевіряємо кількість записів
            listings_count = session.query(PropertyListing).count()
            print(f"🏠 Кількість оголошень: {listings_count}")

            if listings_count > 0:
                # Показуємо приклад запису
                sample = session.query(PropertyListing).first()
                print("📝 Приклад оголошення:")
                print(f"   ID: {sample.id}")
                print(f"   Ціна: {sample.price_uah} грн")
                print(f"   Площа: {sample.area_total} м²")
                print(f"   Район: {sample.district.name if sample.district else 'N/A'}")
                print(f"   Тип будинку: {sample.building_type}")

        return True

    except Exception as e:
        print(f"❌ Помилка перевірки: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск міграції бази даних для KNN оцінки нерухомості\n")

    success = True

    # Крок 1: Перевірка поточної структури
    success &= check_database_structure()

    # Крок 2: Міграція
    success &= add_new_fields()

    if success:
        print("\n🎉 Міграція виконана успішно!")
        print("💡 Тепер база даних готова для KNN оцінки нерухомості")
        print("🔧 Ви можете додавати оголошення через API або веб-інтерфейс")
    else:
        print("\n❌ Міграція не виконана")
        print("🔧 Перевірте налаштування бази даних")

    sys.exit(0 if success else 1)
