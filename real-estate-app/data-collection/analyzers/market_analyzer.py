"""
Аналізатор статистики ринку нерухомості
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from database import DatabaseManager
from models import PropertyListing, City, District, MarketStats

logger = logging.getLogger(__name__)

class MarketAnalyzer:
    """Аналізатор статистики ринку нерухомості"""

    def __init__(self, db: DatabaseManager):
        self.db = db

    def calculate_city_stats(self, city_name: str, start_date: datetime, end_date: datetime) -> Optional[Dict]:
        """Розраховує статистику для міста за період"""
        with self.db.get_session() as session:
            # Отримуємо ID міста
            city = session.query(City).filter_by(name=city_name).first()
            if not city:
                logger.warning(f"Місто '{city_name}' не знайдено")
                return None

            # Отримуємо оголошення за період
            listings = session.query(PropertyListing).filter(
                and_(
                    PropertyListing.city_id == city.id,
                    PropertyListing.is_active == True,
                    PropertyListing.created_at.between(start_date, end_date)
                )
            ).all()

            if not listings:
                logger.warning(f"Немає даних для міста '{city_name}' за вказаний період")
                return None

            # Перетворюємо в DataFrame для аналізу
            df = pd.DataFrame([
                {
                    'price_uah': listing.price_uah,
                    'area_total': listing.area_total,
                    'rooms': listing.rooms,
                    'floor': listing.floor,
                    'district_id': listing.district_id,
                    'building_type': listing.building_type,
                    'condition': listing.condition
                }
                for listing in listings
                if listing.price_uah > 0 and listing.area_total > 0
            ])

            if df.empty:
                return None

            # Розраховуємо статистику
            stats = {
                'city_id': city.id,
                'total_listings': len(df),
                'average_price_per_sqm': float(df['price_uah'].sum() / df['area_total'].sum()),
                'median_price_per_sqm': float(df['price_uah'].divide(df['area_total']).median()),
                'average_area': float(df['area_total'].mean()),
                'price_change_percent': self._calculate_price_change(city.id, start_date, end_date, session),
                'demand_level': self._calculate_demand_level(len(df), city.population or 100000)
            }

            # Статистика по кімнатах
            room_stats = self._calculate_room_stats(df)
            stats.update(room_stats)

            return stats

    def _calculate_price_change(self, city_id: str, start_date: datetime, end_date: datetime, session: Session) -> float:
        """Розраховує зміну ціни за місяць"""
        # Отримуємо статистику за попередній місяць
        prev_month_start = start_date - timedelta(days=30)
        prev_month_end = start_date

        current_stats = session.query(MarketStats).filter(
            and_(
                MarketStats.city_id == city_id,
                MarketStats.date.between(start_date.date(), end_date.date())
            )
        ).first()

        prev_stats = session.query(MarketStats).filter(
            and_(
                MarketStats.city_id == city_id,
                MarketStats.date.between(prev_month_start.date(), prev_month_end.date())
            )
        ).first()

        if current_stats and prev_stats and prev_stats.average_price_per_sqm > 0:
            return ((current_stats.average_price_per_sqm - prev_stats.average_price_per_sqm)
                   / prev_stats.average_price_per_sqm) * 100

        return 0.0

    def _calculate_demand_level(self, listings_count: int, population: int) -> str:
        """Визначає рівень попиту"""
        listings_per_1000 = (listings_count / population) * 1000

        if listings_per_1000 > 5:
            return 'high'
        elif listings_per_1000 > 2:
            return 'medium'
        else:
            return 'low'

    def _calculate_room_stats(self, df: pd.DataFrame) -> Dict:
        """Розраховує статистику по кількості кімнат"""
        stats = {}

        for rooms in [1, 2, 3, 4]:
            room_df = df[df['rooms'] == rooms]
            if not room_df.empty:
                avg_price = room_df['price_uah'].divide(room_df['area_total']).mean()
                stats[f'avg_price_{rooms}_room'] = float(avg_price) if not pd.isna(avg_price) else 0.0

        return stats

    def get_top_districts_by_price(self, city_name: str, limit: int = 10) -> List[Dict]:
        """Отримує топ районів за ціною за м²"""
        with self.db.get_session() as session:
            city = session.query(City).filter_by(name=city_name).first()
            if not city:
                return []

            # Отримуємо статистику районів за останній місяць
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)

            stats = session.query(
                District.name,
                func.avg(PropertyListing.price_uah / PropertyListing.area_total).label('avg_price_per_sqm'),
                func.count(PropertyListing.id).label('listings_count')
            ).join(
                PropertyListing, District.id == PropertyListing.district_id
            ).filter(
                and_(
                    PropertyListing.city_id == city.id,
                    PropertyListing.is_active == True,
                    PropertyListing.created_at.between(start_date, end_date),
                    PropertyListing.area_total > 0,
                    PropertyListing.price_uah > 0
                )
            ).group_by(
                District.id, District.name
            ).order_by(
                desc('avg_price_per_sqm')
            ).limit(limit).all()

            return [
                {
                    'district': stat.name,
                    'avg_price_per_sqm': float(stat.avg_price_per_sqm),
                    'listings_count': stat.listings_count
                }
                for stat in stats
            ]

    def get_price_trends(self, city_name: str, months: int = 6) -> List[Dict]:
        """Отримує тренди цін за останні місяці"""
        with self.db.get_session() as session:
            city = session.query(City).filter_by(name=city_name).first()
            if not city:
                return []

            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=months * 30)

            trends = session.query(
                MarketStats.date,
                MarketStats.average_price_per_sqm,
                MarketStats.total_listings
            ).filter(
                and_(
                    MarketStats.city_id == city.id,
                    MarketStats.date.between(start_date.date(), end_date.date())
                )
            ).order_by(MarketStats.date).all()

            return [
                {
                    'date': trend.date.isoformat(),
                    'avg_price_per_sqm': float(trend.average_price_per_sqm) if trend.average_price_per_sqm else 0,
                    'total_listings': trend.total_listings
                }
                for trend in trends
            ]

    def predict_price(self, city_name: str, area: float, rooms: int, district: str = None) -> Dict:
        """Передбачає ціну на основі історичних даних"""
        with self.db.get_session() as session:
            city = session.query(City).filter_by(name=city_name).first()
            if not city:
                return {'error': 'Місто не знайдено'}

            # Базуємо на середній ціні за м²
            base_price_per_sqm = city.average_price_per_sqm or 1000

            # Отримуємо оголошення для навчання моделі
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=90)  # 3 місяці

            listings = session.query(PropertyListing).filter(
                and_(
                    PropertyListing.city_id == city.id,
                    PropertyListing.is_active == True,
                    PropertyListing.created_at.between(start_date, end_date),
                    PropertyListing.area_total > 0,
                    PropertyListing.price_uah > 0
                )
            ).all()

            if len(listings) < 10:
                # Недостатньо даних, використовуємо просту модель
                estimated_price = area * base_price_per_sqm
                return {
                    'estimated_price': int(estimated_price),
                    'price_range': {
                        'min': int(estimated_price * 0.85),
                        'max': int(estimated_price * 1.15)
                    },
                    'confidence': 0.5,
                    'method': 'simple_average'
                }

            # Створюємо DataFrame для аналізу
            df = pd.DataFrame([
                {
                    'area': listing.area_total,
                    'rooms': listing.rooms,
                    'price_per_sqm': listing.price_uah / listing.area_total,
                    'district': listing.district.name if listing.district else 'unknown'
                }
                for listing in listings
            ])

            # Проста модель на основі схожих оголошень
            similar_listings = df[
                (df['rooms'] == rooms) &
                (df['area'].between(area * 0.8, area * 1.2))
            ]

            if not similar_listings.empty:
                avg_price_per_sqm = similar_listings['price_per_sqm'].mean()
                std_price_per_sqm = similar_listings['price_per_sqm'].std()

                estimated_price = area * avg_price_per_sqm

                return {
                    'estimated_price': int(estimated_price),
                    'price_range': {
                        'min': int((avg_price_per_sqm - std_price_per_sqm) * area),
                        'max': int((avg_price_per_sqm + std_price_per_sqm) * area)
                    },
                    'confidence': 0.8,
                    'method': 'similar_properties',
                    'similar_count': len(similar_listings)
                }
            else:
                # Використовуємо загальну статистику по кімнатах
                room_avg = df[df['rooms'] == rooms]['price_per_sqm'].mean()
                if not pd.isna(room_avg):
                    estimated_price = area * room_avg
                    return {
                        'estimated_price': int(estimated_price),
                        'price_range': {
                            'min': int(estimated_price * 0.8),
                            'max': int(estimated_price * 1.2)
                        },
                        'confidence': 0.6,
                        'method': 'room_average'
                    }

                # Повертаємося до базової ціни
                estimated_price = area * base_price_per_sqm
                return {
                    'estimated_price': int(estimated_price),
                    'price_range': {
                        'min': int(estimated_price * 0.7),
                        'max': int(estimated_price * 1.3)
                    },
                    'confidence': 0.4,
                    'method': 'city_average'
                }

    def get_market_insights(self, city_name: str) -> Dict:
        """Отримує інсайти про ринок нерухомості"""
        city_stats = self.calculate_city_stats(
            city_name,
            datetime.utcnow() - timedelta(days=30),
            datetime.utcnow()
        )

        if not city_stats:
            return {'error': 'Недостатньо даних'}

        top_districts = self.get_top_districts_by_price(city_name, 5)
        price_trends = self.get_price_trends(city_name, 3)

        # Аналіз трендів
        insights = {
            'city': city_name,
            'current_avg_price': city_stats['average_price_per_sqm'],
            'demand_level': city_stats['demand_level'],
            'total_listings': city_stats['total_listings'],
            'top_districts': top_districts,
            'price_trends': price_trends,
            'recommendations': self._generate_recommendations(city_stats, top_districts)
        }

        return insights

    def _generate_recommendations(self, city_stats: Dict, top_districts: List[Dict]) -> List[str]:
        """Генерує рекомендації на основі даних"""
        recommendations = []

        avg_price = city_stats['average_price_per_sqm']
        demand = city_stats['demand_level']

        if demand == 'high':
            recommendations.append("Високий попит на нерухомість - хороший час для продажу")
        elif demand == 'low':
            recommendations.append("Низький попит - можливо варто почекати з продажем")

        if top_districts:
            cheapest_district = min(top_districts, key=lambda x: x['avg_price_per_sqm'])
            expensive_district = max(top_districts, key=lambda x: x['avg_price_per_sqm'])

            recommendations.append(
                f"Найдешевший район: {cheapest_district['district']} "
                f"({cheapest_district['avg_price_per_sqm']:.0f} грн/м²)"
            )
            recommendations.append(
                f"Найдорожчий район: {expensive_district['district']} "
                f"({expensive_district['avg_price_per_sqm']:.0f} грн/м²)"
            )

        return recommendations
