# Shirokiy Messenger - Deployment Guide

## Развертывание на PythonAnywhere

### 1. Подготовка проекта

```bash
# Клонируйте проект или загрузите файлы на PythonAnywhere
```

### 2. Создание виртуального окружения

```bash
mkvirtualenv shirokiy-env --python=python3.10
pip install -r requirements.txt
```

### 3. Настройка settings.py для продакшена

В `shirokiy_messenger/settings.py` измените:

```python
DEBUG = False
ALLOWED_HOSTS = ['yourusername.pythonanywhere.com']

# Для безопасности сгенерируйте новый SECRET_KEY
SECRET_KEY = 'ваш-новый-секретный-ключ'

# Настройки статики
STATIC_ROOT = '/home/yourusername/shirokiy_messenger/staticfiles'
MEDIA_ROOT = '/home/yourusername/shirokiy_messenger/media'
```

### 4. Настройка базы данных

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 5. Настройка WSGI

На PythonAnywhere в разделе Web настройте:

- Source code: `/home/yourusername/shirokiy_messenger`
- Working directory: `/home/yourusername/shirokiy_messenger`
- Virtualenv: `/home/yourusername/.virtualenvs/shirokiy-env`

Файл WSGI уже настроен в `shirokiy_messenger/wsgi.py`

### 6. Загрузка статических файлов

```bash
python manage.py collectstatic
```

На вкладке Web в разделе Static files:
- URL: `/static/`
- Directory: `/home/yourusername/shirokiy_messenger/staticfiles`

- URL: `/media/`
- Directory: `/home/yourusername/shirokiy_messenger/media`

### 7. Важные замечания

⚠️ **WebSocket на бесплатном аккаунте PythonAnywhere не поддерживаются**

Для real-time обновлений на бесплатном плане используется автообновление страницы каждые 5 секунд (уже реализовано в chat.html).

Для полноценной поддержки WebSocket нужен платный план или другой хостинг (Heroku, Railway, AWS, etc.)

### 8. Перезапуск приложения

После каждого изменения кода нажмите "Reload" на вкладке Web.

### 9. Тестирование

Откройте `https://yourusername.pythonanywhere.com` и проверьте:

- ✅ Регистрацию
- ✅ Вход
- ✅ Создание чатов
- ✅ Отправку сообщений
- ✅ Загрузку аватарок
- ✅ Подписки на пользователей
- ✅ Создание групп

### 10. Безопасность

После деплоя:

1. Установите `DEBUG = False`
2. Сгенерируйте новый `SECRET_KEY`
3. Настройте `ALLOWED_HOSTS`
4. Используйте HTTPS (PythonAnywhere предоставляет бесплатно)

## Возможные проблемы

### Проблема: Не загружаются статические файлы
Решение: Запустите `python manage.py collectstatic` и проверьте настройки Static files

### Проблема: Ошибка 502
Решение: Проверьте логи ошибок на вкладке Web → Error log

### Проблема: Не работают WebSocket
Решение: На бесплатном плане это нормально, используется fallback через обновление страницы

## Контакты

Для поддержки создайте issue в репозитории проекта.
