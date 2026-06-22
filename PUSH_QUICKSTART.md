# 🚀 Быстрый старт Push-уведомлений

## Локальная разработка

```bash
# 1. Установите зависимости
pip install -r requirements.txt

# 2. Примените миграции
python manage.py migrate

# 3. Запустите сервер
python manage.py runserver

# 4. Откройте браузер
# Перейдите на http://127.0.0.1:8000
# Разрешите уведомления при запросе

# 5. Проверьте работу
# Откройте два окна браузера с разными пользователями
# Отправьте сообщение - получатель должен увидеть push-уведомление
```

## PythonAnywhere

```bash
# 1. Загрузите проект на PythonAnywhere

# 2. В Bash консоли
cd ~/shirokiy_messenger
pip install --user -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 3. В settings.py измените
DEBUG = False
ALLOWED_HOSTS = ['your-username.pythonanywhere.com']

# 4. В Web tab нажмите Reload

# Готово! Push-уведомления работают
```

## Проверка работы

### В консоли браузера (F12):

```javascript
// Проверка Service Worker
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length > 0));

// Проверка подписки
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Subscribed:', sub !== null));
```

### В Django shell:

```python
# Количество подписок
from messenger.models import PushSubscription
print(f"Active subscriptions: {PushSubscription.objects.count()}")

# Отправка тестового уведомления
from messenger.models import User
from messenger.push_notifications import send_push_notification

user = User.objects.first()
send_push_notification(
    user=user,
    title="Тест",
    body="Проверка push-уведомлений",
    url="/"
)
```

## Что дальше?

📖 Полная документация: [PUSH_NOTIFICATIONS_SETUP.md](PUSH_NOTIFICATIONS_SETUP.md)

## Основные файлы

- `messenger/models.py` - модель `PushSubscription`
- `messenger/views.py` - API endpoints для подписок
- `messenger/push_notifications.py` - функции отправки
- `static/push-notifications.js` - клиентская логика
- `static/sw.js` - Service Worker
- `shirokiy_messenger/settings.py` - VAPID ключи

## Требования

- ✅ Python 3.10+
- ✅ Django 6.0+
- ✅ HTTPS (автоматически на PythonAnywhere)
- ✅ Современный браузер (Chrome, Firefox, Safari 16.4+)

## Статус: ✅ Ready to Deploy

Система полностью готова к работе на PythonAnywhere.
