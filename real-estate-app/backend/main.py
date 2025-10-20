"""
FastAPI сервер для системи оцінки нерухомості
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime

# Імпортуємо наші модулі
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))

from database import DatabaseManager
from location_types.location import KHARKIV_CITY, getAllDistricts, getDistrictsForKharkiv
from ml_model import RealEstateMLModel
from knn_valuation import KNNValuator
from notifications import router as notifications_router

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Створюємо додаток FastAPI
app = FastAPI(
    title="Real Estate API",
    description="API для оцінки вартості нерухомості в Україні",
    version="1.0.0",
)

# Додаємо маршрути сповіщень
app.include_router(notifications_router)

# Налаштування CORS для мобільного додатку
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшені вказати конкретні домени
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ініціалізуємо менеджер бази даних
db_manager = DatabaseManager()

# Ініціалізуємо ML модель для оцінки вартості (fallback)
ml_model = RealEstateMLModel()

# Ініціалізуємо KNN валюатор для оцінки на основі реальних даних
# Використовуємо спрощену версію, яка працює без геодезичних функцій БД
from knn_valuation_simple import SimpleKNNValuator
knn_valuator = SimpleKNNValuator(db_manager, k=15)

# Спробуємо завантажити навчену модель
if not ml_model.load_models():
    logger.warning("Не вдалося завантажити ML модель, використовую просту оцінку")

# Pydantic моделі для API
class PropertyData(BaseModel):
    """Модель даних про нерухомість для API"""
    city: str = Field(..., description="Назва міста")
    district: str = Field(..., description="Назва району")
    address: str = Field(..., description="Адреса")
    area: float = Field(..., gt=0, description="Площа в м²")
    rooms: int = Field(..., gt=0, description="Кількість кімнат")
    floor: int = Field(..., ge=1, description="Поверх")
    total_floors: int = Field(..., ge=1, description="Загальна кількість поверхів")
    building_type: str = Field(..., description="Тип будинку")
    condition: str = Field(..., description="Стан квартири")
    has_balcony: bool = Field(default=False, description="Наявність балкону")
    has_elevator: bool = Field(default=False, description="Наявність ліфту")
    heating: str = Field(default="central", description="Тип опалення")

class PropertyValuation(BaseModel):
    """Модель оцінки вартості нерухомості"""
    property_id: str
    estimated_value: int
    price_range: Dict[str, int]
    confidence: float
    factors: Dict[str, float]
    comparable_properties: List[Dict[str, Any]]
    market_trends: Dict[str, Any]

class MarketInsights(BaseModel):
    """Модель інсайтів про ринок"""
    city: str
    current_avg_price: float
    demand_level: str
    total_listings: int
    top_districts: List[Dict[str, Any]]
    price_trends: List[Dict[str, Any]]
    recommendations: List[str]

# Залежності
def get_db():
    """Залежність для отримання сесії бази даних"""
    return db_manager.get_session_direct()

# API ендпоінти
@app.get("/")
async def root():
    """Кореневий ендпоінт"""
    return {
        "message": "Real Estate API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Перевірка здоров'я сервісу"""
    try:
        stats = db_manager.get_stats_summary()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/cities")
async def get_cities():
    """Отримує список міст (тільки Харків для MVP)"""
    try:
        cities = [KHARKIV_CITY.name]
        return {"cities": cities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting cities: {str(e)}")

@app.get("/cities/{city_name}/districts")
async def get_districts(city_name: str):
    """Отримує райони для міста"""
    try:
        if city_name.lower() == 'харків':
            districts = getAllDistricts()
            return {"districts": districts}
        else:
            raise HTTPException(status_code=404, detail="Місто не підтримується")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting districts: {str(e)}")

@app.post("/properties")
async def save_property(property_data: PropertyData):
    """Зберігає дані про нерухомість"""
    try:
        # Генеруємо ID для нерухомості
        property_id = f"prop_{int(datetime.utcnow().timestamp())}_{hash(property_data.city) % 10000}"

        # Зберігаємо в базу даних (тут спрощено, в реальності через сервіс)
        # Для демонстрації повертаємо згенерований ID
        return {
            "property_id": property_id,
            "message": "Дані збережено успішно"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving property: {str(e)}")

@app.get("/properties/{property_id}/valuation")
async def get_valuation(property_id: str):
    """Отримує оцінку вартості нерухомості"""
    try:
        # Отримуємо дані про нерухомість з бази (спрощено)
        # В реальності тут буде запит до бази даних

        # Для демонстрації створюємо тестові дані
        # В реальному проекті тут буде запит до бази даних

        # Створюємо словник з характеристиками для оцінки
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

        # Спочатку пробуємо KNN оцінку на основі реальних даних
        knn_result = knn_valuator.estimate_price_simple(property_data, k=15)

        if knn_result.get('estimated_price') and knn_result.get('similar_properties_count', 0) >= 3:
            # KNN оцінка успішна
            estimated_value = knn_result['estimated_price']
            confidence = knn_result['confidence']
            model_used = knn_result['method']
            price_range = knn_result['price_range']

            # Отримуємо деталі схожих об'єктів
            comparable_properties = knn_result.get('similar_properties', [])

            # Отримуємо статистику ринку
            market_stats = knn_valuator.get_market_stats(
                city=property_data.get('city'),
                district=property_data.get('district')
            )

            return {
                "property_id": property_id,
                "estimated_value": estimated_value,
                "price_range": price_range,
                "confidence": confidence,
                "model_used": model_used,
                "similar_properties_count": knn_result['similar_properties_count'],
                "avg_similarity": knn_result.get('avg_similarity', 0),
                "comparable_properties": comparable_properties[:5],  # Показуємо топ-5
                "market_trends": market_stats or {
                    "average_price_per_sqm": KHARKIV_CITY.averagePricePerSqm,
                    "price_change_last_month": 2.5,
                    "demand_level": "medium"
                }
            }
        else:
            # Fallback на ML модель або просту оцінку
            logger.info("KNN оцінка недоступна, використовую ML модель")

            ml_prediction = ml_model.predict_price(property_data)

            if 'predicted_price' in ml_prediction:
                estimated_value = int(ml_prediction['predicted_price'])
                confidence = ml_prediction.get('confidence', 0.7)
                model_used = ml_prediction.get('model_used', 'ml')
            else:
                # Останній fallback на просту оцінку
                estimated_value = int(72000)  # 60м² * 1200 грн/м²
                confidence = 0.6
                model_used = 'simple'

            price_range = {
                'min': int(estimated_value * 0.85),
                'max': int(estimated_value * 1.15)
            }

            return {
                "property_id": property_id,
                "estimated_value": estimated_value,
                "price_range": price_range,
                "confidence": confidence,
                "model_used": model_used,
                "comparable_properties": [],
                "market_trends": {
                    "average_price_per_sqm": KHARKIV_CITY.averagePricePerSqm,
                    "price_change_last_month": 2.5,
                    "demand_level": "medium"
                }
            }
    except Exception as e:
        logger.error(f"Error getting valuation: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting valuation: {str(e)}")

@app.get("/market/stats")
async def get_market_stats(
    city: str = Query(..., description="Назва міста"),
    district: Optional[str] = Query(None, description="Назва району")
):
    """Отримує статистику ринку"""
    try:
        if city.lower() != 'харків':
            raise HTTPException(status_code=404, detail="Місто не підтримується")

        # Повертаємо базову статистику для Харкова
        return {
            "city": "Харків",
            "current_avg_price": KHARKIV_CITY.averagePricePerSqm,
            "demand_level": "medium",
            "total_listings": 1000,  # Заглушка
            "top_districts": [
                {"district": "Центр", "avg_price_per_sqm": 1400},
                {"district": "Олексіївка", "avg_price_per_sqm": 1300},
                {"district": "Шевченківський", "avg_price_per_sqm": 1250},
                {"district": "Салтівка", "avg_price_per_sqm": 850},
                {"district": "Немишлянський", "avg_price_per_sqm": 1050}
            ],
            "price_trends": [
                {"date": "2024-01-01", "avg_price_per_sqm": 1150},
                {"date": "2024-02-01", "avg_price_per_sqm": 1180},
                {"date": "2024-03-01", "avg_price_per_sqm": 1200}
            ],
            "recommendations": [
                "Високий попит на нерухомість в центрі",
                "Салтівка - найдешевший район для покупки",
                "Олексіївка - престижний район з новобудовами"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market stats: {str(e)}")

@app.get("/market/trends")
async def get_price_trends(
    city: str = Query(..., description="Назва міста"),
    months: int = Query(6, description="Кількість місяців")
):
    """Отримує тренди цін"""
    try:
        if city.lower() != 'харків':
            raise HTTPException(status_code=404, detail="Місто не підтримується")

        # Повертаємо базові тренди
        return {
            "trends": [
                {"date": "2024-01-01", "avg_price_per_sqm": 1150, "total_listings": 850},
                {"date": "2024-02-01", "avg_price_per_sqm": 1180, "total_listings": 920},
                {"date": "2024-03-01", "avg_price_per_sqm": 1200, "total_listings": 980}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting price trends: {str(e)}")

@app.get("/properties/search")
async def search_properties(
    city: str = Query(..., description="Назва міста"),
    district: Optional[str] = Query(None, description="Назва району"),
    limit: int = Query(50, description="Ліміт результатів")
):
    """Шукає оголошення про нерухомість"""
    try:
        # Отримуємо останні оголошення з бази даних (SQLite)
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))
        from models import PropertyListing, City as CityModel

        with db_manager.get_session() as session:
            city_obj = session.query(CityModel).filter_by(name=city).first()
            if not city_obj:
                return {"properties": []}

            listings = session.query(PropertyListing).filter(
                PropertyListing.city_id == city_obj.id,
                PropertyListing.is_active == True
            ).order_by(PropertyListing.created_at.desc()).limit(limit).all()

            return {
                "properties": [
                    {
                        "id": listing.id,
                        "title": listing.title,
                        "price_uah": listing.price_uah,
                        "area_total": listing.area_total,
                        "rooms": listing.rooms,
                        "address": listing.address,
                        "url": listing.url
                    }
                    for listing in listings
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching properties: {str(e)}")

@app.post("/admin/scrape")
async def trigger_scraping(
    cities: List[str] = None,
    sources: List[str] = None,
    pages: int = 2
):
    """Запускає процес збору даних (тільки для адмінів)"""
    try:
        if cities is None:
            cities = ['Київ', 'Харків', 'Одеса']

        if sources is None:
            sources = ['olx', 'dom_ria', 'realt', 'address']

        # Імпортуємо та запускаємо збір даних
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))
        from main_scraper import DataCollector

        collector = DataCollector()
        data = collector.collect_data(cities, sources, pages)

        return {
            "message": "Збір даних запущено",
            "cities": cities,
            "sources": sources,
            "total_listings": sum(len(listings) for city_listings in data.values()
                               for listings in city_listings.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering scraping: {str(e)}")

@app.get("/admin/stats")
async def get_admin_stats():
    """Отримує статистику для адмін панелі"""
    try:
        stats = db_manager.get_stats_summary()

        # Повертаємо базову статистику для MVP
        return {
            **stats,
            'recent_listings_24h': 0,
            'active_sources': ['olx', 'dom_ria', 'realt', 'address'],
            'note': 'Для MVP використовується симуляція'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting admin stats: {str(e)}")


@app.post("/properties/add")
async def add_property(property_data: PropertyData):
    """Додає нове оголошення в базу даних для покращення точності оцінки"""
    try:
        # Генеруємо ID для нерухомості
        property_id = f"prop_{int(datetime.utcnow().timestamp())}_{hash(property_data.city) % 10000}"

        # Отримуємо або створюємо місто та район
        with db_manager.get_session() as session:
            city_obj = session.query(City).filter_by(name=property_data.city).first()
            if not city_obj:
                city_obj = City(
                    id=f"city_{hash(property_data.city) % 10000}",
                    name=property_data.city,
                    region="Україна",  # Можна покращити
                    coordinates={"latitude": 50.0, "longitude": 30.0},  # Заглушка
                    average_price_per_sqm=1200  # Заглушка
                )
                session.add(city_obj)
                session.commit()

            district_obj = None
            if property_data.district:
                district_obj = session.query(District).filter_by(
                    name=property_data.district,
                    city_id=city_obj.id
                ).first()
                if not district_obj:
                    district_obj = District(
                        id=f"dist_{hash(property_data.district) % 10000}",
                        city_id=city_obj.id,
                        name=property_data.district,
                        type="district"
                    )
                    session.add(district_obj)
                    session.commit()

        # Створюємо запис в PropertyListing
        from models import PropertyListing

        new_listing = PropertyListing(
            id=property_id,
            title=f"Квартира {property_data.area}м², {property_data.rooms}к, {property_data.city}",
            city_id=city_obj.id,
            district_id=district_obj.id if district_obj else None,
            address="",  # Можна додати поле адреси в PropertyData
            area_total=property_data.area,
            rooms=property_data.rooms,
            floor=property_data.floor,
            total_floors=property_data.total_floors,
            building_type=property_data.building_type,
            condition=property_data.condition,
            has_balcony=property_data.has_balcony,
            has_elevator=property_data.has_elevator,
            heating=property_data.heating,
            price_uah=0,  # Ціна буде додана окремо
            is_active=True
        )

        # Обчислюємо додаткові поля
        new_listing.calculate_price_per_sqm()
        new_listing.categorize_floor()

        with db_manager.get_session() as session:
            session.add(new_listing)
            session.commit()

        return {
            "property_id": property_id,
            "message": "Оголошення додано успішно",
            "note": "Для точної оцінки додайте реальну ціну через /properties/{id}/price"
        }

    except Exception as e:
        logger.error(f"Error adding property: {e}")
        raise HTTPException(status_code=500, detail=f"Error adding property: {str(e)}")


@app.put("/properties/{property_id}/price")
async def update_property_price(property_id: str, price_data: dict):
    """Оновлює ціну для оголошення"""
    try:
        price_uah = price_data.get('price_uah')
        if not price_uah or price_uah <= 0:
            raise HTTPException(status_code=400, detail="Вкажіть коректну ціну")

        with db_manager.get_session() as session:
            listing = session.query(PropertyListing).filter_by(id=property_id).first()
            if not listing:
                raise HTTPException(status_code=404, detail="Оголошення не знайдено")

            listing.price_uah = price_uah
            listing.calculate_price_per_sqm()
            session.commit()

        return {
            "property_id": property_id,
            "price_uah": price_uah,
            "price_per_sqm": listing.price_per_sqm,
            "message": "Ціна оновлена успішно"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating price: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating price: {str(e)}")


@app.post("/market/update")
async def update_market_data():
    """Запускає оновлення ринкових даних (заглушка для майбутнього функціоналу)"""
    try:
        # В майбутньому тут буде виклик до data-collection модулів
        # для збору актуальних даних з сайтів нерухомості

        return {
            "message": "Оновлення даних запущено",
            "note": "В цій версії використовуйте /properties/add для додавання оголошень вручну"
        }

    except Exception as e:
        logger.error(f"Error updating market data: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating market data: {str(e)}")

if __name__ == "__main__":
    # Створюємо таблиці при запуску
    db_manager.create_tables()
    db_manager.initialize_cities_and_districts()

    # Запускаємо сервер
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
