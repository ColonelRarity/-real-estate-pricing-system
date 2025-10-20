from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class City(Base):
    """Модель міста з типізацією LUN"""
    __tablename__ = "cities"

    id = Column(String, primary_key=True)  # КОАТУУ код
    name = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    average_price_per_sqm = Column(Float)
    population = Column(Integer)
    is_regional_center = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Зв'язок з районами
    districts = relationship("District", back_populates="city")

    def __repr__(self):
        return f"<City(id='{self.id}', name='{self.name}')>"

class District(Base):
    """Модель району/мікрорайону"""
    __tablename__ = "districts"

    id = Column(String, primary_key=True)  # КОАТУУ код
    city_id = Column(String, ForeignKey('cities.id'), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # 'district', 'microdistrict', 'neighborhood'
    latitude = Column(Float)
    longitude = Column(Float)
    average_price_per_sqm = Column(Float)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Зв'язок з містом
    city = relationship("City", back_populates="districts")

    # Індекси для швидкого пошуку
    __table_args__ = (
        Index('idx_districts_city_name', 'city_id', 'name'),
        Index('idx_districts_coordinates', 'latitude', 'longitude'),
    )

    def __repr__(self):
        return f"<District(id='{self.id}', name='{self.name}', city='{self.city.name}')>"

class PropertyListing(Base):
    """Модель оголошення про нерухомість"""
    __tablename__ = "property_listings"

    id = Column(String, primary_key=True)
    external_id = Column(String, unique=True, index=True)  # ID з сайту-джерела
    source = Column(String(50), nullable=False, index=True)  # 'olx', 'dom_ria', 'rielter', etc.

    # Основна інформація
    title = Column(Text, nullable=False)
    description = Column(Text)

    # Локація
    city_id = Column(String, ForeignKey('cities.id'), nullable=False)
    district_id = Column(String, ForeignKey('districts.id'))
    address = Column(String(255))  # Коротка адреса (вулиця, номер будинку)
    full_address = Column(String(500))  # Повна адреса для геокодування
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)

    # Параметри квартири
    price_uah = Column(Integer, nullable=False, index=True)
    price_usd = Column(Integer, index=True)
    area_total = Column(Float, nullable=False, index=True)
    area_living = Column(Float)
    area_kitchen = Column(Float)
    rooms = Column(Integer, nullable=False, index=True)
    floor = Column(Integer, index=True)
    total_floors = Column(Integer, index=True)

    # Характеристики
    building_type = Column(String(50))  # 'brick', 'panel', 'monolithic', 'wood'
    building_series = Column(String(100))  # серія будинку (для панельних)
    developer = Column(String(200))  # забудовник/компанія
    year_built = Column(Integer)
    condition = Column(String(50))  # 'excellent', 'good', 'fair', 'poor'
    has_balcony = Column(Boolean, default=False)
    has_elevator = Column(Boolean, default=False)
    heating = Column(String(50))  # 'central', 'individual', 'none'

    # Додаткові фактори для оцінки
    floor_category = Column(String(20))  # 'low', 'middle', 'high'
    distance_to_center = Column(Float)  # відстань до центру міста в км
    price_per_sqm = Column(Float)  # ціна за м² (обчислюється автоматично)
    days_on_market = Column(Integer, default=0)  # днів на ринку

    # Додаткова інформація
    images = Column(Text)  # JSON список URL зображень
    url = Column(String(500), nullable=False)  # Посилання на оголошення
    contact_phone = Column(String(20))
    contact_name = Column(String(100))

    # Метадані
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)

    # Зв'язки
    city = relationship("City", foreign_keys=[city_id])
    district = relationship("District", foreign_keys=[district_id])

    # Індекси для швидкого пошуку
    __table_args__ = (
        Index('idx_listings_price_area', 'price_uah', 'area_total'),
        Index('idx_listings_location', 'city_id', 'district_id'),
        Index('idx_listings_rooms_floor', 'rooms', 'floor'),
        Index('idx_listings_coordinates', 'latitude', 'longitude'),
        Index('idx_listings_building', 'building_type', 'year_built'),
        Index('idx_listings_developer', 'developer'),
        Index('idx_listings_condition', 'condition'),
        Index('idx_listings_price_per_sqm', 'price_per_sqm'),
    )

    def __repr__(self):
        return f"<PropertyListing(id='{self.id}', price={self.price_uah}, city='{self.city.name}')>"

    def to_dict(self):
        """Перетворює модель в словник для API"""
        return {
            'id': self.id,
            'external_id': self.external_id,
            'source': self.source,
            'title': self.title,
            'description': self.description,
            'city': self.city.name if self.city else None,
            'district': self.district.name if self.district else None,
            'address': self.address,
            'full_address': self.full_address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'price_uah': self.price_uah,
            'price_usd': self.price_usd,
            'area_total': self.area_total,
            'area_living': self.area_living,
            'area_kitchen': self.area_kitchen,
            'rooms': self.rooms,
            'floor': self.floor,
            'total_floors': self.total_floors,
            'building_type': self.building_type,
            'building_series': self.building_series,
            'developer': self.developer,
            'year_built': self.year_built,
            'condition': self.condition,
            'has_balcony': self.has_balcony,
            'has_elevator': self.has_elevator,
            'heating': self.heating,
            'floor_category': self.floor_category,
            'distance_to_center': self.distance_to_center,
            'price_per_sqm': self.price_per_sqm,
            'days_on_market': self.days_on_market,
            'images': json.loads(self.images) if self.images else [],
            'url': self.url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def calculate_price_per_sqm(self):
        """Обчислює ціну за м²"""
        if self.area_total and self.area_total > 0:
            self.price_per_sqm = self.price_uah / self.area_total
            return self.price_per_sqm
        return None

    def categorize_floor(self):
        """Визначає категорію поверху"""
        if not self.floor or not self.total_floors:
            return None

        floor_ratio = self.floor / self.total_floors

        if floor_ratio <= 0.33:
            self.floor_category = 'low'
        elif floor_ratio <= 0.67:
            self.floor_category = 'middle'
        else:
            self.floor_category = 'high'

        return self.floor_category

    def calculate_distance_to_center(self, center_lat, center_lon):
        """Обчислює відстань до центру міста"""
        if not self.latitude or not self.longitude:
            return None

        # Проста евклідова відстань (можна замінити на геодезичну)
        distance = ((self.latitude - center_lat) ** 2 + (self.longitude - center_lon) ** 2) ** 0.5
        self.distance_to_center = distance * 111  # приблизно км
        return self.distance_to_center

class MarketStats(Base):
    """Модель статистики ринку нерухомості"""
    __tablename__ = "market_stats"

    id = Column(Integer, primary_key=True)
    city_id = Column(String, ForeignKey('cities.id'), nullable=False)
    district_id = Column(String, ForeignKey('districts.id'))
    date = Column(DateTime, nullable=False, index=True)

    # Статистика
    total_listings = Column(Integer, default=0)
    average_price_per_sqm = Column(Float)
    median_price_per_sqm = Column(Float)
    price_change_percent = Column(Float)  # Зміна ціни за місяць
    average_area = Column(Float)
    demand_level = Column(String(20))  # 'high', 'medium', 'low'

    # Деталі по кімнатах
    avg_price_1_room = Column(Float)
    avg_price_2_room = Column(Float)
    avg_price_3_room = Column(Float)
    avg_price_4_plus_room = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Зв'язки
    city = relationship("City", foreign_keys=[city_id])
    district = relationship("District", foreign_keys=[district_id])

    # Індекси
    __table_args__ = (
        Index('idx_stats_city_date', 'city_id', 'date'),
        Index('idx_stats_district_date', 'district_id', 'date'),
    )

    def __repr__(self):
        return f"<MarketStats(city='{self.city.name}', date='{self.date.date()}', avg_price={self.average_price_per_sqm})>"

