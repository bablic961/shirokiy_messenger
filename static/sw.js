// Service Worker для Push-уведомлений
self.addEventListener('install', (event) => {
    console.log('Service Worker установлен');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker активирован');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('Push-уведомление получено:', event.data);

    let data = {
        title: 'Новое уведомление',
        body: 'У вас новое сообщение',
        icon: '/static/icon-192.png',
        badge: '/static/badge-72.png',
        tag: 'message-notification',
        requireInteraction: false,
        url: '/'
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            console.error('Ошибка парсинга push-данных:', e);
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: data.vibrate || [200, 100, 200],
        tag: data.tag,
        requireInteraction: data.requireInteraction,
        data: {
            url: data.url || data.data?.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('Клик по уведомлению');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Ищем открытую вкладку с нужным URL
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Если не найдена, открываем новую вкладку
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('Уведомление закрыто:', event.notification.tag);
});
