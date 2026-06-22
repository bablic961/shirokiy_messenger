# 🔍 Диагностика Push-уведомлений

## Проблема
Push-уведомления не приходят на устройства пользователей.

## ✅ Что уже работает

### Backend (проверено в коде)
- ✅ Модель `PushSubscription` существует
- ✅ API endpoints настроены (`/api/push-subscription/`)
- ✅ Функция `send_message_notification()` вызывается при отправке сообщений
- ✅ VAPID ключи настроены в settings.py

### Frontend (проверено в коде)
- ✅ `PushNotificationManager` класс создан
- ✅ Service Worker регистрируется
- ✅ Автоматическая инициализация в base.html

## 🔍 Возможные причины

### 1. Service Worker не зарегистрирован
**Проверка:** Открой консоль браузера (F12) и выполни:
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs));
```

**Ожидаемый результат:** Должен быть массив с одной регистрацией
**Если пусто:** Service Worker не загрузился

### 2. Пользователь не дал разрешение
**Проверка:** В консоли браузера:
```javascript
console.log('Permission:', Notification.permission);
```

**Ожидаемые значения:**
- `"granted"` ✅ - всё ок
- `"denied"` ❌ - нужно разрешить в настройках браузера
- `"default"` ⚠️ - ещё не спрашивали

**Как исправить:**
- Chrome: Настройки → Конфиденциальность → Уведомления → Разрешить для сайта
- Firefox: Адресная строка → иконка замка → Разрешения → Уведомления

### 3. Подписка не сохранилась на сервере
**Проверка:** В консоли браузера:
```javascript
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Subscription:', sub));
```

**Если `null`:** Подписка не создана
**Если объект:** Проверь, сохранена ли она на сервере

**Проверка на сервере (Django shell):**
```python
from messenger.models import PushSubscription
print(f"Всего подписок: {PushSubscription.objects.count()}")
print(f"Последние подписки:")
for sub in PushSubscription.objects.all()[:5]:
    print(f"  - {sub.user.username}: {sub.created_at}")
```

### 4. HTTPS не настроен (критично!)
Push-уведомления работают **только по HTTPS** (кроме localhost).

**Проверка:**
```javascript
console.log('Protocol:', window.location.protocol);
```

**Должно быть:** `"https:"` для продакшена

**На PythonAnywhere:** HTTPS включается автоматически, проверь что в `ALLOWED_HOSTS` правильный домен.

### 5. Service Worker путь неверный
**Проверка:** Открой прямо в браузере:
- `https://your-username.pythonanywhere.com/static/sw.js`

**Должен:** Загрузиться JavaScript файл
**Если 404:** Нужно запустить `collectstatic`

### 6. VAPID ключи не настроены
**Проверка:** В Django shell:
```python
from django.conf import settings
print('VAPID Public Key:', settings.WEBPUSH_SETTINGS['VAPID_PUBLIC_KEY'][:20] + '...')
print('VAPID Private Key:', 'SET' if settings.WEBPUSH_SETTINGS['VAPID_PRIVATE_KEY'] else 'NOT SET')
```

**Оба должны быть SET**

## 🛠️ Пошаговая диагностика

### Шаг 1: Проверь консоль браузера
1. Открой сайт
2. Нажми F12
3. Перейди на вкладку Console
4. Найди сообщения:
   - ✅ `"Service Worker зарегистрирован"`
   - ✅ `"Публичный ключ собеседника загружен - шифрование включено"`
   - ✅ `"Подписка на push-уведомления успешна"`

### Шаг 2: Проверь разрешения
1. Посмотри на адресную строку браузера
2. Должна быть иконка уведомлений
3. Убедись, что разрешение дано

### Шаг 3: Ручная подписка
Выполни в консоли браузера:
```javascript
// Полная диагностика
(async () => {
    console.log('=== Push Notifications Diagnostic ===');
    
    // 1. Поддержка
    console.log('Service Worker supported:', 'serviceWorker' in navigator);
    console.log('Push supported:', 'PushManager' in window);
    
    // 2. Разрешение
    console.log('Permission:', Notification.permission);
    
    // 3. Service Worker
    const regs = await navigator.serviceWorker.getRegistrations();
    console.log('SW registered:', regs.length > 0);
    
    if (regs.length > 0) {
        // 4. Подписка
        const sub = await regs[0].pushManager.getSubscription();
        console.log('Subscribed:', sub !== null);
        
        if (sub) {
            console.log('Subscription endpoint:', sub.endpoint);
        }
    }
    
    console.log('=================================');
})();
```

### Шаг 4: Тестовая отправка с сервера
В Django shell на сервере:
```python
from messenger.models import User
from messenger.push_notifications import send_push_notification

# Найди своего пользователя
user = User.objects.get(username='твой_username')

# Отправь тестовое уведомление
result = send_push_notification(
    user=user,
    title="🔔 Тест",
    body="Если видишь это - всё работает!",
    url="/"
)

print(f"Отправлено на {result} устройств")
```

## 🔧 Быстрое исправление

### Вариант 1: Переподписаться
В консоли браузера:
```javascript
// Отписаться
navigator.serviceWorker.ready
    .then(reg => reg.pushManager.getSubscription())
    .then(sub => sub && sub.unsubscribe())
    .then(() => console.log('Отписан'));

// Перезагрузи страницу
// Система автоматически переподпишет тебя
```

### Вариант 2: Очистить всё и начать сначала
В консоли браузера:
```javascript
// Удалить все Service Workers
navigator.serviceWorker.getRegistrations()
    .then(regs => Promise.all(regs.map(reg => reg.unregister())))
    .then(() => console.log('All SW unregistered'));

// Перезагрузи страницу
```

### Вариант 3: Обновить на PythonAnywhere
```bash
cd ~/shirokiy_messenger
git pull origin main
python manage.py collectstatic --noinput
# Перезапусти веб-приложение через интерфейс
```

## 📱 Проверка на мобильном

### iOS (Safari)
- Требуется iOS 16.4+
- Работает только если сайт добавлен на главный экран
- Настройки → Safari → Уведомления

### Android (Chrome)
- Работает из коробки
- Настройки → Уведомления → Разрешить

## ❓ Частые ошибки

### "Registration failed - no active Service Worker"
**Причина:** sw.js не загрузился
**Решение:** 
```bash
python manage.py collectstatic --noinput
```

### "Push subscription failed: permission denied"
**Причина:** Пользователь запретил уведомления
**Решение:** Очистить разрешения сайта в настройках браузера

### "Failed to execute 'subscribe' on 'PushManager'"
**Причина:** VAPID ключ неправильный
**Решение:** Проверь settings.py на сервере

## 🎯 Финальная проверка

После исправлений проверь полный цикл:

1. ✅ Открыть сайт
2. ✅ Разрешить уведомления (всплывающее окно)
3. ✅ Открыть в другом окне/устройстве
4. ✅ Отправить сообщение
5. ✅ Получить push-уведомление

## 🆘 Если ничего не помогло

Отправь мне результаты этой команды из консоли браузера:

```javascript
(async () => {
    const diag = {
        protocol: window.location.protocol,
        permission: Notification.permission,
        swSupport: 'serviceWorker' in navigator,
        pushSupport: 'PushManager' in window,
        swCount: (await navigator.serviceWorker.getRegistrations()).length,
        subscription: null
    };
    
    if (diag.swCount > 0) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        diag.subscription = sub ? 'exists' : 'none';
    }
    
    console.log('ДИАГНОСТИКА:', JSON.stringify(diag, null, 2));
})();
```

---

**Автор:** Kiro AI Assistant  
**Дата:** 22 июня 2026  
**Статус:** 🔍 Диагностика
