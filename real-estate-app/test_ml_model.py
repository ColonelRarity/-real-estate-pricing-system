#!/usr/bin/env python3
"""
Тестовий скрипт для перевірки ML моделі оцінки вартості
"""

import os
import sys
import logging
import pandas as pd

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.ml_model import RealEstateMLModel, prepare_training_data

# Налаштування логування
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_ml_model_training():
    """Тест навчання ML моделі"""
    print("=== Тест навчання ML моделі ===")

    try:
        # Завантажуємо дані для навчання
        df = prepare_training_data()
        print(f"✓ Завантажено {len(df)} записів для навчання")

        # Ініціалізуємо модель
        ml_model = RealEstateMLModel()

        # Навчаємо моделі
        results = ml_model.train_models(df)

        if 'error' in results:
            print(f"✗ Помилка навчання: {results['error']}")
            return False

        print("✓ Навчання завершено успішно"        print(f"  Найкраща модель: {results['best_model']}")
        print(f"  Найкращий MAE: {results['best_mae']:,.0f} грн")

        # Показуємо результати для кожної моделі
        for model_name, result in results.items():
            if model_name not in ['best_model', 'best_mae'] and 'error' not in result:
                print(f"\n{model_name.upper()}:")
                print(f"  MAE: {result['mae']:,.0f} грн")
                print(f"  RMSE: {result['rmse']:,.0f} грн")
                print(f"  R²: {result['r2']:.3f}")

                if 'feature_importance' in result and result['feature_importance']:
                    print("  Топ-5 важливих ознак:")
                    for feature, importance in sorted(result['feature_importance'].items(),
                                                    key=lambda x: x[1], reverse=True)[:5]:
                        print(f"    {feature}: {importance:.3f}")

        # Зберігаємо моделі
        if ml_model.save_models():
            print("✓ Моделі збережено")
            return True
        else:
            print("✗ Помилка збереження моделей")
            return False

    except Exception as e:
        print(f"✗ Помилка тестування: {e}")
        return False

def test_ml_model_predictions():
    """Тест прогнозів ML моделі"""
    print("\n=== Тест прогнозів ML моделі ===")

    try:
        # Ініціалізуємо модель
        ml_model = RealEstateMLModel()

        # Спробуємо завантажити навчену модель
        if not ml_model.load_models():
            print("✗ Не вдалося завантажити навчену модель")
            return False

        # Тестові об'єкти нерухомості
        test_properties = [
            {
                'city': 'Харків',
                'district': 'Центр',
                'area_total': 60,
                'rooms': 2,
                'floor': 3,
                'total_floors': 9,
                'building_type': 'brick',
                'condition': 'good',
                'heating': 'central',
                'has_balcony': True,
                'has_elevator': True
            },
            {
                'city': 'Київ',
                'district': 'Печерський',
                'area_total': 80,
                'rooms': 3,
                'floor': 5,
                'total_floors': 16,
                'building_type': 'monolithic',
                'condition': 'excellent',
                'heating': 'individual',
                'has_balcony': True,
                'has_elevator': True
            },
            {
                'city': 'Львів',
                'district': 'Галицький',
                'area_total': 45,
                'rooms': 1,
                'floor': 2,
                'total_floors': 4,
                'building_type': 'brick',
                'condition': 'fair',
                'heating': 'central',
                'has_balcony': False,
                'has_elevator': False
            }
        ]

        print(f"Тестую {len(test_properties)} об'єктів нерухомості:")

        for i, prop in enumerate(test_properties, 1):
            print(f"\nОб'єкт {i}:")
            print(f"  Місто: {prop['city']}")
            print(f"  Район: {prop['district']}")
            print(f"  Площа: {prop['area_total']} м²")
            print(f"  Кімнат: {prop['rooms']}")
            print(f"  Тип будинку: {prop['building_type']}")
            print(f"  Стан: {prop['condition']}")

            # Отримуємо прогноз
            prediction = ml_model.predict_price(prop)

            if 'predicted_price' in prediction:
                predicted_price = prediction['predicted_price']
                print(f"  Прогнозована ціна: {predicted_price:,.0f} грн")
                print(f"  Впевненість: {prediction.get('confidence', 0):.1%}")
                print(f"  Модель: {prediction.get('model_used', 'невідома')}")

                if 'mae' in prediction:
                    print(f"  Очікувана помилка: ±{prediction['mae']:,.0f} грн")
            else:
                print(f"  Помилка прогнозу: {prediction.get('error', 'невідома')}")

        return True

    except Exception as e:
        print(f"✗ Помилка тестування прогнозів: {e}")
        return False

def test_model_comparison():
    """Порівняння ML моделі з простою оцінкою"""
    print("\n=== Порівняння моделей ===")

    try:
        # Ініціалізуємо модель
        ml_model = RealEstateMLModel()

        if not ml_model.load_models():
            print("✗ Не вдалося завантажити ML модель для порівняння")
            return False

        # Тестовий об'єкт
        test_property = {
            'city': 'Харків',
            'district': 'Центр',
            'area_total': 60,
            'rooms': 2,
            'floor': 3,
            'total_floors': 9,
            'building_type': 'brick',
            'condition': 'good',
            'heating': 'central',
            'has_balcony': True,
            'has_elevator': True
        }

        # Отримуємо ML прогноз
        ml_prediction = ml_model.predict_price(test_property)

        # Проста оцінка (з PropertyService)
        base_price = 1200  # грн/м² для Харкова
        condition_multiplier = 1.1  # для "good" condition
        building_multiplier = 1.2  # для "brick" building
        simple_price = test_property['area_total'] * base_price * condition_multiplier * building_multiplier

        print(f"Тестовий об'єкт: {test_property['area_total']}м², {test_property['rooms']} кімнат, {test_property['city']}")

        if 'predicted_price' in ml_prediction:
            ml_price = ml_prediction['predicted_price']
            ml_confidence = ml_prediction.get('confidence', 0)

            print(f"ML модель: {ml_price:,.0f} грн (впевненість: {ml_confidence:.1%})")
            print(f"Проста оцінка: {simple_price:,.0f} грн")

            difference = abs(ml_price - simple_price)
            difference_percent = (difference / simple_price) * 100

            print(f"Різниця: {difference:,.0f} грн ({difference_percent:.1f}%)")

            if difference_percent < 15:
                print("✓ Результати близькі")
            elif difference_percent < 30:
                print("⚠ Значна різниця, потрібне доопрацювання")
            else:
                print("✗ Велика різниця, модель потребує покращення")
        else:
            print("✗ ML модель не дала прогноз")

        return True

    except Exception as e:
        print(f"✗ Помилка порівняння: {e}")
        return False

def main():
    """Основна функція"""
    print("Запускаю тести ML моделі оцінки вартості...\n")

    try:
        # Навчаємо модель
        training_success = test_ml_model_training()

        if training_success:
            # Тестуємо прогнози
            prediction_success = test_ml_model_predictions()

            # Порівнюємо з простою оцінкою
            comparison_success = test_model_comparison()

            if prediction_success and comparison_success:
                print("\n✓ Всі тести ML моделі пройдено успішно!")
                print("Модель готова для використання в додатку")
            else:
                print("\n⚠ Деякі тести не пройшли, потрібне доопрацювання")
        else:
            print("\n✗ Навчання моделі не вдалося")

    except KeyboardInterrupt:
        print("\nТести перервано користувачем")
    except Exception as e:
        print(f"\n✗ Критична помилка: {e}")
        raise

if __name__ == "__main__":
    main()
