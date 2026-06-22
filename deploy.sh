#!/bin/bash
# Скрипт для быстрого обновления приложения на PythonAnywhere

echo "=== Обновление Shirokiy Messenger на PythonAnywhere ==="

# Переход в директорию проекта
cd ~/shirokiy_messenger || exit 1

# Получение последних изменений
echo "→ Получение изменений из GitHub..."
git pull origin main

# Активация виртуального окружения
echo "→ Активация виртуального окружения..."
source ~/.virtualenvs/shirokiy_env/bin/activate

# Установка/обновление зависимостей
echo "→ Обновление зависимостей..."
pip install -r requirements.txt --quiet

# Применение миграций
echo "→ Применение миграций базы данных..."
python manage.py migrate --noinput

# Сбор статических файлов
echo "→ Сборка статических файлов..."
python manage.py collectstatic --noinput --clear

# Перезагрузка приложения (нужно заменить yourusername)
echo "→ Перезагрузка веб-приложения..."
touch /var/www/yourusername_pythonanywhere_com_wsgi.py

echo "✓ Обновление завершено!"
echo ""
echo "Проверьте работу приложения:"
echo "https://yourusername.pythonanywhere.com"
