# 🔍 Быстрая диагностика - выполни в консоли браузера

## Скопируй и вставь эту команду в Console (F12):

```javascript
(async () => {
    console.log('========================================');
    console.log('🔍 ДИАГНОСТИКА PUSH-УВЕДОМЛЕНИЙ');
    console.log('========================================');
    
    // 1. Базовая поддержка
    console.log('\n1️⃣ Поддержка браузера:');
    console.log('   Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
    console.log('   Push Manager:', 'PushManager' in window ? '✅' : '❌');
    console.log('   Notifications:', 'Notification' in window ? '✅' : '❌');
    
    // 2. Разрешения
    console.log('\n2️⃣ Разрешение на уведомления:');
    const permission = Notification.permission;
    const permIcon = permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⚠️';
    console.log(`   ${permIcon} ${permission.toUpperCase()}`);
    if (permission !== 'granted') {
        console.log('   ⚠️ Нужно разрешить уведомления!');
    }
    
    // 3. Service Worker
    console.log('\n3️⃣ Service Worker:');
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('   Зарегистрировано:', registrations.length);
    
    if (registrations.length > 0) {
        const reg = registrations[0];
        console.log('   Scope:', reg.scope);
        console.log('   Active:', reg.active ? '✅' : '❌');
        
        // 4. Подписка
        console.log('\n4️⃣ Push подписка:');
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
            console.log('   ✅ Подписка активна');
            console.log('   Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        } else {
            console.log('   ❌ Подписка НЕ создана');
            console.log('   Попробуй обновить страницу');
        }
    } else {
        console.log('   ❌ Service Worker НЕ зарегистрирован');
        console.log('   Обнови страницу или проверь /static/sw.js');
    }
    
    // 5. Протокол
    console.log('\n5️⃣ Безопасность:');
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    console.log('   Протокол:', window.location.protocol);
    console.log('   Безопасное соединение:', isSecure ? '✅' : '❌');
    
    // 6. Проверка глобального менеджера
    console.log('\n6️⃣ Push Manager инициализирован:');
    console.log('   window.pushManager:', typeof window.pushManager !== 'undefined' ? '✅' : '❌');
    
    console.log('\n========================================');
    console.log('📋 ИТОГО:');
    
    let issues = [];
    if (permission !== 'granted') issues.push('Разрешение не дано');
    if (registrations.length === 0) issues.push('SW не зарегистрирован');
    if (registrations.length > 0) {
        const sub = await registrations[0].pushManager.getSubscription();
        if (!sub) issues.push('Подписка не создана');
    }
    if (!isSecure) issues.push('Нет HTTPS');
    
    if (issues.length === 0) {
        console.log('✅ ВСЁ НАСТРОЕНО ПРАВИЛЬНО!');
        console.log('Если уведомления не приходят - проблема на сервере.');
    } else {
        console.log('❌ Найдены проблемы:');
        issues.forEach((issue, i) => console.log(`   ${i+1}. ${issue}`));
    }
    
    console.log('========================================');
})();
```

## 🎯 Что искать в результатах:

### ✅ Всё хорошо если:
- Service Worker: ✅
- Push Manager: ✅  
- Разрешение: ✅ GRANTED
- Зарегистрировано: 1
- Подписка активна: ✅

### ❌ Проблема если:
- Разрешение: ❌ DENIED - **Очисти разрешения сайта**
- Разрешение: ⚠️ DEFAULT - **Обнови страницу, должен появиться запрос**
- Зарегистрировано: 0 - **Запусти collectstatic на сервере**
- Подписка НЕ создана - **Обнови страницу**

## 🔧 Если подписка не создана:

Выполни это для переподписки:
```javascript
// Запросить разрешение и подписаться заново
if (window.pushManager) {
    window.pushManager.subscribe().then(result => {
        console.log('✅ Переподписка успешна!');
        location.reload();
    }).catch(err => {
        console.error('❌ Ошибка переподписки:', err);
    });
}
```

## 🆘 Отправь мне результат:

После выполнения первой команды скопируй весь вывод из консоли и отправь мне.
