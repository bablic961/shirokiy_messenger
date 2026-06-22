# 🚀 Быстрая инструкция по деплою на PythonAnywhere

## Что уже готово ✅

- ✅ Git-репозиторий инициализирован
- ✅ Все файлы закоммичены
- ✅ Settings.py настроен для production
- ✅ .gitignore настроен
- ✅ WSGI файл подготовлен
- ✅ Скрипт деплоя создан

## Следующие шаги

### 1. Создайте репозиторий на GitHub

```bash
# Перейдите на https://github.com/new
# Создайте новый репозиторий с именем: shirokiy_messenger
# НЕ добавляйте README, .gitignore или license (они уже есть)
```

### 2. Запушьте код на GitHub

```bash
git remote add origin https://github.com/ВАШ_USERNAME/shirokiy_messenger.git
git push -u origin main
```

### 3. На PythonAnywhere

#### 3.1 Клонируйте репозиторий (в Bash консоли)

```bash
git clone https://github.com/ВАШ_USERNAME/shirokiy_messenger.git
cd shirokiy_messenger
```

#### 3.2 Создайте виртуальное окружение

```bash
mkvirtualenv --python=/usr/bin/python3.10 shirokiy_env
workon shirokiy_env
pip install -r requirements.txt
```

#### 3.3 Создайте .env файл

```bash
nano .env
```

Скопируйте и замените значения:

```
SECRET_KEY=СГЕНЕРИРУЙТЕ_НОВЫЙ_КЛЮЧ_ЗДЕСЬ
DEBUG=False
ALLOWED_HOSTS=ВАШЕ_ИМЯ.pythonanywhere.com
VAPID_PUBLIC_KEY=ваш_публичный_ключ
VAPID_PRIVATE_KEY=ваш_приватный_ключ
VAPID_ADMIN_EMAIL=admin@example.com
```

**Генерация SECRET_KEY:**
```python
python manage.py shell
>>> from django.core.management.utils import get_random_secret_key
>>> print(get_random_secret_key())
```

#### 3.4 Настройте Django

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

#### 3.5 Создайте Web App

1. Перейдите на вкладку **Web**
2. **Add a new web app**
3. Выберите **Manual configuration**
4. Выберите **Python 3.10**

#### 3.6 Настройте WSGI файл

Откройте WSGI configuration file (ссылка на странице Web).

**СКОПИРУЙТЕ** содержимое из файла `pythonanywhere_wsgi.py` в вашем репозитории.

**ВАЖНО:** Замените в начале файла:
```python
USERNAME = 'ВАШЕ_ИМЯ'  # ← ваш username на PythonAnywhere
```

#### 3.7 Настройте Static Files

На странице Web в разделе **Static files** добавьте:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/ВАШЕ_ИМЯ/shirokiy_messenger/staticfiles` |
| `/media/` | `/home/ВАШЕ_ИМЯ/shirokiy_messenger/media` |

#### 3.8 Настройте Virtualenv

В поле **Virtualenv**:
```
/home/ВАШЕ_ИМЯ/.virtualenvs/shirokiy_env
```

#### 3.9 Reload и запуск

Нажмите большую зеленую кнопку **Reload**

Ваше приложение доступно по адресу: `https://ВАШЕ_ИМЯ.pythonanywhere.com`

## 🔄 Обновление приложения

После изменений в коде:

```bash
# Локально
git add .
git commit -m "Описание изменений"
git push origin main

# На PythonAnywhere
cd ~/shirokiy_messenger
bash deploy.sh
```

Или вручную:
```bash
cd ~/shirokiy_messenger
git pull origin main
workon shirokiy_env
pip install -r requirements.txt  # если добавили зависимости
python manage.py migrate  # если есть миграции
python manage.py collectstatic --noinput
touch /var/www/ВАШЕ_ИМЯ_pythonanywhere_com_wsgi.py
```

## ⚠️ Важные замечания

### Ограничения бесплатного плана PythonAnywhere:

- ❌ **WebSockets НЕ работают** (нет real-time чата)
- ❌ **Redis недоступен** (используется InMemoryChannelLayer)
- ✅ Все остальные функции работают
- ✅ HTTP API работает
- ✅ Push-уведомления работают
- ✅ Загрузка файлов работает

### Для real-time чата нужен платный план

Если хотите WebSockets, нужен план Hacker ($5/месяц) или выше.

## 🐛 Решение проблем

### Ошибки при загрузке

Проверьте логи:
- Web → Error log
- Web → Server log

### Статика не загружается

```bash
python manage.py collectstatic --clear --noinput
```

### 500 Internal Server Error

1. Проверьте Error log
2. Убедитесь, что SECRET_KEY установлен в .env
3. Проверьте ALLOWED_HOSTS в .env
4. Проверьте пути в WSGI файле

### База данных

```bash
python manage.py migrate --run-syncdb
```

## 📚 Полная документация

Для подробной информации смотрите:
- [PYTHONANYWHERE_DEPLOYMENT.md](PYTHONANYWHERE_DEPLOYMENT.md) - Полная инструкция
- [README.md](README.md) - Общая информация о проекте
- [USER_GUIDE.md](USER_GUIDE.md) - Руководство пользователя

## 🎉 Готово!

После деплоя у вас будет работающий мессенджер с:
- Регистрацией и авторизацией
- Профилями пользователей
- Личными и групповыми чатами
- Отправкой файлов
- Push-уведомлениями
- Темной темой
- Поиском и реакциями

---

**Время деплоя:** ~15-20 минут  
**Сложность:** Средняя  
**Стоимость:** Бесплатно (с ограничениями)
