// Модуль для записи голосовых сообщений

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.visualizer = null;
        this.startTime = null;
        this.timerInterval = null;
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            // Настройка визуализации
            this.setupVisualization();

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();

            this.showRecordingUI();
            this.startTimer();

            console.log('🎤 Запись голосового сообщения начата');

        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.');
        }
    }

    setupVisualization() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);

        this.visualize();
    }

    visualize() {
        const canvas = document.getElementById('voiceVisualizerCanvas');
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording) return;

            requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;

                const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');

                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    startTimer() {
        const timerEl = document.getElementById('voiceTimer');
        if (!timerEl) return;

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            if (this.audioContext) {
                this.audioContext.close();
            }

            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            console.log('🛑 Запись голосового сообщения остановлена');
        }
    }

    cancelRecording() {
        this.stopRecording();
        this.audioChunks = [];
        this.hideRecordingUI();
        console.log('❌ Запись голосового сообщения отменена');
    }

    handleRecordingComplete() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.hideRecordingUI();
        this.sendVoiceMessage(audioBlob);
    }

    async sendVoiceMessage(audioBlob) {
        const chatId = document.querySelector('.input-area').dataset.chatId;
        const formData = new FormData();

        const fileName = `voice_${Date.now()}.webm`;
        formData.append('voice', audioBlob, fileName);
        formData.append('chat_id', chatId);

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch('/api/send-voice/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });

            if (response.ok) {
                console.log('✅ Голосовое сообщение отправлено');
                setTimeout(() => location.reload(), 500);
            } else {
                console.error('Ошибка отправки голосового сообщения');
                alert('Не удалось отправить голосовое сообщение');
            }
        } catch (error) {
            console.error('Ошибка отправки:', error);
            alert('Ошибка отправки голосового сообщения');
        }
    }

    showRecordingUI() {
        const inputArea = document.querySelector('.input-area');

        const recordingUI = document.createElement('div');
        recordingUI.id = 'voiceRecordingUI';
        recordingUI.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: slideUpVoice 0.3s ease;
        `;

        recordingUI.innerHTML = `
            <style>
                @keyframes slideUpVoice {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
            <div style="display: flex; align-items: center; justify-content: space-between; color: white;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s ease-in-out infinite;"></div>
                    <span style="font-size: 18px; font-weight: 600;">Запись голосового...</span>
                </div>
                <span id="voiceTimer" style="font-size: 16px; font-family: monospace; font-weight: 600;">0:00</span>
            </div>
            <canvas id="voiceVisualizerCanvas" width="600" height="80" style="width: 100%; height: 80px; border-radius: 10px; background: rgba(255,255,255,0.1);"></canvas>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="window.voiceRecorder.cancelRecording()" style="
                    padding: 12px 24px;
                    border: none;
                    border-radius: 25px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    ❌ Отменить
                </button>
                <button onclick="window.voiceRecorder.stopRecording()" style="
                    padding: 12px 32px;
                    border: none;
                    border-radius: 25px;
                    background: white;
                    color: #667eea;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ✅ Отправить
                </button>
            </div>
        `;

        inputArea.style.position = 'relative';
        inputArea.appendChild(recordingUI);
    }

    hideRecordingUI() {
        const recordingUI = document.getElementById('voiceRecordingUI');
        if (recordingUI) {
            recordingUI.style.animation = 'slideUpVoice 0.3s ease reverse';
            setTimeout(() => recordingUI.remove(), 300);
        }
    }
}

// Глобальный экземпляр
window.voiceRecorder = new VoiceRecorder();

// Функция для запуска записи (вызывается из chat.html)
window.startVoiceRecording = function() {
    window.voiceRecorder.startRecording();
};

console.log('✅ voice-recorder.js загружен');
