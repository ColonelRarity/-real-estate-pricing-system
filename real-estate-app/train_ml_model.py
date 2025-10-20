#!/usr/bin/env python3
"""
Скрипт для навчання ML моделі на реальних даних з бази
"""

import os
import sys
import logging
import argparse
import pandas as pd

# Додаємо кореневу папку до шляху
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.ml_model import RealEstateMLModel, prepare_training_data
from data_collection.database import DatabaseManager

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml_training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_data_from_database(db_url: str = None) -> pd.DataFrame:
    """Завантаження даних з бази даних для навчання моделі"""

    logger.info("Завантажую дані з бази даних для навчання моделі...")

    try:
        db = DatabaseManager(db_url or os.getenv('DATABASE_URL', 'sqlite:///real_estate.db'))

        with db.get_session() as session:
            # Отримуємо всі оголошення з цінами та характеристиками
            query = """
            SELECT
                pl.price_uah,
                pl.area_total,
                pl.rooms,
                pl.floor,
                pl.total_floors,
                pl.building_type,
                pl.condition,
                pl.heating,
                pl.has_balcony,
                pl.has_elevator,
                c.name as city,
                d.name as district
            FROM property_listings pl
            JOIN cities c ON pl.city_id = c.id
            LEFT JOIN districts d ON pl.district_id = d.id
            WHERE pl.price_uah > 0
            AND pl.area_total > 10
            AND pl.area_total < 500
            AND pl.is_active = 1
            """

            df = pd.read_sql(query, db.engine)

            logger.info(f"Завантажено {len(df)} записів з бази даних")

            # Перетворюємо булеві поля
            df['has_balcony'] = df['has_balcony'].astype(int)
            df['has_elevator'] = df['has_elevator'].astype(int)

            # Заповнюємо пропуски
            df['district'] = df['district'].fillna('Невідомий')
            df['building_type'] = df['building_type'].fillna('panel')
            df['condition'] = df['condition'].fillna('good')
            df['heating'] = df['heating'].fillna('central')

            return df

    except Exception as e:
        logger.error(f"Помилка завантаження даних з бази: {e}")
        logger.info("Використовую синтетичні дані для тестування")
        return prepare_training_data()

def train_and_save_model(data_path: str = None, db_url: str = None):
    """Навчання та збереження ML моделі"""

    logger.info("Починаю навчання ML моделі...")

    # Завантажуємо дані
    if data_path and os.path.exists(data_path):
        df = prepare_training_data(data_path)
    else:
        df = load_data_from_database(db_url)

    if df.empty:
        logger.error("Не вдалося завантажити дані для навчання")
        return False

    logger.info(f"Доступно {len(df)} записів для навчання")

    # Ініціалізуємо модель
    ml_model = RealEstateMLModel()

    # Навчаємо моделі
    training_results = ml_model.train_models(df)

    if 'error' in training_results:
        logger.error(f"Помилка навчання: {training_results['error']}")
        return False

    # Оцінюємо моделі
    evaluation_results = ml_model.evaluate_models(df)

    # Виводимо результати
    print("\n" + "="*50)
    print("РЕЗУЛЬТАТИ НАВЧАННЯ МОДЕЛЕЙ")
    print("="*50)

    for model_name, result in training_results.items():
        if model_name in ['best_model', 'best_mae']:
            continue

        if 'error' not in result:
            print(f"\n{model_name.upper()}:")
            print(f"  MAE: {result['mae']:,.0f} грн")
            print(f"  RMSE: {result['rmse']:,.0f} грн")
            print(f"  R²: {result['r2']:.3f}")

            if 'feature_importance' in result and result['feature_importance']:
                print("  Важливість ознак:")
                for feature, importance in sorted(result['feature_importance'].items(),
                                                key=lambda x: x[1], reverse=True)[:5]:
                    print(f"    {feature}: {importance:.3f}")

    print(f"\nНайкраща модель: {training_results['best_model']}")
    print(f"Найкращий MAE: {training_results['best_mae']:,.0f} грн")

    # Зберігаємо моделі
    if ml_model.save_models():
        logger.info("Моделі успішно збережено")
        print("✓ Моделі збережено")
        return True
    else:
        logger.error("Помилка збереження моделей")
        return False

def test_model_predictions(db_url: str = None):
    """Тестування прогнозів моделі на реальних даних"""

    logger.info("Тестую прогнози моделі...")

    # Завантажуємо навчену модель
    ml_model = RealEstateMLModel()

    if not ml_model.load_models():
        logger.error("Не вдалося завантажити моделі для тестування")
        return False

    # Завантажуємо тестові дані
    df = load_data_from_database(db_url)

    if df.empty or len(df) < 10:
        logger.error("Недостатньо даних для тестування")
        return False

    # Тестуємо на перших 10 об'єктах
    test_properties = df.head(10).to_dict('records')

    print("\n" + "="*50)
    print("ТЕСТ ПРОГНОЗІВ")
    print("="*50)

    correct_predictions = 0
    total_predictions = 0

    for i, prop in enumerate(test_properties):
        actual_price = prop['price_uah']

        # Створюємо словник для прогнозу
        prediction_data = {
            'area_total': prop['area_total'],
            'rooms': prop['rooms'],
            'floor': prop['floor'],
            'total_floors': prop['total_floors'],
            'city': prop['city'],
            'district': prop['district'],
            'building_type': prop['building_type'],
            'condition': prop['condition'],
            'heating': prop['heating'],
            'has_balcony': prop['has_balcony'],
            'has_elevator': prop['has_elevator']
        }

        # Отримуємо прогноз
        prediction = ml_model.predict_price(prediction_data)

        if 'predicted_price' in prediction and prediction['predicted_price']:
            predicted_price = prediction['predicted_price']
            error = abs(actual_price - predicted_price)
            error_percent = (error / actual_price) * 100

            print(f"\nОб'єкт {i+1}:")
            print(f"  Фактична ціна: {actual_price:,.0f} грн")
            print(f"  Прогноз: {predicted_price:,.0f} грн")
            print(f"  Помилка: {error:,.0f} грн ({error_percent:.1f}%)")
            print(f"  Модель: {prediction.get('model_used', 'невідома')}")
            print(f"  Впевненість: {prediction.get('confidence', 0):.1%}")

            total_predictions += 1
            if error_percent < 20:  # Помилка менше 20%
                correct_predictions += 1

    if total_predictions > 0:
        accuracy = (correct_predictions / total_predictions) * 100
        print(f"\nТочність прогнозів: {correct_predictions}/{total_predictions} ({accuracy:.1f}%)")

        if accuracy > 70:
            print("✓ Модель показує хороші результати!")
        elif accuracy > 50:
            print("⚠ Модель потребує доопрацювання")
        else:
            print("✗ Модель потребує значного покращення")

    return True

def main():
    """Основна функція"""
    parser = argparse.ArgumentParser(description='Навчання ML моделі для оцінки нерухомості')
    parser.add_argument('--data', type=str, help='Шлях до CSV файлу з даними')
    parser.add_argument('--db', type=str, help='URL бази даних')
    parser.add_argument('--test-only', action='store_true', help='Тільки тестування, без навчання')
    parser.add_argument('--models-dir', type=str, default='models', help='Директорія для моделей')

    args = parser.parse_args()

    try:
        if args.test_only:
            # Тільки тестуємо існуючу модель
            success = test_model_predictions(args.db)
        else:
            # Навчаємо модель
            success = train_and_save_model(args.data, args.db)

            if success:
                # Тестуємо після навчання
                print("\n" + "="*50)
                print("Тестую навчену модель...")
                test_model_predictions(args.db)

        if success:
            logger.info("Навчання та тестування завершено успішно")
        else:
            logger.error("Виникли помилки під час навчання")

    except KeyboardInterrupt:
        logger.info("Навчання перервано користувачем")
    except Exception as e:
        logger.error(f"Критична помилка: {e}")
        raise

if __name__ == "__main__":
    main()
