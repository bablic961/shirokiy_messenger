# Деплой Shirokiy Messenger на PythonAnywhere

## Предварительные требования

1. Аккаунт на [PythonAnywhere](https://www.pythonanywhere.com/)
2. GitHub аккаунт
3. Git установлен локально

## Шаг 1: Подготовка локального репозитория

```bash
# Перейдите в директорию проекта
cd shirokiy_messenger

# Инициализируйте git репозиторий
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Shirokiy Messenger"

# Создайте репозиторий на GitHub и подключите его
git remote add origin https://github.com/ваш-username/shirokiy_messenger.git
git branch -M main
git push -u origin main
```

## Шаг 2: Настройка на PythonAnywhere

### 2.1 Клонирование репозитория

Откройте Bash консоль на PythonAnywhere:

```bash
# Клонируйте ваш репозиторий
git clone https://github.com/ваш-username/shirokiy_messenger.git
cd shirokiy_messenger
```

### 2.2 Создание виртуального окружения

```bash
# Создайте виртуальное окружение с Python 3.10+
mkvirtualenv --python=/usr/bin/python3.10 shirokiy_env

# Активируйте виртуальное окружение
workon shirokiy_env

# Установите зависимости
pip install -r requirements.txt
```

### 2.3 Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
nano .env
```

Добавьте:

```
SECRET_KEY=замените-на-новый-секретный-ключ
DEBUG=False
ALLOWED_HOSTS=yourusername.pythonanywhere.com
VAPID_PUBLIC_KEY=ваш-публичный-ключ
VAPID_PRIVATE_KEY=ваш-приватный-ключ
VAPID_ADMIN_EMAIL=admin@yourdomain.com
```

### 2.4 Настройка Django

```bash
# Соберите статические файлы
python manage.py collectstatic --noinput

# Примените миграции
python manage.py migrate

# Создайте суперпользователя
python manage.py createsuperuser
```

## Шаг 3: Настройка Web App на PythonAnywhere

1. Перейдите в раздел **Web** на PythonAnywhere
2. Нажмите **Add a new web app**
3. Выберите **Manual configuration**
4. Выберите Python 3.10

### 3.1 Настройка WSGI файла

Откройте WSGI configuration file (ссылка будет на странице Web):

```python
import os
import sys
from pathlib import Path

# Добавьте путь к проекту
path = '/home/yourusername/shirokiy_messenger'
if path not in sys.path:
    sys.path.append(path)

# Установите переменную окружения для settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'shirokiy_messenger.settings'

# Активируйте виртуальное окружение
virtualenv_path = '/home/yourusername/.virtualenvs/shirokiy_env'
activate_this = os.path.join(virtualenv_path, 'bin', 'activate_this.py')

# Для Python 3.10+ используйте exec
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 3.2 Настройка Static Files

На странице Web в разделе **Static files**:

- URL: `/static/`
- Directory: `/home/yourusername/shirokiy_messenger/staticfiles`

- URL: `/media/`
- Directory: `/home/yourusername/shirokiy_messenger/media`

### 3.3 Настройка Virtualenv

В разделе **Virtualenv**:
```
/home/yourusername/.virtualenvs/shirokiy_env
```

## Шаг 4: Обновление settings.py для продакшена

Файл `shirokiy_messenger/settings.py` уже должен быть обновлен для чтения переменных окружения (см. коммит с обновлениями).

## Шаг 5: Запуск приложения

1. Нажмите **Reload** на странице Web
2. Перейдите по адресу `https://yourusername.pythonanywhere.com`

## Обновление приложения

Когда вы вносите изменения:

```bash
# Локально
git add .
git commit -m "Описание изменений"
git push origin main

# На PythonAnywhere в Bash консоли
cd ~/shirokiy_messenger
git pull origin main
workon shirokiy_env
pip install -r requirements.txt  # если добавили новые зависимости
python manage.py collectstatic --noinput
python manage.py migrate  # если есть новые миграции
```

Затем нажмите **Reload** на странице Web.

## Важные замечания

### Ограничения PythonAnywhere (бесплатный план)

- **WebSockets НЕ РАБОТАЮТ** на бесплатном плане
- Channels и real-time чат требуют платного плана
- Redis также требует платного плана

### Решения для бесплатного плана

1. **Отключите WebSockets**: используйте polling вместо WebSockets
2. **InMemoryChannelLayer**: уже настроен в settings.py
3. **Ограниченный функционал**: real-time функции будут работать только локально

### Для полного функционала (платный план)

```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

## Логи и отладка

- Логи приложения: Web → Log files
- Ошибки: Web → Error log
- Server log: Web → Server log

## Безопасность

1. Замените SECRET_KEY на новый
2. Никогда не коммитьте .env файл в git
3. Используйте HTTPS (автоматически на PythonAnywhere)
4. Установите DEBUG=False в продакшене
5. Настройте ALLOWED_HOSTS правильно

## Поддержка

При проблемах проверьте:
- Error log на PythonAnywhere
- Правильность путей в WSGI файле
- Активацию виртуального окружения
- Права доступа к файлам

## Полезные команды

```bash
# Проверка логов
tail -f /var/log/yourusername.pythonanywhere.com.error.log

# Перезапуск приложения
touch /var/www/yourusername_pythonanywhere_com_wsgi.py

# Проверка зависимостей
pip list
```
