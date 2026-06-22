// Модуль для записи видео-кружков (круглых видеосообщений)

class VideoNoteRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.videoChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.startTime = null;
        this.timerInterval = null;
        this.previewVideo = null;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 640 },
                    facingMode: 'user'
                },
                audio: true
            });

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            this.videoChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.videoChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();

            this.showRecordingUI();
            this.startTimer();

            console.log('📹 Запись видео-кружка начата');

        } catch (error) {
            console.error('Ошибка доступа к камере:', error);
            alert('Не удалось получить доступ к камере и микрофону. Проверьте разрешения браузера.');
        }
    }

    startTimer() {
        const timerEl = document.getElementById('videoNoteTimer');
        if (!timerEl) return;

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Автоматическая остановка через 60 секунд
            if (elapsed >= 60) {
                this.stopRecording();
            }
        }, 1000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            console.log('🛑 Запись видео-кружка остановлена');
        }
    }

    cancelRecording() {
        this.stopRecording();
        this.videoChunks = [];
        this.hideRecordingUI();
        console.log('❌ Запись видео-кружка отменена');
    }

    handleRecordingComplete() {
        const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
        this.hideRecordingUI();
        this.sendVideoNote(videoBlob);
    }

    async sendVideoNote(videoBlob) {
        const chatId = document.querySelector('.input-area').dataset.chatId;
        const formData = new FormData();

        const fileName = `video_note_${Date.now()}.webm`;
        formData.append('video_note', videoBlob, fileName);
        formData.append('chat_id', chatId);

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch('/api/send-video-note/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            if (response.ok) {
                console.log('✅ Видео-кружок отправлен');
                setTimeout(() => location.reload(), 500);
            } else {
                console.error('Ошибка отправки видео-кружка');
                alert('Не удалось отправить видео-кружок');
            }
        } catch (error) {
            console.error('Ошибка отправки:', error);
            alert('Ошибка отправки видео-кружка');
        }
    }

    showRecordingUI() {
        const inputArea = document.querySelector('.input-area');

        const recordingUI = document.createElement('div');
        recordingUI.id = 'videoNoteRecordingUI';
        recordingUI.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            animation: fadeInScale 0.3s ease;
        `;

        recordingUI.innerHTML = `
            <style>
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                @keyframes recordingPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                }
            </style>
            <div style="position: relative;">
                <video id="videoNotePreview" autoplay muted style="
                    width: 320px;
                    height: 320px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 5px solid white;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    animation: recordingPulse 2s ease-in-out infinite;
                "></video>
                <div style="
                    position: absolute;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <div style="width: 10px; height: 10px; background: #ef4444; border-radius: 50%;"></div>
                    <span id="videoNoteTimer">0:00</span>
                </div>
            </div>
            <div style="display: flex; gap: 16px;">
                <button onclick="window.videoNoteRecorder.cancelRecording()" style="
                    width: 60px;
                    height: 60px;
                    border: none;
                    border-radius: 50%;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    ✕
                </button>
                <button onclick="window.videoNoteRecorder.stopRecording()" style="
                    width: 60px;
                    height: 60px;
                    border: none;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    ✓
                </button>
            </div>
        `;

        // Добавляем оверлей
        const overlay = document.createElement('div');
        overlay.id = 'videoNoteOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(recordingUI);

        // Показываем превью камеры
        this.previewVideo = document.getElementById('videoNotePreview');
        if (this.previewVideo && this.stream) {
            this.previewVideo.srcObject = this.stream;
        }
    }

    hideRecordingUI() {
        const recordingUI = document.getElementById('videoNoteRecordingUI');
        const overlay = document.getElementById('videoNoteOverlay');

        if (recordingUI) {
            recordingUI.style.animation = 'fadeInScale 0.3s ease reverse';
            setTimeout(() => recordingUI.remove(), 300);
        }

        if (overlay) {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// Глобальный экземпляр
window.videoNoteRecorder = new VideoNoteRecorder();

// Функция для запуска записи (вызывается из chat.html)
window.startVideoNoteRecording = function() {
    window.videoNoteRecorder.startRecording();
};

console.log('✅ video-note-recorder.js загружен');
