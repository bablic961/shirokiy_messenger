// Плеер для воспроизведения голосовых сообщений

class VoicePlayer {
    constructor() {
        this.currentAudio = null;
        this.currentPlayerId = null;
    }

    createPlayer(voiceUrl, messageId) {
        const container = document.createElement('div');
        container.className = 'voice-player';
        container.id = `voice-player-${messageId}`;
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0,0,0,0.05);
            border-radius: 20px;
            margin-top: 8px;
            min-width: 280px;
        `;

        const audio = new Audio(voiceUrl);

        const playButton = document.createElement('button');
        playButton.className = 'voice-play-button';
        playButton.innerHTML = '▶️';
        playButton.style.cssText = `
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 16px;
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        `;

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;

        const progressBar = document.createElement('div');
        progressBar.className = 'voice-progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(0,0,0,0.1);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
        `;

        const progressFill = document.createElement('div');
        progressFill.className = 'voice-progress-fill';
        progressFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
            transition: width 0.1s linear;
        `;

        progressBar.appendChild(progressFill);

        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'voice-time-display';
        timeDisplay.style.cssText = `
            font-size: 12px;
            color: #6b7280;
            font-family: monospace;
            font-weight: 600;
        `;
        timeDisplay.textContent = '0:00 / 0:00';

        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(timeDisplay);

        container.appendChild(playButton);
        container.appendChild(progressContainer);

        // Функция форматирования времени
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Обновление длительности
        audio.addEventListener('loadedmetadata', () => {
            timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
        });

        // Обновление прогресса
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        });

        // Окончание воспроизведения
        audio.addEventListener('ended', () => {
            playButton.innerHTML = '▶️';
            progressFill.style.width = '0%';
            timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
            this.currentAudio = null;
            this.currentPlayerId = null;
        });

        // Кнопка воспроизведения/паузы
        playButton.addEventListener('click', () => {
            if (this.currentAudio && this.currentAudio !== audio) {
                this.currentAudio.pause();
                const prevButton = document.querySelector(`#voice-player-${this.currentPlayerId} .voice-play-button`);
                if (prevButton) {
                    prevButton.innerHTML = '▶️';
                }
            }

            if (audio.paused) {
                audio.play();
                playButton.innerHTML = '⏸️';
                this.currentAudio = audio;
                this.currentPlayerId = messageId;
            } else {
                audio.pause();
                playButton.innerHTML = '▶️';
                this.currentAudio = null;
                this.currentPlayerId = null;
            }
        });

        // Клик по прогресс-бару
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            audio.currentTime = percentage * audio.duration;
        });

        // Hover эффекты
        playButton.addEventListener('mouseenter', () => {
            playButton.style.transform = 'scale(1.1)';
        });

        playButton.addEventListener('mouseleave', () => {
            playButton.style.transform = 'scale(1)';
        });

        return container;
    }
}

// Глобальный экземпляр
window.voicePlayer = new VoicePlayer();

// Автоматическая инициализация плееров для существующих голосовых сообщений
document.addEventListener('DOMContentLoaded', () => {
    const voiceMessages = document.querySelectorAll('.message-voice');
    voiceMessages.forEach(voiceMsg => {
        // Проверяем, что плеер еще не создан
        if (voiceMsg.querySelector('.voice-player')) {
            return;
        }

        const voiceUrl = voiceMsg.dataset.voiceUrl;
        const messageId = voiceMsg.dataset.messageId;
        if (voiceUrl && messageId) {
            const player = window.voicePlayer.createPlayer(voiceUrl, messageId);
            voiceMsg.appendChild(player);
        }
    });
});

console.log('✅ voice-player.js загружен');
