#!/usr/bin/env python3
"""
Тест KNN алгоритму оцінки нерухомості
"""

import sys
import os

# Додаємо шляхи до модулів
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))

from database import DatabaseManager
from knn_valuation_simple import SimpleKNNValuator

def test_knn_valuation():
    """Тестує KNN алгоритм оцінки"""
    print("🧪 Тестування KNN алгоритму оцінки нерухомості...")

    # Ініціалізуємо менеджер БД та KNN валюатор
    db_manager = DatabaseManager()
    knn_valuator = SimpleKNNValuator(db_manager, k=10)

    # Тестові дані для оцінки
    test_property = {
        'city': 'Харків',
        'district': 'Центр',
        'area_total': 65.0,
        'rooms': 2,
        'floor': 4,
        'total_floors': 9,
        'building_type': 'brick',
        'year_built': 2010,
        'condition': 'good',
        'heating': 'central',
        'has_balcony': True,
        'has_elevator': True
    }

    print(f"📊 Тестуємо оцінку для квартири: {test_property['area_total']}м², {test_property['rooms']} кімнати, {test_property['district']}")

    # Отримуємо оцінку
    result = knn_valuator.estimate_price_simple(test_property, k=10)

    if result.get('error'):
        print(f"❌ Помилка оцінки: {result['error']}")
        return False

    print("✅ Оцінка успішна!"    print(f"   💰 Оцінена вартість: {result['estimated_price']:,} грн")
    print(f"   📈 Діапазон цін: {result['price_range']['min']:,} - {result['price_range']['max']:,} грн")
    print(f"   🎯 Впевненість: {result['confidence']:.1%}")
    print(f"   🔍 Знайдено схожих об'єктів: {result['similar_properties_count']}")
    print(f"   📊 Середня схожість: {result['avg_similarity']:.1%}")

    # Показуємо топ схожих об'єктів
    similar_props = result.get('similar_properties', [])
    if similar_props:
        print("\n🏠 Топ схожих об'єктів:")
        for i, prop in enumerate(similar_props[:3], 1):
            print(f"   {i}. {prop['area_total']}м², {prop['rooms']}к, {prop['building_type']}, {prop['price_uah']:,} грн (схожість: {prop['similarity']:.1%})")

    # Отримуємо статистику ринку
    market_stats = knn_valuator.get_market_stats(
        city=test_property.get('city'),
        district=test_property.get('district')
    )

    if market_stats:
        print("
📈 Статистика ринку:"        print(f"   📊 Загальна кількість оголошень: {market_stats['total_listings']}")
        print(f"   💰 Середня ціна: {market_stats['avg_price']:,} грн")
        print(f"   📏 Ціна за м²: {market_stats['avg_price_per_sqm']:,} грн")
        print(f"   📊 Медіанна ціна: {market_stats['median_price']:,} грн")

    return True

def test_similarity_scoring():
    """Тестує систему оцінки схожості"""
    print("\n🔍 Тестування системи оцінки схожості...")

    db_manager = DatabaseManager()
    knn_valuator = SimpleKNNValuator(db_manager, k=5)

    # Тестові об'єкти для порівняння
    prop1 = {
        'city': 'Харків',
        'district': 'Центр',
        'area_total': 60.0,
        'rooms': 2,
        'building_type': 'brick',
        'year_built': 2015,
        'condition': 'good'
    }

    prop2 = {
        'city': 'Харків',
        'district': 'Центр',
        'area_total': 58.0,
        'rooms': 2,
        'building_type': 'brick',
        'year_built': 2015,
        'condition': 'good'
    }

    prop3 = {
        'city': 'Харків',
        'district': 'Салтівка',
        'area_total': 60.0,
        'rooms': 2,
        'building_type': 'panel',
        'year_built': 1980,
        'condition': 'fair'
    }

    # Тестуємо схожість
    similarity_1_2 = knn_valuator.calculate_similarity_score(prop1, prop2)
    similarity_1_3 = knn_valuator.calculate_similarity_score(prop1, prop3)

    print(f"✅ Схожість prop1 vs prop2 (ідентичні майже): {similarity_1_2:.1%}")
    print(f"✅ Схожість prop1 vs prop3 (різні райони та типи): {similarity_1_3:.1%}")

    if similarity_1_2 > similarity_1_3:
        print("✅ Система правильно визначає схожість!")
        return True
    else:
        print("❌ Помилка в системі схожості")
        return False

if __name__ == "__main__":
    print("🚀 Запуск тестів KNN алгоритму оцінки нерухомості\n")

    success = True

    # Тест 1: Оцінка вартості
    success &= test_knn_valuation()

    # Тест 2: Система схожості
    success &= test_similarity_scoring()

    if success:
        print("\n🎉 Всі тести пройдені успішно!")
        print("💡 KNN алгоритм оцінки готовий до використання")
    else:
        print("\n❌ Деякі тести не пройшли")
        print("🔧 Перевірте налаштування та дані в базі")

    sys.exit(0 if success else 1)
