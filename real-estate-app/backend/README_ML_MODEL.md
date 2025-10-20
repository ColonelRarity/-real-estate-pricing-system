# 🤖 Модуль машинного навчання для оцінки нерухомості

## Огляд

Модуль `ml_model.py` реалізує систему машинного навчання для оцінки вартості нерухомості в Україні з використанням різних алгоритмів.

## Архітектура

### Основні компоненти

1. **RealEstateMLModel** - основний клас моделі
2. **prepare_features()** - підготовка ознак для навчання
3. **train_models()** - навчання моделей
4. **predict_price()** - прогнозування ціни для конкретного об'єкта
5. **save_models()** / **load_models()** - збереження та завантаження моделей

### Підтримувані алгоритми

- **Linear Regression** - лінійна регресія
- **Random Forest** - випадковий ліс
- **Gradient Boosting** - градієнтний бустинг

## Використання

### Базове використання

```python
from ml_model import RealEstateMLModel

# Створення моделі
model = RealEstateMLModel()

# Дані для оцінки
property_data = {
    'city': 'Харків',
    'district': 'Центр',
    'area_total': 60.0,
    'rooms': 2,
    'floor': 3,
    'total_floors': 9,
    'building_type': 'brick',
    'condition': 'good',
    'heating': 'central',
    'has_balcony': True,
    'has_elevator': True
}

# Прогнозування ціни
result = model.predict_price(property_data)
print(f"Оцінена вартість: {result['predicted_price']} грн")
print(f"Модель: {result['model_used']}")
```

### Навчання моделей

```python
from ml_model import prepare_training_data

# Підготовка даних
df = prepare_training_data('path/to/your/data.csv')

# Навчання моделей
results = model.train_models(df)
print(f"Найкраща модель: {results['best_model']}")
```

## Залежності

### Обов'язкові
- `pandas` - для роботи з даними
- `numpy` - для математичних операцій

### Опціональні (для повної функціональності)
- `scikit-learn` - для алгоритмів машинного навчання
- `joblib` - для збереження моделей

## Режими роботи

### 1. З sklearn (повна функціональність)

Якщо `scikit-learn` встановлено:
- Використовуються всі алгоритми ML
- Автоматична обробка категоріальних змінних
- Стандартизація числових ознак
- Можливість навчання та збереження моделей

### 2. Без sklearn (базова функціональність)

Якщо `scikit-learn` не встановлено:
- Використовується тільки проста формула оцінки
- Базові математичні операції
- Обмежена функціональність, але сервер працює

## Встановлення залежностей

Для повної функціональності ML моделей запустіть:

```bash
cd backend
python install_ml_dependencies.py
```

Або вручну:

```bash
pip install scikit-learn pandas numpy joblib
```

## Ознаки моделі

### Вхідні ознаки
- `area_total` - загальна площа (м²)
- `rooms` - кількість кімнат
- `floor` - поверх
- `total_floors` - загальна кількість поверхів
- `year_built` - рік побудови
- `city` - місто
- `district` - район
- `building_type` - тип будинку
- `condition` - стан квартири
- `heating` - тип опалення
- `has_balcony` - наявність балкону
- `has_elevator` - наявність ліфту

### Створені ознаки
- `price_per_sqm` - ціна за м²
- `room_density` - щільність кімнат
- `floor_ratio` - співвідношення поверху
- `is_first_floor` - чи перший поверх
- `is_last_floor` - чи останній поверх

## Проста формула оцінки

Якщо ML моделі недоступні, використовується проста формула:

```
ціна = площа × базова_ціна_за_м² × множник_стану × множник_типу_будинку
```

### Базові ціни за містами (за м²)
- Київ: 2500 грн
- Харків: 1200 грн
- Львів: 1800 грн
- Одеса: 1600 грн
- Дніпро: 1400 грн

### Множники стану
- Відмінний: 1.3
- Добрий: 1.1
- Задовільний: 1.0
- Поганий: 0.8

### Множники типу будинку
- Цегляний: 1.2
- Монолітний: 1.1
- Панельний: 1.0
- Дерев'яний: 0.9

## Конфігурація

Моделі зберігаються в директорії `models/` та автоматично завантажуються при запуску сервера.

## Приклад використання в API

```python
# У main.py
ml_model = RealEstateMLModel()

# Прогнозування в ендпоінті
@app.get("/properties/{property_id}/valuation")
async def get_valuation(property_id: str):
    # ... код отримання даних ...

    # Оцінка за допомогою ML моделі
    ml_prediction = ml_model.predict_price(property_data)

    if 'predicted_price' in ml_prediction:
        estimated_value = int(ml_prediction['predicted_price'])
        confidence = ml_prediction.get('confidence', 0.7)
        model_used = ml_prediction.get('model_used', 'ml')
    else:
        # Fallback на просту оцінку
        estimated_value = int(72000)  # 60м² * 1200 грн/м²
        confidence = 0.6
        model_used = 'simple'

    # ... решта коду ...
```

## Моніторинг та логування

Модуль використовує стандартне логування Python. Всі операції з моделями логуються з рівнем INFO та ERROR.

## Розширення

Для додавання нових алгоритмів:

1. Додайте імпорт в опціональну секцію
2. Додайте модель в словник `models` в методі `train_models()`
3. Додайте логіку завантаження в `load_models()`
