"""
Модуль для роботи з базою даних
"""

import os
from contextlib import contextmanager
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import logging
from models import PropertyListing, City, District

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Менеджер бази даних"""

    def __init__(self, database_url: str = None):
        if database_url is None:
            database_url = os.getenv('DATABASE_URL', 'sqlite:///real_estate.db')

        self.database_url = database_url

        # Створюємо engine з відповідними налаштуваннями
        if database_url.startswith('sqlite'):
            self.engine = create_engine(
                database_url,
                poolclass=StaticPool,
                connect_args={'check_same_thread': False} if 'sqlite' in database_url else {}
            )
        else:
            self.engine = create_engine(
                database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600
            )

        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        # Тестуємо з'єднання
        try:
            with self.engine.connect() as conn:
                logger.info("Підключення до бази даних встановлено")
        except Exception as e:
            logger.error(f"Помилка підключення до бази даних: {e}")
            raise

    def create_tables(self):
        """Створює таблиці в базі даних"""
        from models import Base

        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Таблиці створено успішно")
        except Exception as e:
            logger.error(f"Помилка при створенні таблиць: {e}")
            raise

    def drop_tables(self):
        """Видаляє всі таблиці (для тестування)"""
        from models import Base

        try:
            Base.metadata.drop_all(bind=self.engine)
            logger.info("Таблиці видалено")
        except Exception as e:
            logger.error(f"Помилка при видаленні таблиць: {e}")
            raise

    @contextmanager
    def get_session(self):
        """Контекстний менеджер для сесій бази даних"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Помилка транзакції: {e}")
            raise
        finally:
            session.close()

    def get_session_direct(self) -> Session:
        """Отримує сесію безпосередньо"""
        return self.SessionLocal()

    def initialize_cities_and_districts(self):
        """Ініціалізує базові дані міст і районів"""
        # UKRAINIAN_CITIES не існує, використовуємо Харків як єдине місто для MVP

        with self.get_session() as session:
            # Додаємо Харків як єдине місто для MVP
            kharkiv_data = {
                'id': '6310400000',
                'name': 'Харків',
                'region': 'Харківська',
                'latitude': 49.9935,
                'longitude': 36.2304,
                'average_price_per_sqm': 1200,
                'population': 1430886,
                'is_regional_center': True
            }

            # Перевіряємо чи існує місто
            city = session.query(City).filter_by(id=kharkiv_data['id']).first()
            if not city:
                city = City(**kharkiv_data)
                session.add(city)
                session.commit()
                logger.info(f"Додано місто: {city.name}")

                # Додаємо райони з location_types
                from location_types.location import KHARKIV_CITY
                for district_data in KHARKIV_CITY.districts:
                    district = District(
                        id=district_data.id,
                        city_id=city.id,
                        name=district_data.name,
                        type=district_data.type,
                        latitude=district_data.coordinates['latitude'] if district_data.coordinates else None,
                        longitude=district_data.coordinates['longitude'] if district_data.coordinates else None,
                        average_price_per_sqm=district_data.average_price_per_sqm,
                        description=district_data.description
                    )
                    session.add(district)
                session.commit()
                logger.info(f"Додано {len(KHARKIV_CITY.districts)} районів для {city.name}")
            else:
                logger.info(f"Місто {city.name} вже існує")

            logger.info("Ініціалізацію міст та районів завершено")

    def get_city_by_name(self, name: str):
        """Отримує місто за назвою"""
        with self.get_session() as session:
            return session.query(City).filter_by(name=name).first()

    def get_district_by_name(self, city_name: str, district_name: str) -> District:
        """Отримує район за назвою міста та району"""
        with self.get_session() as session:
            city = session.query(City).filter_by(name=city_name).first()
            if not city:
                return None

            return session.query(District).filter_by(
                city_id=city.id,
                name=district_name
            ).first()

    def get_stats_summary(self) -> dict:
        """Отримує загальну статистику бази даних"""
        try:
            with self.get_session() as session:
                total_cities = session.query(City).count()
                total_districts = session.query(District).count()
                total_listings = session.query(PropertyListing).filter_by(is_active=True).count()
                total_sources = session.query(PropertyListing.source).distinct().count()

                return {
                    'total_cities': total_cities,
                    'total_districts': total_districts,
                    'total_listings': total_listings,
                    'total_sources': total_sources,
                }
        except Exception as e:
            logger.warning(f"Error getting stats summary: {e}")
            return {
                'total_cities': 0,
                'total_districts': 0,
                'total_listings': 0,
                'total_sources': 0,
            }
