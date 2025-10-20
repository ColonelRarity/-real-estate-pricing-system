"""
Модуль для роботи з push-сповіщеннями
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Модель для підписки на сповіщення
class NotificationSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]
    settings: Dict[str, bool]

# Модель для налаштувань сповіщень
class NotificationSettings(BaseModel):
    new_listings: bool = True
    price_changes: bool = True
    market_updates: bool = False
    weekly_digest: bool = False

# Сховище підписок (в реальному проекті - база даних)
subscriptions_db = {}

# Функція для надсилання push-сповіщення
async def send_push_notification(subscription: Dict, payload: Dict) -> bool:
    """
    Надсилає push-сповіщення користувачу
    """
    try:
        # В реальному проекті тут буде інтеграція з web-push бібліотекою
        # Наприклад, pywebpush або aiowebpush

        # Тимчасова симуляція надсилання
        logger.info(f"Надсилаю сповіщення на {subscription['endpoint'][:50]}...")
        logger.info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")

        # Симулюємо успішне надсилання
        await asyncio.sleep(0.1)

        return True

    except Exception as e:
        logger.error(f"Помилка надсилання сповіщення: {e}")
        return False

# Функція для перевірки нових оголошень
async def check_new_listings():
    """Перевіряє наявність нових оголошень для сповіщень"""
    try:
        # В реальному проекті тут буде запит до бази даних
        # для отримання нових оголошень

        # Тимчасова симуляція
        new_listings = [
            {
                "id": "new_123",
                "title": "Нова квартира в центрі",
                "price": 2500000,
                "district": "Центр",
                "url": "https://example.com/listing/123"
            }
        ]

        return new_listings

    except Exception as e:
        logger.error(f"Помилка перевірки нових оголошень: {e}")
        return []

# Фонова задача для надсилання сповіщень
async def send_notification_task(subscription_data: Dict, notification_type: str):
    """Фонова задача для надсилання сповіщень"""

    try:
        subscription = subscription_data['subscription']
        settings = subscription_data['settings']

        # Перевіряємо, чи користувач підписаний на цей тип сповіщень
        if not settings.get(notification_type, False):
            return

        # Створюємо payload сповіщення залежно від типу
        payloads = {
            'new_listings': {
                'title': '🆕 Нові оголошення',
                'body': 'З\'явилися нові оголошення в вашому районі',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
                'data': {
                    'type': 'new_listings',
                    'url': '/map',
                    'timestamp': datetime.utcnow().isoformat()
                }
            },
            'price_changes': {
                'title': '📉 Зміна цін',
                'body': 'Ціни на нерухомість змінилися на 5%',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
                'data': {
                    'type': 'price_changes',
                    'url': '/analytics',
                    'timestamp': datetime.utcnow().isoformat()
                }
            },
            'market_updates': {
                'title': '📊 Оновлення ринку',
                'body': 'Щотижневий звіт про стан ринку нерухомості',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
                'data': {
                    'type': 'market_updates',
                    'url': '/analytics',
                    'timestamp': datetime.utcnow().isoformat()
                }
            },
            'weekly_digest': {
                'title': '📋 Тижневий дайджест',
                'body': 'Підсумок найважливіших змін за тиждень',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
                'data': {
                    'type': 'weekly_digest',
                    'url': '/analytics',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        }

        payload = payloads.get(notification_type)
        if payload:
            success = await send_push_notification(subscription, payload)
            if success:
                logger.info(f"Сповіщення {notification_type} надіслано успішно")
            else:
                logger.error(f"Не вдалося надіслати сповіщення {notification_type}")

    except Exception as e:
        logger.error(f"Помилка в фоновій задачі сповіщень: {e}")

# API ендпоінти

@router.post("/subscribe")
async def subscribe_to_notifications(subscription_data: NotificationSubscription):
    """Підписка на push-сповіщення"""
    try:
        endpoint = subscription_data.endpoint

        # Зберігаємо підписку
        subscriptions_db[endpoint] = {
            'subscription': {
                'endpoint': subscription_data.endpoint,
                'keys': subscription_data.keys
            },
            'settings': subscription_data.settings,
            'subscribed_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Новий підписник: {endpoint[:50]}...")
        return {"message": "Підписка успішна", "status": "subscribed"}

    except Exception as e:
        logger.error(f"Помилка підписки: {e}")
        raise HTTPException(status_code=500, detail="Помилка підписки на сповіщення")

@router.post("/unsubscribe")
async def unsubscribe_from_notifications(data: Dict):
    """Відписка від push-сповіщень"""
    try:
        endpoint = data.get('endpoint')

        if endpoint in subscriptions_db:
            del subscriptions_db[endpoint]
            logger.info(f"Відписано: {endpoint[:50]}...")
            return {"message": "Відписка успішна", "status": "unsubscribed"}
        else:
            raise HTTPException(status_code=404, detail="Підписку не знайдено")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Помилка відписки: {e}")
        raise HTTPException(status_code=500, detail="Помилка відписки від сповіщень")

@router.put("/settings")
async def update_notification_settings(settings: NotificationSettings, endpoint: str = None):
    """Оновлення налаштувань сповіщень"""
    try:
        if endpoint and endpoint in subscriptions_db:
            subscriptions_db[endpoint]['settings'] = settings.dict()
            logger.info(f"Оновлено налаштування для {endpoint[:50]}...")
            return {"message": "Налаштування оновлено", "settings": settings.dict()}
        else:
            raise HTTPException(status_code=404, detail="Підписку не знайдено")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Помилка оновлення налаштувань: {e}")
        raise HTTPException(status_code=500, detail="Помилка оновлення налаштувань")

@router.get("/subscribers")
async def get_subscribers():
    """Отримання списку підписників (тільки для адмінів)"""
    try:
        return {
            "count": len(subscriptions_db),
            "subscribers": list(subscriptions_db.keys())[:10]  # Показуємо перші 10
        }
    except Exception as e:
        logger.error(f"Помилка отримання підписників: {e}")
        raise HTTPException(status_code=500, detail="Помилка отримання підписників")

@router.post("/send-test")
async def send_test_notification(endpoint: str = None):
    """Надсилання тестового сповіщення"""
    try:
        if endpoint and endpoint in subscriptions_db:
            subscription_data = subscriptions_db[endpoint]

            payload = {
                'title': '🧪 Тестове сповіщення',
                'body': 'Сповіщення працюють правильно! 🎉',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
                'data': {
                    'type': 'test',
                    'url': '/',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }

            success = await send_push_notification(subscription_data['subscription'], payload)

            if success:
                return {"message": "Тестове сповіщення надіслано"}
            else:
                raise HTTPException(status_code=500, detail="Не вдалося надіслати тестове сповіщення")
        else:
            raise HTTPException(status_code=404, detail="Підписку не знайдено")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Помилка тестового сповіщення: {e}")
        raise HTTPException(status_code=500, detail="Помилка тестового сповіщення")

@router.post("/broadcast")
async def broadcast_notification(
    notification_type: str,
    background_tasks: BackgroundTasks,
    title: str = None,
    body: str = None
):
    """Розсилка сповіщень всім підписникам"""
    try:
        if not subscriptions_db:
            return {"message": "Немає активних підписників", "sent": 0}

        sent_count = 0

        # Створюємо payload сповіщення
        default_payloads = {
            'new_listings': {
                'title': title or '🆕 Нові оголошення',
                'body': body or 'З\'явилися нові оголошення в вашому районі',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
            },
            'price_changes': {
                'title': title or '📉 Зміна цін',
                'body': body or 'Ціни на нерухомість змінилися',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
            },
            'market_updates': {
                'title': title or '📊 Оновлення ринку',
                'body': body or 'Щотижневий звіт про стан ринку',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
            },
            'weekly_digest': {
                'title': title or '📋 Тижневий дайджест',
                'body': body or 'Підсумок найважливіших змін за тиждень',
                'icon': '/favicon.ico',
                'badge': '/favicon.ico',
            }
        }

        payload = default_payloads.get(notification_type)
        if not payload:
            raise HTTPException(status_code=400, detail="Невідомий тип сповіщення")

        # Додаємо додаткові дані
        payload['data'] = {
            'type': notification_type,
            'url': '/map' if notification_type == 'new_listings' else '/analytics',
            'timestamp': datetime.utcnow().isoformat()
        }

        # Надсилаємо сповіщення всім підписникам в фоні
        for endpoint, subscription_data in subscriptions_db.items():
            if subscription_data['settings'].get(notification_type, False):
                background_tasks.add_task(
                    send_push_notification,
                    subscription_data['subscription'],
                    payload
                )
                sent_count += 1

        logger.info(f"Заплановано сповіщень: {sent_count}")
        return {
            "message": f"Сповіщення розіслано {sent_count} підписникам",
            "sent": sent_count,
            "total_subscribers": len(subscriptions_db)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Помилка розсилки сповіщень: {e}")
        raise HTTPException(status_code=500, detail="Помилка розсилки сповіщень")

# Фонова задача для перевірки нових оголошень
async def check_and_notify_new_listings():
    """Фонова перевірка нових оголошень та сповіщення"""
    try:
        new_listings = await check_new_listings()

        if new_listings:
            # Надсилаємо сповіщення всім підписникам
            await broadcast_notification('new_listings')

            logger.info(f"Знайдено {len(new_listings)} нових оголошень, надіслано сповіщення")
        else:
            logger.info("Нових оголошень не знайдено")

    except Exception as e:
        logger.error(f"Помилка фонової перевірки: {e}")

# Функція для планування сповіщень
def schedule_notifications():
    """Планує регулярні сповіщення"""
    # В реальному проекті тут буде планувальник (celery, APScheduler тощо)
    # Наприклад, перевірка нових оголошень кожні 30 хвилин
    pass

# Експорт для використання в main.py
__all__ = [
    'router',
    'check_and_notify_new_listings',
    'broadcast_notification'
]
