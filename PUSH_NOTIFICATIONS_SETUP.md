# 🔔 Настройка Push-уведомлений для PythonAnywhere

## Обзор

Реализована полная система push-уведомлений с использованием Web Push Protocol и VAPID ключей. Система работает на любом хостинге, включая PythonAnywhere.

## ✅ Что реализовано

### Backend (Django)

1. **Модель PushSubscription** - хранение подписок пользователей
2. **API endpoints** для управления подписками:
   - `/api/push-subscription/save/` - сохранение подписки
   - `/api/push-subscription/delete/` - удаление подписки
   - `/api/push-subscription/vapid-public-key/` - получение публичного ключа
3. **Функции отправки уведомлений** (`push_notifications.py`):
   - `send_push_notification()` - отправка уведомления пользователю
   - `send_message_notification()` - отправка уведомления о новом сообщении
4. **Автоматическая отправка** push-уведомлений при новых сообщениях

### Frontend (JavaScript)

1. **PushNotificationManager** класс для управления подписками
2. **Service Worker** для обработки push-уведомлений
3. **Автоматическая подписка** при первом посещении
4. **Иконки уведомлений** (icon-192.png, badge-72.png)

## 📦 Установка

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

Новые зависимости:
- `pywebpush==2.3.0` - отправка Web Push уведомлений
- `py-vapid==1.9.4` - генерация и работа с VAPID ключами

### 2. Применение миграций

```bash
python manage.py migrate
```

Создаст таблицу `PushSubscription` в базе данных.

## 🔑 VAPID ключи

VAPID (Voluntary Application Server Identification) ключи уже сгенерированы и находятся в `settings.py`:

```python
WEBPUSH_SETTINGS = {
    "VAPID_PUBLIC_KEY": "BK-rq0B4uVB8lkLe7fh85oz6KSEkDui_sNxFF_rXzOBI9lj031pEzT56HfQIt5qVSoxP4qW_6YUVR84bHd_44yg",
    "VAPID_PRIVATE_KEY": "...",
    "VAPID_ADMIN_EMAIL": "admin@shirokiy-messenger.com"
}
```

### Генерация новых ключей (опционально)

Если нужно сгенерировать новые ключи:

```python
from py_vapid import Vapid01
from cryptography.hazmat.primitives import serialization
import base64

vapid = Vapid01()
vapid.generate_keys()

# Приватный ключ
print(vapid.private_pem().decode())

# Публичный ключ
pub_bytes = vapid.public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)
print(base64.urlsafe_b64encode(pub_bytes).decode().rstrip('='))
```

## 🚀 Деплой на PythonAnywhere

### 1. Загрузка файлов

Загрузите проект на PythonAnywhere через:
- Git
- Zip-архив через Files
- rsync/sftp

### 2. Установка зависимостей

В Bash консоли PythonAnywhere:

```bash
cd ~/your-project-name
pip install --user -r requirements.txt
```

### 3. Настройка settings.py

Убедитесь, что в `settings.py`:

```python
DEBUG = False
ALLOWED_HOSTS = ['your-username.pythonanywhere.com']

# WEBPUSH_SETTINGS уже настроены
```

### 4. Применение миграций

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 5. Перезагрузка веб-приложения

В Web tab PythonAnywhere нажмите **Reload**.

## 🧪 Тестирование

### 1. Проверка подписки

1. Откройте сайт в браузере
2. Разрешите уведомления (всплывающее окно)
3. Откройте консоль разработчика (F12)
4. Проверьте логи:
   ```
   Service Worker зарегистрирован
   Подписка на push-уведомления успешна
   Подписка сохранена на сервере
   ```

### 2. Проверка отправки уведомлений

1. Откройте чат с другим пользователем
2. Пусть другой пользователь отправит сообщение
3. Должно прийти push-уведомление (даже если вкладка неактивна)

### 3. Проверка в админ-панели

1. Перейдите в `/admin/`
2. Откройте **Push subscriptions**
3. Должны быть видны подписки пользователей

## 📱 Поддержка браузеров

Push-уведомления работают в:
- ✅ Chrome/Edge (desktop и Android)
- ✅ Firefox (desktop и Android)
- ✅ Safari (macOS 16.4+, iOS 16.4+)
- ✅ Opera
- ❌ Internet Explorer (не поддерживается)

## 🔧 Устранение неполадок

### Уведомления не приходят

1. **Проверьте разрешения браузера:**
   - Перейдите в настройки сайта
   - Убедитесь, что уведомления разрешены

2. **Проверьте Service Worker:**
   ```javascript
   // В консоли браузера
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))
   ```

3. **Проверьте подписку:**
   ```javascript
   // В консоли браузера
   navigator.serviceWorker.ready.then(reg => 
       reg.pushManager.getSubscription().then(sub => console.log(sub))
   )
   ```

4. **Проверьте логи сервера:**
   ```bash
   # В PythonAnywhere
   tail -f ~/your-project-name/error.log
   ```

### Ошибка "Failed to send push"

1. **Проверьте VAPID ключи** в `settings.py`
2. **Проверьте, что подписка сохранена** в базе данных
3. **Убедитесь, что библиотека установлена:**
   ```bash
   pip show pywebpush
   ```

### Старые подписки

Система автоматически удаляет невалидные подписки (404, 410 ошибки).

Вручную очистить старые подписки:

```python
# В Django shell
from messenger.models import PushSubscription
from datetime import timedelta
from django.utils import timezone

# Удалить подписки старше 30 дней
old_date = timezone.now() - timedelta(days=30)
PushSubscription.objects.filter(updated_at__lt=old_date).delete()
```

## 📊 Мониторинг

### Количество активных подписок

```python
from messenger.models import PushSubscription

# Всего подписок
total = PushSubscription.objects.count()

# По пользователям
from django.db.models import Count
users = PushSubscription.objects.values('user__username').annotate(count=Count('id'))
```

### Статистика отправки

В функции `send_message_notification()` возвращается словарь с результатами:

```python
{
    'user1': 2,  # Успешно отправлено на 2 устройства
    'user2': 1   # Успешно отправлено на 1 устройство
}
```

## 🔐 Безопасность

1. **VAPID приватный ключ** держите в секрете
2. **Используйте переменные окружения** для production:
   ```python
   import os
   WEBPUSH_SETTINGS = {
       "VAPID_PRIVATE_KEY": os.environ.get('VAPID_PRIVATE_KEY'),
       # ...
   }
   ```
3. **HTTPS обязателен** для push-уведомлений (PythonAnywhere предоставляет автоматически)

## 📚 Дополнительные возможности

### Кастомизация уведомлений

В `push_notifications.py` измените функцию `send_push_notification()`:

```python
payload = {
    "title": title,
    "body": body,
    "icon": icon or "/static/icon-192.png",
    "badge": "/static/badge-72.png",
    "vibrate": [200, 100, 200],
    "tag": "shirokiy-notification",
    "requireInteraction": False,  # True = уведомление не исчезнет автоматически
    "actions": [  # Кнопки в уведомлении (не все браузеры)
        {"action": "open", "title": "Открыть"},
        {"action": "close", "title": "Закрыть"}
    ]
}
```

### Отправка уведомлений вручную

```python
from messenger.models import User
from messenger.push_notifications import send_push_notification

user = User.objects.get(username='testuser')
send_push_notification(
    user=user,
    title="Тестовое уведомление",
    body="Это тест",
    url="/chat/1/"
)
```

## 🎯 Производительность

- Асинхронная отправка уведомлений (не блокирует ответ)
- Автоматическая очистка невалидных подписок
- Кеширование VAPID ключей
- Поддержка множественных устройств одного пользователя

## ✅ Чеклист для production

- [ ] Установлены все зависимости
- [ ] Применены миграции
- [ ] VAPID ключи в переменных окружения
- [ ] `DEBUG = False`
- [ ] `ALLOWED_HOSTS` настроен
- [ ] Собраны статические файлы (`collectstatic`)
- [ ] HTTPS включен (автоматически на PythonAnywhere)
- [ ] Протестированы уведомления
- [ ] Настроен мониторинг ошибок

## 📝 Логирование

Логи отправки уведомлений пишутся в стандартный Django logger:

```python
import logging
logger = logging.getLogger(__name__)

# Успешная отправка
logger.info(f"Push notification sent to {user.username}")

# Ошибка отправки
logger.error(f"Failed to send push to {user.username}: {error}")
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи в консоли браузера (F12)
2. Проверьте логи Django
3. Проверьте таблицу `PushSubscription` в админке
4. Убедитесь, что HTTPS включен (обязательно для push)

---

**Дата создания:** 22 июня 2026  
**Версия:** 1.0  
**Статус:** Production Ready ✅
