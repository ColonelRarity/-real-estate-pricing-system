#!/usr/bin/env python3
"""
Тестовий скрипт для перевірки геокодування та подібності об'єктів
"""

import os
import sys
import asyncio
from typing import Dict, List

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mobile.src.services.GeocodingService import GeocodingService
from mobile.src.services.PropertyService import PropertyService, PropertyData

def test_geocoding():
    """Тест геокодування адрес"""
    print("=== Тест геокодування ===")

    test_addresses = [
        "вул. Сумська 25, Харків",
        "просп. Науки 15, Харків",
        "вул. Пушкінська 10, кв. 5, Харків",
        "Салтівське шосе 245, Харків",
    ]

    for address in test_addresses:
        print(f"\nТестую адресу: {address}")
        try:
            result = GeocodingService.geocodeAddress(address, "Харків")
            if result:
                print(f"✓ Успішно: {result.latitude}, {result.longitude}")
                print(f"  Повна адреса: {result.displayName}")

                # Тест зворотного геокодування
                reverse_result = GeocodingService.reverseGeocode(result.latitude, result.longitude)
                if reverse_result:
                    print(f"✓ Зворотне геокодування: {reverse_result.address}")
            else:
                print("✗ Не вдалося геокодувати")
        except Exception as e:
            print(f"✗ Помилка: {e}")

def test_similarity_calculation():
    """Тест обчислення подібності об'єктів"""
    print("\n=== Тест подібності об'єктів ===")

    # Створюємо тестові об'єкти
    property1: PropertyData = {
        'city': 'Харків',
        'district': 'Центр',
        'address': 'вул. Сумська 25',
        'area': 60,
        'rooms': 2,
        'floor': 3,
        'totalFloors': 9,
        'buildingType': 'brick',
        'condition': 'good',
        'hasBalcony': True,
        'hasElevator': True,
        'heating': 'central',
        'coordinates': {'latitude': 49.9935, 'longitude': 36.2304}
    }

    property2: PropertyData = {
        'city': 'Харків',
        'district': 'Центр',
        'address': 'вул. Сумська 30',
        'area': 65,
        'rooms': 2,
        'floor': 4,
        'totalFloors': 9,
        'buildingType': 'brick',
        'condition': 'good',
        'hasBalcony': True,
        'hasElevator': True,
        'heating': 'central',
        'coordinates': {'latitude': 49.9940, 'longitude': 36.2310}
    }

    property3: PropertyData = {
        'city': 'Харків',
        'district': 'Салтівка',
        'address': 'вул. Академіка Павлова 100',
        'area': 45,
        'rooms': 1,
        'floor': 2,
        'totalFloors': 5,
        'buildingType': 'panel',
        'condition': 'fair',
        'hasBalcony': False,
        'hasElevator': False,
        'heating': 'central',
        'coordinates': {'latitude': 50.0300, 'longitude': 36.2950}
    }

    # Тестуємо подібність
    similarity1_2 = PropertyService.calculateSimilarity(property1, property2)
    similarity1_3 = PropertyService.calculateSimilarity(property1, property3)

    print(f"Подібність property1 vs property2: {similarity1_2:.2f}")
    print(f"Подібність property1 vs property3: {similarity1_3:.2f}")

    # Тестуємо відстань
    distance1_2 = PropertyService.calculateDistanceToProperty(property1, property2)
    distance1_3 = PropertyService.calculateDistanceToProperty(property1, property3)

    print(f"Відстань property1 до property2: {distance1_2:.0f}м")
    print(f"Відстань property1 до property3: {distance1_3:.0f}м")

def test_find_nearby_properties():
    """Тест пошуку сусідніх об'єктів"""
    print("\n=== Тест пошуку сусідніх об'єктів ===")

    # Створюємо тестові об'єкти
    test_properties = [
        {
            'latitude': 49.9935,
            'longitude': 36.2304,
            'id': 'prop1'
        },
        {
            'latitude': 49.9940,
            'longitude': 36.2310,
            'id': 'prop2'
        },
        {
            'latitude': 49.9950,
            'longitude': 36.2350,
            'id': 'prop3'
        },
        {
            'latitude': 50.0300,
            'longitude': 36.2950,
            'id': 'prop4'
        },
    ]

    # Тестуємо пошук в радіусі 500м від центру Харкова
    center_lat, center_lng = 49.9935, 36.2304
    nearby = GeocodingService.findNearbyProperties(
        center_lat, center_lng, test_properties, 500
    )

    print(f"Знайдено {len(nearby)} об'єктів в радіусі 500м від центру:")
    for prop in nearby:
        print(f"  - {prop['id']}: {prop['distance']:.0f}м")

def test_property_service_integration():
    """Тест інтеграції PropertyService з геокодуванням"""
    print("\n=== Тест PropertyService ===")

    # Тестуємо геокодування адреси
    test_address = "вул. Сумська 25, Харків"
    coordinates = PropertyService.geocodeAddress(test_address)

    if coordinates:
        print(f"✓ Геокодування успішне: {coordinates}")

        # Тестуємо зворотне геокодування
        address = PropertyService.reverseGeocode(coordinates.latitude, coordinates.longitude)
        if address:
            print(f"✓ Зворотне геокодування: {address}")
    else:
        print("✗ Геокодування не вдалося")

def main():
    """Основна функція"""
    print("Запускаю тести геокодування та подібності об'єктів...\n")

    try:
        test_geocoding()
        test_similarity_calculation()
        test_find_nearby_properties()
        test_property_service_integration()

        print("\n✓ Всі тести завершено!")

    except Exception as e:
        print(f"\n✗ Помилка під час тестування: {e}")
        raise

if __name__ == "__main__":
    main()
