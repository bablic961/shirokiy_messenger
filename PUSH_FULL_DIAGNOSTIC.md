# 🔧 Полная диагностика push-уведомлений

## Проблема: уведомления не приходят

Подписка создана успешно, но уведомления не приходят.

## 🔍 Проверка 1: Django Shell на PythonAnywhere

Подключись к PythonAnywhere через Bash консоль и выполни:

```bash
cd ~/shirokiy_messenger
python manage.py shell
```

Затем в Python shell:

```python
# 1. Проверка подписок
from messenger.models import PushSubscription, User

print("=" * 50)
print("📊 СТАТИСТИКА ПОДПИСОК")
print("=" * 50)

total_subs = PushSubscription.objects.count()
print(f"Всего подписок в БД: {total_subs}")

if total_subs > 0:
    print("\nПоследние подписки:")
    for sub in PushSubscription.objects.all()[:5]:
        print(f"  • {sub.user.username} - создана {sub.created_at}")
        print(f"    Endpoint: {sub.endpoint[:50]}...")
else:
    print("⚠️ ПРОБЛЕМА: Нет подписок в базе данных!")
    print("Решение: Обнови страницу в браузере и разреши уведомления")

print("\n" + "=" * 50)
print("🔑 VAPID НАСТРОЙКИ")
print("=" * 50)

from django.conf import settings
vapid_public = settings.WEBPUSH_SETTINGS.get('VAPID_PUBLIC_KEY', '')
vapid_private = settings.WEBPUSH_SETTINGS.get('VAPID_PRIVATE_KEY', '')
vapid_email = settings.WEBPUSH_SETTINGS.get('VAPID_ADMIN_EMAIL', '')

print(f"Public Key: {vapid_public[:30]}... ({'✅ SET' if vapid_public else '❌ NOT SET'})")
print(f"Private Key: {'✅ SET' if vapid_private else '❌ NOT SET'}")
print(f"Admin Email: {vapid_email}")

print("\n" + "=" * 50)
print("🧪 ТЕСТОВАЯ ОТПРАВКА")
print("=" * 50)

# 2. Попытка отправить тестовое уведомление
try:
    from messenger.push_notifications import send_push_notification
    
    # Находим первого пользователя с подпиской
    user_with_sub = None
    for sub in PushSubscription.objects.all():
        user_with_sub = sub.user
        break
    
    if user_with_sub:
        print(f"Отправляем уведомление пользователю: {user_with_sub.username}")
        
        result = send_push_notification(
            user=user_with_sub,
            title="🔔 Тестовое уведомление",
            body="Если видишь это - push работает!",
            url="/"
        )
        
        print(f"✅ Отправлено на {result} устройств")
        
        if result == 0:
            print("⚠️ ПРОБЛЕМА: Не удалось отправить ни на одно устройство")
            print("Возможные причины:")
            print("  1. Подписка недействительна (истекла)")
            print("  2. Ошибка в VAPID ключах")
            print("  3. Проблема с py-vapid библиотекой")
    else:
        print("⚠️ Нет пользователей с подписками")
        
except Exception as e:
    print(f"❌ ОШИБКА при отправке: {e}")
    print(f"Тип ошибки: {type(e).__name__}")
    import traceback
    print("\nПолный traceback:")
    traceback.print_exc()

print("\n" + "=" * 50)
```

## 🔍 Проверка 2: В консоли браузера

Выполни этот код в консоли браузера (F12):

```javascript
// Проверка подписки и попытка получить детали
(async () => {
    console.log('🔍 Детальная проверка подписки');
    
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    
    if (sub) {
        console.log('✅ Подписка существует');
        console.log('Endpoint:', sub.endpoint);
        console.log('Keys:', {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
        });
        
        // Проверяем, что подписка действительна
        try {
            const testResponse = await fetch('/api/push-subscription/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                },
                body: JSON.stringify({
                    subscription: sub.toJSON()
                })
            });
            
            const result = await testResponse.json();
            console.log('Проверка сохранения:', result);
            
        } catch (err) {
            console.error('Ошибка проверки:', err);
        }
    } else {
        console.log('❌ Подписка не найдена');
    }
})();
```

## 🔍 Проверка 3: Service Worker

Проверь Service Worker в консоли:

```javascript
// Проверка обработчика push событий
navigator.serviceWorker.ready.then(reg => {
    console.log('Service Worker Scope:', reg.scope);
    console.log('Service Worker Active:', reg.active?.state);
    
    // Проверим, есть ли обработчик push
    return navigator.serviceWorker.getRegistration();
}).then(reg => {
    console.log('Registration:', reg);
});
```

## 🔍 Проверка 4: Логи на PythonAnywhere

Проверь логи ошибок на PythonAnywhere:
1. Перейди на вкладку **Web**
2. Прокрути до **Log files**
3. Открой **Error log**
4. Отправь сообщение и посмотри, появляются ли ошибки

## 🎯 Частые проблемы и решения:

### Проблема: `py-vapid` не установлен
**Симптом:** Ошибка `ModuleNotFoundError: No module named 'py_vapid'`

**Решение:**
```bash
cd ~/shirokiy_messenger
pip install --user py-vapid
```

### Проблема: Подписка истекла
**Симптом:** `result = 0` при отправке

**Решение:** В браузере:
```javascript
// Переподписаться
navigator.serviceWorker.ready
    .then(reg => reg.pushManager.getSubscription())
    .then(sub => sub.unsubscribe())
    .then(() => location.reload());
```

### Проблема: Неправильные VAPID ключи
**Симптом:** Ошибка при отправке связанная с JWT

**Решение:** Сгенерировать новые ключи:
```python
from py_vapid import Vapid
vapid = Vapid()
vapid.generate_keys()
print("Public Key:", vapid.public_key.export_public_key())
print("Private Key:", vapid.private_key.export_private_key())
```

### Проблема: CSRF токен
**Симптом:** Ошибка 403 при сохранении подписки

**Решение:** Проверь, что в base.html есть:
```html
{% csrf_token %}
```

## 📝 Что отправить мне:

После выполнения проверки 1 (Django shell) скопируй **весь вывод** и отправь мне.

Особенно важно:
- Сколько подписок в БД
- Результат тестовой отправки (✅ или ❌)
- Если ошибка - полный traceback

---

**Дата:** 22 июня 2026, 18:37
**Статус:** 🔍 Диагностика активных проблем
