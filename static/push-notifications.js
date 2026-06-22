// Регистрация и управление push-уведомлениями
class PushNotificationManager {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        this.vapidPublicKey = null;
    }

    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker не поддерживается');
            return false;
        }

        if (!('PushManager' in window)) {
            console.log('Push-уведомления не поддерживаются');
            return false;
        }

        try {
            // Получаем VAPID публичный ключ с сервера
            const response = await fetch('/api/push-subscription/vapid-public-key/');
            const data = await response.json();
            this.vapidPublicKey = data.publicKey;

            // Регистрируем Service Worker
            this.swRegistration = await navigator.serviceWorker.register('/static/sw.js');
            console.log('Service Worker зарегистрирован');

            // Проверяем текущую подписку
            const subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = subscription !== null;

            return true;
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
            return false;
        }
    }

    async requestPermission() {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async subscribe() {
        try {
            const permission = await this.requestPermission();
            if (!permission) {
                console.log('Разрешение на уведомления не получено');
                return false;
            }

            // Подписываемся на push-уведомления
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
            });

            console.log('Подписка на push-уведомления успешна');
            this.isSubscribed = true;

            // Отправляем подписку на сервер
            await this.sendSubscriptionToServer(subscription);

            return true;
        } catch (error) {
            console.error('Ошибка подписки на push:', error);
            return false;
        }
    }

    async unsubscribe() {
        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();

                // Удаляем подписку на сервере
                await this.deleteSubscriptionFromServer(subscription);

                this.isSubscribed = false;
                console.log('Отписка от push-уведомлений успешна');
            }
        } catch (error) {
            console.error('Ошибка отписки:', error);
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push-subscription/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON()
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Подписка сохранена на сервере:', data);
            } else {
                console.error('Ошибка сохранения подписки:', data);
            }
        } catch (error) {
            console.error('Ошибка отправки подписки на сервер:', error);
        }
    }

    async deleteSubscriptionFromServer(subscription) {
        try {
            const response = await fetch('/api/push-subscription/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Подписка удалена с сервера:', data);
            } else {
                console.error('Ошибка удаления подписки:', data);
            }
        } catch (error) {
            console.error('Ошибка удаления подписки с сервера:', error);
        }
    }

    // Показать локальное уведомление (fallback для разработки)
    async showNotification(title, options = {}) {
        if (!this.swRegistration) {
            console.error('Service Worker не зарегистрирован');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.log('Нет разрешения на уведомления');
            return;
        }

        const defaultOptions = {
            body: 'У вас новое сообщение',
            icon: '/static/icon-192.png',
            badge: '/static/badge-72.png',
            vibrate: [200, 100, 200],
            tag: 'shirokiy-notification',
            requireInteraction: false,
            data: {
                url: window.location.origin
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            await this.swRegistration.showNotification(title, finalOptions);

            // Воспроизводим звук
            this.playNotificationSound();
        } catch (error) {
            console.error('Ошибка показа уведомления:', error);
        }
    }

    playNotificationSound() {
        // Создаем простой звук уведомления
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Экспортируем глобально
window.PushNotificationManager = PushNotificationManager;
