// Функции для записи голосовых сообщений и видео-кружков

let mediaRecorder = null;
let recordedChunks = [];
let recordingType = null; // 'voice' или 'video_note'
let videoStream = null;

// Запуск записи голосового сообщения
window.startVoiceRecording = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        recordingType = 'voice';

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            sendRecording(blob, 'voice');
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        console.log('✅ Запись голосового сообщения начата');

        // Показываем индикатор записи
        showRecordingIndicator('voice');

        return true;
    } catch (error) {
        console.error('❌ Ошибка доступа к микрофону:', error);
        alert('Не удалось получить доступ к микрофону. Разрешите доступ в настройках браузера.');
        return false;
    }
};

// Запуск записи видео-кружка
window.startVideoNoteRecording = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
                width: { ideal: 640 },
                height: { ideal: 640 },
                facingMode: 'user'
            }
        });

        videoStream = stream;
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        recordingType = 'video_note';

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            sendRecording(blob, 'video_note');
            stream.getTracks().forEach(track => track.stop());
            hideVideoPreview();
        };

        mediaRecorder.start();
        console.log('✅ Запись видео-кружка начата');

        // Показываем превью видео
        showVideoPreview(stream);

        return true;
    } catch (error) {
        console.error('❌ Ошибка доступа к камере:', error);
        alert('Не удалось получить доступ к камере. Разрешите доступ в настройках браузера.');
        return false;
    }
};

// Остановка записи
window.stopRecording = function() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        hideRecordingIndicator();
        console.log('✅ Запись остановлена');
    }
};

// Отмена записи
window.cancelRecording = function() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordedChunks = [];
        hideRecordingIndicator();
        hideVideoPreview();
        console.log('⚠️ Запись отменена');
    }
};

// Отправка записи на сервер
async function sendRecording(blob, type) {
    const formData = new FormData();
    const chatId = document.querySelector('[data-chat-id]')?.getAttribute('data-chat-id');

    if (!chatId) {
        console.error('❌ Chat ID не найден');
        return;
    }

    const fileName = type === 'voice'
        ? `voice_${Date.now()}.webm`
        : `video_note_${Date.now()}.webm`;

    formData.append(type, blob, fileName);
    formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

    try {
        const response = await fetch(`/chat/${chatId}/`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            console.log('✅ Запись отправлена');
            location.reload();
        } else {
            console.error('❌ Ошибка отправки');
            alert('Не удалось отправить запись');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        alert('Произошла ошибка при отправке');
    }
}

// Показать индикатор записи голоса
function showRecordingIndicator(type) {
    const indicator = document.createElement('div');
    indicator.id = 'recordingIndicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        gap: 12px;
        align-items: center;
        animation: pulse 1.5s infinite;
    `;

    indicator.innerHTML = `
        <span style="width: 12px; height: 12px; background: white; border-radius: 50%;"></span>
        <span style="font-weight: 600;">${type === 'voice' ? '🎤 Идёт запись...' : '📹 Идёт запись...'}</span>
        <button onclick="stopRecording()" style="background: white; color: #ef4444; border: none; padding: 4px 12px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-left: 8px;">Готово</button>
        <button onclick="cancelRecording()" style="background: transparent; color: white; border: 1px solid white; padding: 4px 12px; border-radius: 12px; font-weight: 600; cursor: pointer;">Отмена</button>
    `;

    document.body.appendChild(indicator);
}

// Скрыть индикатор записи
function hideRecordingIndicator() {
    const indicator = document.getElementById('recordingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Показать превью видео
function showVideoPreview(stream) {
    const preview = document.createElement('div');
    preview.id = 'videoPreview';
    preview.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        height: 320px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 999;
        border: 4px solid #ef4444;
    `;

    const video = document.createElement('video');
    video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1);
    `;
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    preview.appendChild(video);
    document.body.appendChild(preview);

    showRecordingIndicator('video_note');
}

// Скрыть превью видео
function hideVideoPreview() {
    const preview = document.getElementById('videoPreview');
    if (preview) {
        preview.remove();
    }
}

// CSS для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;
document.head.appendChild(style);

console.log('✅ voice-video.js загружен');
