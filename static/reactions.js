// Функции для работы с реакциями на сообщения

// Переключение пикера реакций
window.toggleReactionPicker = function(messageId) {
    const picker = document.getElementById(`picker-${messageId}`);
    if (!picker) {
        console.error('Пикер реакций не найден для сообщения:', messageId);
        return;
    }

    // Закрываем все остальные пикеры
    document.querySelectorAll('.reaction-picker').forEach(p => {
        if (p.id !== `picker-${messageId}`) {
            p.classList.remove('active');
        }
    });

    picker.classList.toggle('active');
};

// Добавление/удаление реакции
window.addReaction = async function(messageId, emoji) {
    try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!csrfToken) {
            console.error('CSRF token не найден');
            return;
        }

        const response = await fetch(`/api/add-reaction/${messageId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken.value
            },
            body: JSON.stringify({ emoji: emoji })
        });

        const data = await response.json();

        if (data.status === 'added' || data.status === 'removed') {
            // Закрываем пикер
            const picker = document.getElementById(`picker-${messageId}`);
            if (picker) {
                picker.classList.remove('active');
            }

            // Перезагружаем страницу для обновления реакций
            location.reload();
        } else {
            console.error('Ошибка добавления реакции:', data);
        }
    } catch (error) {
        console.error('Ошибка добавления реакции:', error);
    }
};

// Закрытие пикеров при клике вне их
document.addEventListener('click', function(e) {
    if (!e.target.closest('.add-reaction-button') && !e.target.closest('.reaction-picker')) {
        document.querySelectorAll('.reaction-picker').forEach(p => p.classList.remove('active'));
    }
});

console.log('✅ reactions.js загружен');
