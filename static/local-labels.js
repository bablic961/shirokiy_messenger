// Локальные подписи пользователей (клиентская сторона)
class LocalUserLabels {
    constructor() {
        this.labels = this.loadLabels();
    }

    // Загрузка меток из localStorage
    loadLabels() {
        const saved = localStorage.getItem('userLabels');
        return saved ? JSON.parse(saved) : {};
    }

    // Сохранение меток в localStorage
    saveLabels() {
        localStorage.setItem('userLabels', JSON.stringify(this.labels));
    }

    // Установить метку для пользователя
    setLabel(userId, label) {
        if (label && label.trim()) {
            this.labels[userId] = label.trim();
        } else {
            delete this.labels[userId];
        }
        this.saveLabels();
    }

    // Получить метку пользователя
    getLabel(userId) {
        return this.labels[userId] || null;
    }

    // Удалить метку
    removeLabel(userId) {
        delete this.labels[userId];
        this.saveLabels();
    }

    // Получить все метки
    getAllLabels() {
        return this.labels;
    }

    // Применить метки к элементам на странице
    applyLabelsToPage() {
        // Ищем все элементы с data-user-id
        const userElements = document.querySelectorAll('[data-user-id]');
        console.log(`🔍 Найдено ${userElements.length} элементов с data-user-id`);

        userElements.forEach(element => {
            const userId = element.getAttribute('data-user-id');
            const label = this.getLabel(userId);

            if (label) {
                console.log(`✅ Метка для userId=${userId}: "${label}"`);

                // Находим элемент с именем пользователя
                const nameElement = element.querySelector('.chat-name, .user-name, .chat-header-name, .message-sender');

                if (nameElement) {
                    console.log(`✅ Найден nameElement для userId=${userId}:`, nameElement);

                    const originalName = nameElement.getAttribute('data-original-name') || nameElement.textContent.trim();

                    if (!nameElement.getAttribute('data-original-name')) {
                        nameElement.setAttribute('data-original-name', originalName);
                    }

                    // Проверяем, не применена ли уже метка
                    const currentHTML = nameElement.innerHTML;
                    if (!currentHTML.includes('local-label-tag')) {
                        // ЗАМЕНЯЕМ имя на метку (а не добавляем в скобках)
                        const isDarkTheme = document.body.classList.contains('dark-theme');
                        const labelColor = 'white';
                        const labelBg = isDarkTheme ? 'rgba(102, 126, 234, 0.8)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

                        nameElement.innerHTML = `<span class="local-label-tag" style="color: ${labelColor}; font-weight: 700; font-size: 1em; background: ${labelBg}; padding: 4px 10px; border-radius: 8px; display: inline-block;">${label}</span>`;
                        console.log(`✅ Метка применена для userId=${userId}`);
                    } else {
                        console.log(`⚠️ Метка уже применена для userId=${userId}`);
                    }
                } else {
                    console.warn(`⚠️ nameElement не найден для userId=${userId}`);
                }
            }
        });
    }

    // Запустить наблюдатель за изменениями DOM
    startObserver() {
        const observer = new MutationObserver(() => {
            this.applyLabelsToPage();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // Показать диалог для редактирования метки
    showEditDialog(userId, currentName, callback) {
        const currentLabel = this.getLabel(userId);
        const isDarkTheme = document.body.classList.contains('dark-theme');

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        const bgColor = isDarkTheme ? '#1e293b' : 'white';
        const textColor = isDarkTheme ? '#e2e8f0' : '#1f2937';
        const subTextColor = isDarkTheme ? '#94a3b8' : '#6b7280';
        const inputBg = isDarkTheme ? '#0f172a' : '#f9fafb';
        const borderColor = isDarkTheme ? '#334155' : '#e5e7eb';

        dialog.innerHTML = `
            <div style="
                background: ${bgColor};
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
            ">
                <h3 style="margin: 0 0 10px 0; font-size: 20px; color: ${textColor};">
                    Локальная подпись
                </h3>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: ${subTextColor};">
                    Для: <strong>${currentName}</strong>
                </p>
                <input
                    type="text"
                    id="labelInput"
                    placeholder="Введите подпись (псевдоним, метку)..."
                    value="${currentLabel || ''}"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid ${borderColor};
                        border-radius: 12px;
                        font-size: 15px;
                        margin-bottom: 20px;
                        font-family: inherit;
                        background: ${inputBg};
                        color: ${textColor};
                    "
                />
                <div style="
                    font-size: 13px;
                    color: ${subTextColor};
                    margin-bottom: 20px;
                    line-height: 1.5;
                ">
                    💡 Подпись сохраняется только на этом устройстве. Другие пользователи её не видят.
                </div>
                <div style="display: flex; gap: 10px;">
                    <button
                        id="saveLabel"
                        style="
                            flex: 1;
                            padding: 12px;
                            border: none;
                            border-radius: 12px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        💾 Сохранить
                    </button>
                    <button
                        id="removeLabel"
                        style="
                            padding: 12px 20px;
                            border: none;
                            border-radius: 12px;
                            background: #fee;
                            color: #ef4444;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        🗑️
                    </button>
                    <button
                        id="cancelLabel"
                        style="
                            padding: 12px 20px;
                            border: none;
                            border-radius: 12px;
                            background: ${isDarkTheme ? '#334155' : '#f3f4f6'};
                            color: ${isDarkTheme ? '#e2e8f0' : '#4b5563'};
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        ✕
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('#labelInput');
        const saveBtn = dialog.querySelector('#saveLabel');
        const removeBtn = dialog.querySelector('#removeLabel');
        const cancelBtn = dialog.querySelector('#cancelLabel');

        input.focus();

        const close = () => {
            dialog.style.opacity = '0';
            setTimeout(() => dialog.remove(), 200);
        };

        saveBtn.addEventListener('click', () => {
            const label = input.value.trim();
            this.setLabel(userId, label);
            close();
            if (callback) callback();
        });

        removeBtn.addEventListener('click', () => {
            this.removeLabel(userId);
            close();
            if (callback) callback();
        });

        cancelBtn.addEventListener('click', close);

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) close();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }
}

// Экспортируем глобально
window.LocalUserLabels = LocalUserLabels;

// Инициализируем сразу после определения класса
if (!window.userLabels) {
    window.userLabels = new LocalUserLabels();
    console.log('✅ window.userLabels автоматически инициализирован из local-labels.js');
}

// CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
