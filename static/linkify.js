// Утилита для преобразования ссылок в текстах сообщений в кликабельные

/**
 * Преобразует URL в тексте в кликабельные HTML-ссылки
 * @param {string} text - Текст сообщения
 * @returns {string} HTML с кликабельными ссылками
 */
function linkify(text) {
    if (!text) return text;

    // Экранируем HTML
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // Паттерн для поиска URL
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;

    // Экранируем текст и заменяем URL на ссылки
    const escapedText = escapeHtml(text);

    return escapedText.replace(urlPattern, (url) => {
        // Убираем возможные trailing символы
        let cleanUrl = url;

        // Определяем текст для отображения (укороченный если длинный)
        let displayUrl = cleanUrl;
        if (displayUrl.length > 50) {
            displayUrl = displayUrl.substring(0, 47) + '...';
        }

        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="message-link">${displayUrl}</a>`;
    });
}

/**
 * Применяет linkify ко всем сообщениям на странице
 */
function linkifyMessages() {
    const messageTexts = document.querySelectorAll('.message-text');

    messageTexts.forEach(element => {
        // Пропускаем если уже обработано
        if (element.hasAttribute('data-linkified')) {
            return;
        }

        const originalText = element.textContent;
        const linkedText = linkify(originalText);

        // Если текст изменился, обновляем содержимое
        if (linkedText !== escapeHtml(originalText)) {
            element.innerHTML = linkedText;
        }

        element.setAttribute('data-linkified', 'true');
    });
}

/**
 * Вспомогательная функция для экранирования HTML
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Экспортируем функции глобально
window.linkify = linkify;
window.linkifyMessages = linkifyMessages;
