# 🔧 Техническая документация Shirokiy Messenger

## 📊 Архитектура проекта

### Структура базы данных

#### Модель User (расширенная)
```python
- username: CharField (уникальное)
- email: EmailField
- password: CharField (хешированный)
- avatar: ImageField (аватарка пользователя)
- bio: TextField (биография)
- online_status: BooleanField (статус онлайн)
- last_seen: DateTimeField (последнее посещение)
```

#### Модель Chat
```python
- chat_type: CharField (private/group)
- name: CharField (название группы)
- avatar: ImageField (аватар группы)
- participants: ManyToManyField (участники)
- created_at: DateTimeField
- updated_at: DateTimeField
```

#### Модель Message
```python
- chat: ForeignKey (связь с чатом)
- sender: ForeignKey (отправитель)
- content: TextField (текст сообщения)
- created_at: DateTimeField
- is_read: BooleanField (прочитано)
- is_deleted: BooleanField (удалено)
```

#### Модель Subscription
```python
- subscriber: ForeignKey (подписчик)
- subscribed_to: ForeignKey (на кого подписан)
- created_at: DateTimeField
- unique_together: (subscriber, subscribed_to)
```

#### Модель Notification
```python
- recipient: ForeignKey (получатель)
- notification_type: CharField (тип уведомления)
- sender: ForeignKey (отправитель)
- chat: ForeignKey (связанный чат)
- message: ForeignKey (связанное сообщение)
- content: TextField (текст уведомления)
- is_read: BooleanField (прочитано)
- created_at: DateTimeField
```

### Связи между моделями

```
User 1:N Message (отправленные сообщения)
User N:M Chat (участие в чатах)
User 1:N Notification (полученные уведомления)
User 1:N Subscription (подписки)
Chat 1:N Message (сообщения в чате)
```

## 🛣 URL-маршруты

### Основные маршруты
```
/ - главная страница (список чатов)
/register/ - регистрация
/login/ - вход
/logout/ - выход
```

### Чаты и сообщения
```
/chat/<int:chat_id>/ - страница чата
/create-chat/<int:user_id>/ - создание личного чата
/create-group/ - создание группы
/delete-message/<int:message_id>/ - удаление сообщения
```

### Профили
```
/profile/ - свой профиль
/profile/<int:user_id>/ - профиль пользователя
```

### Подписки
```
/subscribe/<int:user_id>/ - подписаться
/unsubscribe/<int:user_id>/ - отписаться
```

### Прочее
```
/search/ - поиск пользователей
/notifications/ - уведомления
/admin/ - админ-панель
```

## 🔌 WebSocket (Channels)

### Consumer
```python
ChatConsumer - обработка WebSocket соединений для чатов
- connect() - подключение к комнате чата
- disconnect() - отключение
- receive() - получение сообщения
- chat_message() - отправка сообщения в группу
```

### Routing
```
ws/chat/<chat_id>/ - WebSocket endpoint для чата
```

### Важно
WebSocket работает только при наличии Redis или InMemoryChannelLayer.
На PythonAnywhere бесплатный план не поддерживает WebSocket.

## 🎨 Frontend

### Технологии
- HTML5
- CSS3 (без препроцессоров)
- Vanilla JavaScript (без фреймворков)

### Ключевые CSS классы
```css
.messenger-container - основной контейнер мессенджера
.sidebar - боковая панель с чатами
.chat-container - контейнер чата
.message - сообщение
.avatar - аватар пользователя
.btn-primary - основная кнопка
.form-input - поле ввода
```

### JavaScript функции
```javascript
showTab(tab) - переключение вкладок
toggleEditForm() - показать/скрыть форму редактирования
Auto-reload каждые 5 секунд для обновления сообщений
```

## 🔐 Безопасность

### Аутентификация
- Django встроенная система аутентификации
- Хеширование паролей через PBKDF2
- CSRF защита на всех формах

### Разрешения
- @login_required декоратор для защищенных view
- Проверка прав доступа к чатам
- Проверка владельца при удалении сообщений

### Защита данных
- Валидация форм на стороне сервера
- Escape HTML в шаблонах
- Защита от SQL injection через ORM

## 📈 Оптимизация

### База данных
```python
select_related() - для ForeignKey
prefetch_related() - для ManyToMany
.only() / .defer() - для выборки определенных полей
Индексы на часто запрашиваемых полях
```

### Запросы
```python
# Оптимизированный запрос чатов
chats = Chat.objects.filter(participants=user)
    .annotate(last_message_time=Max('messages__created_at'))
    .order_by('-last_message_time')
    .select_related('avatar')
    .prefetch_related('participants')
```

### Кэширование
В текущей версии не реализовано, но можно добавить:
- Кэширование списка чатов
- Кэширование профилей пользователей
- Кэширование статических страниц

## 🧪 Тестирование

### Ручное тестирование
1. Регистрация нового пользователя
2. Вход в систему
3. Поиск пользователя
4. Создание чата
5. Отправка сообщения
6. Удаление сообщения
7. Редактирование профиля
8. Загрузка аватара
9. Создание группы
10. Подписка на пользователя

### Автоматические тесты (TODO)
```python
# Примеры тестов для будущей реализации
TestUserRegistration
TestChatCreation
TestMessageSending
TestSubscriptions
TestNotifications
```

## 🚀 Деплой

### Переменные окружения (production)
```python
DEBUG = False
SECRET_KEY = 'новый-безопасный-ключ'
ALLOWED_HOSTS = ['yourdomain.com']
```

### Статические файлы
```bash
python manage.py collectstatic --noinput
```

### База данных
Для продакшена рекомендуется PostgreSQL:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'shirokiy_db',
        'USER': 'username',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### HTTPS
Обязательно для продакшена:
```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## 📊 Мониторинг и логирование

### Логи Django
```python
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Метрики
- Количество активных пользователей
- Количество сообщений в день
- Среднее время отклика
- Размер загруженных файлов

## 🔄 API endpoints (будущее развитие)

### REST API (Django REST Framework)
```
GET /api/chats/ - список чатов
GET /api/chats/<id>/ - детали чата
POST /api/chats/<id>/messages/ - отправить сообщение
GET /api/users/ - список пользователей
GET /api/users/<id>/ - профиль пользователя
```

## 🛠 Инструменты разработки

### Используемые пакеты
```
django==6.0.6
djangorestframework==3.17.1
channels==4.3.2
channels-redis==4.3.0
pillow==12.2.0
django-cors-headers==4.9.0
```

### Рекомендуемые IDE
- PyCharm Professional (лучшая поддержка Django)
- VS Code с расширениями Python и Django
- Sublime Text с пакетами для Python

## 📝 Соглашения по коду

### Стиль кода
- PEP 8 для Python
- 4 пробела для отступов
- Максимальная длина строки: 100 символов
- Docstrings для функций и классов

### Именование
- Модели: PascalCase (User, Chat, Message)
- Функции: snake_case (get_user_chats)
- Константы: UPPER_CASE (MAX_MESSAGE_LENGTH)
- Переменные: snake_case (user_id, chat_list)

### Git workflow
```bash
git checkout -b feature/new-feature
# внести изменения
git add .
git commit -m "feat: добавить новую функцию"
git push origin feature/new-feature
# создать Pull Request
```

## 🔮 Будущее развитие

### Приоритетные функции
1. Отправка файлов и изображений
2. Push-уведомления через Service Worker
3. Темная тема
4. Поиск по сообщениям
5. Реакции на сообщения

### Технические улучшения
1. Переход на PostgreSQL
2. Реализация Redis для кэширования
3. CDN для статических файлов
4. Docker контейнеризация
5. CI/CD pipeline

### Масштабирование
1. Horizontal scaling с load balancer
2. Отдельные серверы для WebSocket
3. Микросервисная архитектура
4. Message queue (Celery + RabbitMQ)

## 📞 Техническая поддержка

Для технических вопросов:
1. Проверьте документацию
2. Изучите логи ошибок
3. Проверьте GitHub Issues
4. Свяжитесь с разработчиком

---

**Версия**: 1.0.0  
**Дата**: 2026-06-19  
**Автор**: Shirokiy Messenger Team
