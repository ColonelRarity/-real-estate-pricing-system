"""
Модуль машинного навчання для оцінки вартості нерухомості
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Tuple, Any
import os
from datetime import datetime

# Опциональные импорты sklearn
try:
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("sklearn недоступен, используется только простая формула оценки")

logger = logging.getLogger(__name__)

class RealEstateMLModel:
    """ML модель для оцінки вартості нерухомості"""

    def __init__(self, model_dir: str = 'models'):
        self.model_dir = model_dir
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}

        # Створюємо директорію для моделей, якщо вона не існує
        os.makedirs(model_dir, exist_ok=True)

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Підготовка ознак для навчання моделі"""

        # Створюємо копію датафрейму
        df_processed = df.copy()

        # Якщо sklearn доступен, используем продвинутую обработку
        if SKLEARN_AVAILABLE:
            # Обробка категоріальних змінних
            categorical_columns = ['city', 'district', 'building_type', 'condition', 'heating']

            for col in categorical_columns:
                if col in df_processed.columns:
                    # Використовуємо Label Encoding для категоріальних змінних
                    if col not in self.label_encoders:
                        self.label_encoders[col] = LabelEncoder()
                        df_processed[col] = self.label_encoders[col].fit_transform(df_processed[col].astype(str))
                    else:
                        # Для нових даних використовуємо вже навчену трансформацію
                        df_processed[col] = df_processed[col].astype(str)
                        # Обробляємо невідомі категорії
                        known_categories = set(self.label_encoders[col].classes_)
                        df_processed[col] = df_processed[col].apply(
                            lambda x: x if x in known_categories else 'unknown'
                        )
                        df_processed[col] = self.label_encoders[col].transform(df_processed[col])

            # Обробка числових ознак
            numeric_columns = ['area_total', 'rooms', 'floor', 'total_floors', 'year_built']

            # Стандартизація числових ознак
            if numeric_columns[0] in df_processed.columns:  # Перевіряємо, чи є area_total
                if 'scaler' not in self.scalers:
                    self.scalers['scaler'] = StandardScaler()
                    numeric_data = df_processed[numeric_columns].fillna(df_processed[numeric_data].mean())
                    self.scalers['scaler'].fit(numeric_data)
                else:
                    numeric_data = df_processed[numeric_columns].fillna(df_processed[numeric_columns].mean())

                df_processed[numeric_columns] = self.scalers['scaler'].transform(numeric_data)

        # Створюємо додаткові ознаки (работают без sklearn)
        if 'area_total' in df_processed.columns and 'rooms' in df_processed.columns:
            df_processed['price_per_sqm'] = df_processed['price_uah'] / df_processed['area_total']
            df_processed['room_density'] = df_processed['rooms'] / df_processed['area_total']

        if 'floor' in df_processed.columns and 'total_floors' in df_processed.columns:
            df_processed['floor_ratio'] = df_processed['floor'] / df_processed['total_floors']
            df_processed['is_first_floor'] = (df_processed['floor'] == 1).astype(int)
            df_processed['is_last_floor'] = (df_processed['floor'] == df_processed['total_floors']).astype(int)

        # Цільова змінна
        target = df_processed['price_uah']

        # Ознаки для навчання
        feature_columns = [
            'area_total', 'rooms', 'floor', 'total_floors', 'year_built',
            'city', 'district', 'building_type', 'condition', 'heating',
            'has_balcony', 'has_elevator', 'price_per_sqm', 'room_density',
            'floor_ratio', 'is_first_floor', 'is_last_floor'
        ]

        # Фільтруємо тільки ті колонки, які є в датафреймі
        available_features = [col for col in feature_columns if col in df_processed.columns]

        return df_processed[available_features], target

    def train_models(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict[str, Any]:
        """Навчання моделей машинного навчання"""

        if not SKLEARN_AVAILABLE:
            logger.warning("sklearn недоступен, обучение моделей невозможно")
            return {'error': 'sklearn недоступен для навчання моделей'}

        logger.info(f"Починаю навчання моделей на {len(df)} записах")

        # Підготовка даних
        X, y = self.prepare_features(df)

        # Перевіряємо, чи достатньо даних
        if len(X) < 50:
            logger.warning("Недостатньо даних для навчання моделі")
            return {'error': 'Недостатньо даних для навчання'}

        # Розділення на тренувальну та тестову вибірки
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        logger.info(f"Тренувальна вибірка: {len(X_train)}, тестова: {len(X_test)}")

        # Навчання моделей
        models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=10,
                random_state=42
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=100,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            )
        }

        results = {}

        for name, model in models.items():
            try:
                logger.info(f"Навчаю модель {name}")

                # Навчання моделі
                model.fit(X_train, y_train)

                # Оцінка на тестовій вибірці
                y_pred = model.predict(X_test)

                # Метрики якості
                mae = mean_absolute_error(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                r2 = r2_score(y_test, y_pred)

                results[name] = {
                    'model': model,
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2,
                    'feature_importance': None
                }

                logger.info(f"Модель {name}: MAE={mae:.0f}, RMSE={rmse:.0f}, R2={r2:.3f}")

                # Для Random Forest та Gradient Boosting зберігаємо важливість ознак
                if hasattr(model, 'feature_importances_'):
                    results[name]['feature_importance'] = dict(zip(X.columns, model.feature_importances_))

                # Зберігаємо модель
                self.models[name] = model

            except Exception as e:
                logger.error(f"Помилка навчання моделі {name}: {e}")
                results[name] = {'error': str(e)}

        # Визначаємо найкращу модель
        best_model = None
        best_score = float('inf')

        for name, result in results.items():
            if 'error' not in result and result['mae'] < best_score:
                best_score = result['mae']
                best_model = name

        results['best_model'] = best_model
        results['best_mae'] = best_score

        logger.info(f"Найкраща модель: {best_model} з MAE={best_score:.0f}")

        return results

    def predict_price(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Прогнозування ціни для конкретного об'єкта"""

        if not self.models:
            return {
                'error': 'Моделі не навчені',
                'predicted_price': None,
                'confidence': 0
            }

        try:
            # Конвертуємо словник в DataFrame
            df = pd.DataFrame([property_data])

            # Підготовка ознак
            X, _ = self.prepare_features(df)

            # Якщо недостатньо ознак, використовуємо просту формулу
            if len(X.columns) < 5:
                logger.warning("Недостатньо ознак для ML моделі, використовую просту оцінку")
                return self._simple_prediction(property_data)

            # Прогнозування найкращою моделлю
            best_model_name = None
            best_model = None
            best_mae = float('inf')

            for name, model in self.models.items():
                if hasattr(model, 'predict'):
                    try:
                        pred = model.predict(X)
                        mae = abs(pred[0] - property_data.get('price_uah', 0))
                        if mae < best_mae:
                            best_mae = mae
                            best_model = model
                            best_model_name = name
                    except:
                        continue

            if best_model is None:
                return self._simple_prediction(property_data)

            predicted_price = best_model.predict(X)[0]

            # Обчислення впевненості на основі MAE найкращої моделі
            confidence = max(0, min(1, 1 - (best_mae / predicted_price)))

            return {
                'predicted_price': max(0, predicted_price),
                'confidence': confidence,
                'model_used': best_model_name,
                'mae': best_mae
            }

        except Exception as e:
            logger.error(f"Помилка прогнозування: {e}")
            return self._simple_prediction(property_data)

    def _simple_prediction(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Проста оцінка на основі базових факторів"""

        area = property_data.get('area_total', 0)
        rooms = property_data.get('rooms', 1)
        city = property_data.get('city', 'Харків').lower()

        # Базові ціни за містами (за м²)
        base_prices = {
            'харків': 1200,
            'київ': 2500,
            'львів': 1800,
            'одеса': 1600,
            'дніпро': 1400
        }

        base_price = base_prices.get(city, 1200)

        # Множники за станом
        condition_multipliers = {
            'excellent': 1.3,
            'good': 1.1,
            'fair': 1.0,
            'poor': 0.8
        }

        condition = property_data.get('condition', 'good')
        multiplier = condition_multipliers.get(condition, 1.0)

        # Множники за типом будинку
        building_multipliers = {
            'brick': 1.2,
            'monolithic': 1.1,
            'panel': 1.0,
            'wood': 0.9
        }

        building_type = property_data.get('building_type', 'panel')
        building_multiplier = building_multipliers.get(building_type, 1.0)

        # Розрахунок ціни
        predicted_price = area * base_price * multiplier * building_multiplier

        # Врахування кількості кімнат (оптимальна щільність)
        if rooms > 0:
            density = area / rooms
            if density < 15:  # Маленькі кімнати
                predicted_price *= 0.9
            elif density > 25:  # Великі кімнати
                predicted_price *= 1.1

        return {
            'predicted_price': max(0, predicted_price),
            'confidence': 0.6,  # Низька впевненість для простої моделі
            'model_used': 'simple',
            'note': 'Використано просту формулу оцінки'
        }

    def save_models(self) -> bool:
        """Збереження навченых моделей"""

        if not SKLEARN_AVAILABLE:
            logger.warning("sklearn недоступен, сохранение моделей невозможно")
            return False

        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            for name, model in self.models.items():
                if hasattr(model, 'fit'):  # Перевіряємо, чи це валідна модель
                    model_path = os.path.join(self.model_dir, f'{name}_model_{timestamp}.pkl')
                    joblib.dump(model, model_path)
                    logger.info(f"Збережено модель {name} в {model_path}")

            # Зберігаємо скейлери та енкодери
            for name, scaler in self.scalers.items():
                scaler_path = os.path.join(self.model_dir, f'{name}_{timestamp}.pkl')
                joblib.dump(scaler, scaler_path)

            for name, encoder in self.label_encoders.items():
                encoder_path = os.path.join(self.model_dir, f'{name}_encoder_{timestamp}.pkl')
                joblib.dump(encoder, encoder_path)

            logger.info("Всі моделі збережено")
            return True

        except Exception as e:
            logger.error(f"Помилка збереження моделей: {e}")
            return False

    def load_models(self, timestamp: str = None) -> bool:
        """Завантаження навченых моделей"""

        if not SKLEARN_AVAILABLE:
            logger.warning("sklearn недоступен, загрузка моделей невозможна")
            return False

        try:
            if timestamp is None:
                # Знаходимо найновіші файли моделей
                model_files = [f for f in os.listdir(self.model_dir) if f.endswith('.pkl')]
                if not model_files:
                    logger.warning("Не знайдено збережених моделей")
                    return False

                # Беремо найновіші файли
                model_files.sort(reverse=True)
                timestamp = model_files[0].split('_')[-1].replace('.pkl', '')

            # Завантажуємо моделі
            for name in ['linear', 'random_forest', 'gradient_boosting']:
                model_path = os.path.join(self.model_dir, f'{name}_model_{timestamp}.pkl')
                if os.path.exists(model_path):
                    self.models[name] = joblib.load(model_path)
                    logger.info(f"Завантажено модель {name}")

            # Завантажуємо скейлери та енкодери
            scaler_path = os.path.join(self.model_dir, f'scaler_{timestamp}.pkl')
            if os.path.exists(scaler_path):
                self.scalers['scaler'] = joblib.load(scaler_path)

            for col in ['city', 'district', 'building_type', 'condition', 'heating']:
                encoder_path = os.path.join(self.model_dir, f'{col}_encoder_{timestamp}.pkl')
                if os.path.exists(encoder_path):
                    self.label_encoders[col] = joblib.load(encoder_path)

            logger.info("Всі моделі завантажено")
            return True

        except Exception as e:
            logger.error(f"Помилка завантаження моделей: {e}")
            return False

    def evaluate_models(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Оцінка якості моделей"""

        if not SKLEARN_AVAILABLE:
            return {'error': 'sklearn недоступен для оцінки моделей'}

        X, y = self.prepare_features(df)

        if len(X) < 20:
            return {'error': 'Недостатньо даних для оцінки'}

        results = {}

        for name, model in self.models.items():
            if hasattr(model, 'predict'):
                try:
                    # Крос-валідація
                    scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
                    mae_cv = -scores.mean()

                    # Прогнозування
                    y_pred = model.predict(X)
                    mae = mean_absolute_error(y, y_pred)
                    r2 = r2_score(y, y_pred)

                    results[name] = {
                        'cv_mae': mae_cv,
                        'mae': mae,
                        'r2': r2
                    }

                except Exception as e:
                    results[name] = {'error': str(e)}

        return results

def prepare_training_data(csv_path: str = None) -> pd.DataFrame:
    """Підготовка даних для навчання моделі"""

    if csv_path and os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        logger.info(f"Завантажено {len(df)} записів з {csv_path}")
    else:
        # Створюємо синтетичні дані для тестування
        logger.info("Створюю синтетичні дані для тестування")
        df = create_synthetic_data(1000)

    # Фільтруємо валідні записи
    df = df[df['price_uah'] > 0]
    df = df[df['area_total'] > 10]
    df = df[df['area_total'] < 500]  # Розумні межі площі

    logger.info(f"Після фільтрації: {len(df)} валідних записів")

    return df

def create_synthetic_data(n_samples: int = 1000) -> pd.DataFrame:
    """Створення синтетичних даних для тестування"""

    np.random.seed(42)

    data = {
        'city': np.random.choice(['Харків', 'Київ', 'Львів', 'Одеса'], n_samples),
        'district': np.random.choice(['Центр', 'Салтівка', 'Олексіївка', 'Шевченківський'], n_samples),
        'area_total': np.random.uniform(20, 200, n_samples),
        'rooms': np.random.choice([1, 2, 3, 4], n_samples, p=[0.3, 0.4, 0.2, 0.1]),
        'floor': np.random.randint(1, 26, n_samples),
        'total_floors': np.random.randint(5, 26, n_samples),
        'building_type': np.random.choice(['panel', 'brick', 'monolithic'], n_samples, p=[0.5, 0.3, 0.2]),
        'condition': np.random.choice(['poor', 'fair', 'good', 'excellent'], n_samples, p=[0.1, 0.3, 0.4, 0.2]),
        'heating': np.random.choice(['central', 'individual'], n_samples, p=[0.8, 0.2]),
        'has_balcony': np.random.choice([0, 1], n_samples, p=[0.3, 0.7]),
        'has_elevator': np.random.choice([0, 1], n_samples, p=[0.4, 0.6]),
    }

    df = pd.DataFrame(data)

    # Розрахунок цін на основі факторів
    base_prices = {
        'Харків': 1200,
        'Київ': 2500,
        'Львів': 1800,
        'Одеса': 1600
    }

    condition_multipliers = {
        'poor': 0.7,
        'fair': 0.85,
        'good': 1.0,
        'excellent': 1.3
    }

    building_multipliers = {
        'panel': 0.9,
        'brick': 1.1,
        'monolithic': 1.2
    }

    df['price_uah'] = (
        df['area_total'] *
        df['city'].map(base_prices) *
        df['condition'].map(condition_multipliers) *
        df['building_type'].map(building_multipliers) *
        (0.8 + 0.4 * np.random.random(n_samples))  # Випадковий фактор
    )

    # Додаємо шум до цін
    df['price_uah'] = df['price_uah'] * (0.8 + 0.4 * np.random.random(n_samples))

    return df
