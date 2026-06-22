# 🐛 Исправления v2.1.1

**Дата:** 22 июня 2026
**Коммит:** 86f6b79

## Исправленные проблемы:

### 1. ✅ Имя отправителя теперь видно
**Проблема:** Имя отправителя в групповых чатах не отображалось

**Решение:**
```css
.message-sender {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.9;
    display: block;  /* Добавлено */
    color: inherit;  /* Добавлено */
}
```

### 2. ✅ Голосовые сообщения не вылазят за пузырьки
**Проблема:** Голосовые плееры были шире чем message-bubble

**Решение:**
```css
.message-voice,
.voice-player {
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;  /* Ключевое изменение */
}
```

### 3. ✅ Видео-кружки не вылазят за пузырьки
**Проблема:** Видео-кружки переполняли пузырек сообщения

**Решение:**
```css
.message-video-note,
.video-note-player {
    max-width: 100%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
}

@media (max-width: 768px) {
    .message-video-note,
    .video-note-player {
        width: 180px;
        height: 180px;
    }
}
```

### 4. ✅ Улучшена темная тема для имен
**Проблема:** Имя отправителя плохо читалось в темной теме

**Решение:**
```css
body.dark-theme .message-sender {
    color: #94a3b8;
    opacity: 1;
}

body.dark-theme .message-group.own .message-sender {
    color: rgba(255, 255, 255, 0.9);
}
```

### 5. ✅ Файлы корректно отображаются
**Проблема:** Длинные имена файлов вылезали за границы

**Решение:**
```css
.file-attachment {
    max-width: 100%;
    box-sizing: border-box;
}

.file-info {
    flex: 1;
    min-width: 0;  /* Позволяет text-overflow работать */
}

.file-name {
    word-break: break-word;
}
```

## 🚀 Как обновить на PythonAnywhere:

```bash
cd ~/shirokiy_messenger
git pull origin main
python manage.py collectstatic --noinput
# Перезапустите веб-приложение через интерфейс PythonAnywhere
```

## 📝 Затронутые файлы:

- `static/mobile-redesign.css` - обновлены стили
- `templates/messenger/chat.html` - обновлены встроенные стили

## ✨ Результат:

Теперь все медиа-элементы корректно помещаются внутри пузырьков сообщений, а имена отправителей отображаются правильно как в светлой, так и в темной теме.

---

**Статус:** ✅ Готово к деплою
**GitHub:** https://github.com/bablic961/shirokiy_messenger/commit/86f6b79
