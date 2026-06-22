"""
WSGI config for shirokiy_messenger project on PythonAnywhere.

Этот файл нужно скопировать в WSGI configuration file на PythonAnywhere.
Путь к файлу будет указан на странице Web после создания web app.

ВАЖНО: Замените 'yourusername' на ваше имя пользователя PythonAnywhere!
"""

import os
import sys
from pathlib import Path

# ================================
# НАСТРОЙТЕ ЭТИ ПЕРЕМЕННЫЕ
# ================================
USERNAME = 'yourusername'  # ← Замените на ваш username на PythonAnywhere
PROJECT_NAME = 'shirokiy_messenger'
VIRTUALENV_NAME = 'shirokiy_env'

# ================================
# Пути
# ================================
project_path = f'/home/{USERNAME}/{PROJECT_NAME}'
virtualenv_path = f'/home/{USERNAME}/.virtualenvs/{VIRTUALENV_NAME}'

# Добавьте путь к проекту
if project_path not in sys.path:
    sys.path.insert(0, project_path)

# Установите переменную окружения для settings
os.environ['DJANGO_SETTINGS_MODULE'] = f'{PROJECT_NAME}.settings'

# ================================
# Загрузка переменных окружения из .env
# ================================
env_file = os.path.join(project_path, '.env')
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

# ================================
# Активация виртуального окружения
# ================================
activate_this = os.path.join(virtualenv_path, 'bin', 'activate_this.py')

# Для Python 3.6+
if os.path.exists(activate_this):
    with open(activate_this) as file_:
        exec(file_.read(), dict(__file__=activate_this))
else:
    # Альтернативный метод для Python 3.10+
    site_packages = os.path.join(virtualenv_path, 'lib', f'python{sys.version_info.major}.{sys.version_info.minor}', 'site-packages')
    if os.path.exists(site_packages):
        sys.path.insert(0, site_packages)

# ================================
# Django WSGI Application
# ================================
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
