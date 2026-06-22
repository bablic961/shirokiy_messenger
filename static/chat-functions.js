// Функции для работы с чатом

// Функция переключения панели поиска
window.toggleSearch = function() {
    const searchPanel = document.getElementById('searchPanel');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchPanel || !searchInput || !searchResults) {
        console.error('Элементы поиска не найдены');
        return;
    }

    searchPanel.classList.toggle('active');
    if (searchPanel.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        searchResults.innerHTML = '';
    }
};

// Функция редактирования метки в чате
window.editChatUserLabel = function(userId, username) {
    console.log('editChatUserLabel вызвана для userId:', userId);

    if (window.userLabels) {
        console.log('✅ window.userLabels найден, открываем диалог');
        window.userLabels.showEditDialog(userId, username, function() {
            window.userLabels.applyLabelsToPage();
        });
    } else {
        console.error('❌ window.userLabels не инициализирован');
        alert('Ошибка: система меток не загружена. Попробуйте обновить страницу (Ctrl+Shift+R).');
    }
};

// Функция редактирования метки пользователя (из поиска)
window.editUserLabel = function(userId, username) {
    console.log('editUserLabel вызвана для userId:', userId);

    if (window.userLabels) {
        console.log('✅ window.userLabels найден, открываем диалог');
        window.userLabels.showEditDialog(userId, username, function() {
            window.userLabels.applyLabelsToPage();
        });
    } else {
        console.error('❌ window.userLabels не инициализирован');
        alert('Ошибка: система меток не загружена. Попробуйте обновить страницу (Ctrl+Shift+R).');
    }
};

console.log('✅ chat-functions.js загружен');
