import json
import logging
from pywebpush import webpush, WebPushException
from django.conf import settings
from .models import PushSubscription

logger = logging.getLogger(__name__)


def send_push_notification(user, title, body, url=None, icon=None):
    """
    Отправляет push-уведомление пользователю на все его подписанные устройства.

    Args:
        user: User объект получателя
        title: Заголовок уведомления
        body: Текст уведомления
        url: URL для перехода при клике (опционально)
        icon: URL иконки (опционально)

    Returns:
        int: Количество успешно отправленных уведомлений
    """
    subscriptions = PushSubscription.objects.filter(user=user)

    if not subscriptions.exists():
        logger.info(f"No push subscriptions found for user {user.username}")
        return 0

    payload = {
        "title": title,
        "body": body,
        "icon": icon or "/static/icon-192.png",
        "badge": "/static/badge-72.png",
        "vibrate": [200, 100, 200],
        "tag": "shirokiy-notification",
        "requireInteraction": False,
    }

    if url:
        payload["data"] = {"url": url}

    successful_sends = 0
    failed_subscriptions = []

    for subscription in subscriptions:
        try:
            subscription_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth
                }
            }

            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_SETTINGS["VAPID_PRIVATE_KEY"],
                vapid_claims={
                    "sub": f"mailto:{settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']}"
                }
            )

            successful_sends += 1
            logger.info(f"Push notification sent to {user.username} (subscription {subscription.id})")

        except WebPushException as e:
            logger.error(f"Failed to send push to {user.username}: {e}")

            # Если подписка больше не валидна (410 Gone или 404), удаляем её
            if e.response and e.response.status_code in [404, 410]:
                failed_subscriptions.append(subscription)
                logger.info(f"Removing invalid subscription {subscription.id} for {user.username}")

        except Exception as e:
            logger.error(f"Unexpected error sending push to {user.username}: {e}")

    # Удаляем невалидные подписки
    for sub in failed_subscriptions:
        sub.delete()

    return successful_sends


def send_message_notification(message):
    """
    Отправляет уведомление о новом сообщении всем участникам чата кроме отправителя.

    Args:
        message: Message объект

    Returns:
        dict: Количество отправленных уведомлений для каждого получателя
    """
    chat = message.chat
    sender = message.sender

    # Получаем всех участников чата кроме отправителя
    recipients = chat.participants.exclude(id=sender.id)

    # Формируем текст сообщения для уведомления
    if message.content:
        body = message.content[:100]  # Первые 100 символов
    elif message.image:
        body = "📷 Изображение"
    elif message.video:
        body = "🎥 Видео"
    elif message.voice:
        body = "🎤 Голосовое сообщение"
    elif message.video_note:
        body = "⭕ Видео-кружок"
    elif message.file:
        body = "📎 Файл"
    else:
        body = "Сообщение"

    # Формируем заголовок
    if chat.chat_type == 'group':
        title = f"{sender.username} в {chat.name}"
    else:
        title = sender.username

    # URL для перехода к чату
    url = f"/chat/{chat.id}/"

    # Иконка отправителя
    icon = sender.avatar.url if sender.avatar else None

    results = {}
    for recipient in recipients:
        count = send_push_notification(
            user=recipient,
            title=title,
            body=body,
            url=url,
            icon=icon
        )
        results[recipient.username] = count

    return results
