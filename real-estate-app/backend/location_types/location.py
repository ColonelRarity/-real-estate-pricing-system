"""
Location types and data for Kharkiv city real estate
Python equivalents of the TypeScript location definitions
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class District:
    """District data class"""
    id: str  # Код району за LUN (КОАТУУ)
    name: str  # Назва району
    type: str  # 'district' | 'microdistrict' | 'neighborhood'
    coordinates: Optional[Dict[str, float]] = None
    average_price_per_sqm: Optional[float] = None
    description: Optional[str] = None


@dataclass
class City:
    """City data class"""
    id: str  # Код міста за LUN (КОАТУУ)
    name: str  # Назва міста
    region: str  # Область
    coordinates: Dict[str, float]
    districts: List[District]
    average_price_per_sqm: float
    population: Optional[int] = None
    is_regional_center: bool = False


# Дані для Харкова (MVP фокус на одному місті)
KHARKIV_CITY = City(
    id="6310400000",
    name="Харків",
    region="Харківська",
    coordinates={"latitude": 49.9935, "longitude": 36.2304},
    average_price_per_sqm=1200,
    population=1430886,
    is_regional_center=True,
    districts=[
        District(
            id="6310430000",
            name="Основ'янський",
            type="district",
            coordinates={"latitude": 49.9845, "longitude": 36.2428},
            average_price_per_sqm=1150,
            description="Центральний район з історичною забудовою"
        ),
        District(
            id="6310460000",
            name="Слобідський",
            type="district",
            coordinates={"latitude": 49.9750, "longitude": 36.2650},
            average_price_per_sqm=1100,
            description="Промисловий район з доступним житлом"
        ),
        District(
            id="6310490000",
            name="Немишлянський",
            type="district",
            coordinates={"latitude": 49.9650, "longitude": 36.2950},
            average_price_per_sqm=1050,
            description="Район з новобудовами та промисловими зонами"
        ),
        District(
            id="6310520000",
            name="Шевченківський",
            type="district",
            coordinates={"latitude": 50.0050, "longitude": 36.2250},
            average_price_per_sqm=1250,
            description="Престижний район з парками та університетами"
        ),
        District(
            id="6310550000",
            name="Холодногірський",
            type="district",
            coordinates={"latitude": 50.0150, "longitude": 36.2100},
            average_price_per_sqm=1000,
            description="Район з історичною забудовою та транспортними вузлами"
        ),
        District(
            id="6310580000",
            name="Індустріальний",
            type="district",
            coordinates={"latitude": 49.9500, "longitude": 36.3100},
            average_price_per_sqm=950,
            description="Промисловий район з доступним житлом"
        ),
        District(
            id="6310610000",
            name="Київський",
            type="district",
            coordinates={"latitude": 50.0250, "longitude": 36.3400},
            average_price_per_sqm=1300,
            description="Район з новобудовами та хорошою інфраструктурою"
        ),
        District(
            id="6310640000",
            name="Салтівський",
            type="district",
            coordinates={"latitude": 50.0350, "longitude": 36.3000},
            average_price_per_sqm=900,
            description="Найбільший житловий масив Харкова"
        ),
        District(
            id="6310670000",
            name="Новобаварський",
            type="district",
            coordinates={"latitude": 49.9550, "longitude": 36.2000},
            average_price_per_sqm=850,
            description="Район з приватним сектором та промисловими зонами"
        ),
        # Детальні мікрорайони Харкова
        District(
            id="micro_kharkiv_centr",
            name="Центр",
            type="microdistrict",
            coordinates={"latitude": 49.9935, "longitude": 36.2304},
            average_price_per_sqm=1400,
            description="Історичний центр з архітектурними пам'ятками"
        ),
        District(
            id="micro_kharkiv_saltivka",
            name="Салтівка",
            type="microdistrict",
            coordinates={"latitude": 50.0300, "longitude": 36.2950},
            average_price_per_sqm=850,
            description="Найбільший житловий масив з панельною забудовою"
        ),
        District(
            id="micro_kharkiv_oleksiivka",
            name="Олексіївка",
            type="microdistrict",
            coordinates={"latitude": 50.0450, "longitude": 36.2850},
            average_price_per_sqm=1300,
            description="Престижний район з новобудовами та котеджами"
        ),
        District(
            id="micro_kharkiv_kholodna_gora",
            name="Холодна Гора",
            type="microdistrict",
            coordinates={"latitude": 50.0100, "longitude": 36.2050},
            average_price_per_sqm=950,
            description="Район з приватною забудовою та промисловими підприємствами"
        ),
        District(
            id="micro_kharkiv_nova_bavaria",
            name="Нова Баварія",
            type="microdistrict",
            coordinates={"latitude": 49.9450, "longitude": 36.1950},
            average_price_per_sqm=800,
            description="Промисловий район з доступним житлом"
        ),
        District(
            id="micro_kharkiv_pavlove_pole",
            name="Павлове Поле",
            type="microdistrict",
            coordinates={"latitude": 49.9600, "longitude": 36.2450},
            average_price_per_sqm=1000,
            description="Район з сучасною забудовою та торговельними центрами"
        ),
        District(
            id="micro_kharkiv_sortuvannya",
            name="Сортування",
            type="microdistrict",
            coordinates={"latitude": 49.9700, "longitude": 36.2600},
            average_price_per_sqm=900,
            description="Район біля залізничного вокзалу з транспортною доступністю"
        ),
        District(
            id="micro_kharkiv_levada",
            name="Левада",
            type="microdistrict",
            coordinates={"latitude": 49.9850, "longitude": 36.2500},
            average_price_per_sqm=1050,
            description="Район з історичною забудовою та зеленими зонами"
        ),
        District(
            id="micro_kharkiv_zhukovskogo",
            name="Жуковського",
            type="microdistrict",
            coordinates={"latitude": 50.0150, "longitude": 36.2350},
            average_price_per_sqm=1200,
            description="Район з науковими установами та житловою забудовою"
        ),
        District(
            id="micro_kharkiv_derzhprom",
            name="Держпром",
            type="microdistrict",
            coordinates={"latitude": 49.9900, "longitude": 36.2350},
            average_price_per_sqm=1350,
            description="Центральний район з адміністративними будівлями"
        ),
    ]
)


# Допоміжні функції для роботи з геоданими Харкова
def get_kharkiv_city() -> City:
    """Отримати дані про місто Харків"""
    return KHARKIV_CITY


def get_district_by_id(district_id: str) -> Optional[District]:
    """Отримати район за ID"""
    return next((district for district in KHARKIV_CITY.districts if district.id == district_id), None)


def get_all_districts() -> List[str]:
    """Отримати список всіх районів"""
    return [d.name for d in KHARKIV_CITY.districts]


def getAllDistricts() -> List[str]:
    """Аліас для сумісності з мобільною версією"""
    return get_all_districts()


def get_districts_for_kharkiv() -> List[str]:
    """Отримати райони для Харкова"""
    return get_all_districts()


def getDistrictsForKharkiv() -> List[str]:
    """Отримати райони для Харкова (аліас для сумісності з мобільною версією)"""
    return get_all_districts()


def get_kharkiv_coordinates() -> Dict[str, float]:
    """Отримати координати Харкова"""
    return KHARKIV_CITY.coordinates


def get_district_coordinates(district_name: str) -> Optional[Dict[str, float]]:
    """Отримати координати району"""
    district = next((d for d in KHARKIV_CITY.districts if d.name == district_name), None)
    return district.coordinates if district else None


# Сумісність з старим API
def get_all_cities() -> List[str]:
    """Отримати список всіх міст"""
    return [KHARKIV_CITY.name]


def get_districts_for_city(city_name: str) -> List[str]:
    """Отримати райони для міста"""
    if city_name.lower() == 'харків':
        return get_all_districts()
    return []


def get_city_coordinates(city_name: str) -> Optional[Dict[str, float]]:
    """Отримати координати міста"""
    if city_name.lower() == 'харків':
        return KHARKIV_CITY.coordinates
    return None
