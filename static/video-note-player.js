// Плеер для воспроизведения видео-кружков

class VideoNotePlayer {
    constructor() {
        this.currentVideo = null;
        this.currentPlayerId = null;
    }

    createPlayer(videoUrl, messageId) {
        const container = document.createElement('div');
        container.className = 'video-note-player';
        container.id = `video-note-player-${messageId}`;
        container.style.cssText = `
            position: relative;
            width: 200px;
            height: 200px;
            margin-top: 8px;
            border-radius: 50%;
            overflow: hidden;
        `;

        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: #000;
            cursor: pointer;
            display: block;
        `;

        const playOverlay = document.createElement('div');
        playOverlay.className = 'video-note-play-overlay';
        playOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s;
        `;

        const playButton = document.createElement('div');
        playButton.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.2s;
        `;
        playButton.innerHTML = '▶️';

        playOverlay.appendChild(playButton);

        const progressRing = document.createElement('svg');
        progressRing.style.cssText = `
            position: absolute;
            top: -4px;
            left: -4px;
            width: calc(100% + 8px);
            height: calc(100% + 8px);
            transform: rotate(-90deg);
            pointer-events: none;
        `;
        progressRing.innerHTML = `
            <circle cx="50%" cy="50%" r="48%"
                stroke="rgba(102, 126, 234, 0.3)"
                stroke-width="4"
                fill="none" />
            <circle id="progress-circle-${messageId}"
                cx="50%" cy="50%" r="48%"
                stroke="url(#gradient-${messageId})"
                stroke-width="4"
                fill="none"
                stroke-dasharray="0 1000"
                stroke-linecap="round"
                style="transition: stroke-dasharray 0.1s linear;" />
            <defs>
                <linearGradient id="gradient-${messageId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
        `;

        const timeOverlay = document.createElement('div');
        timeOverlay.className = 'video-note-time';
        timeOverlay.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            font-family: monospace;
            display: none;
        `;

        container.appendChild(videoElement);
        container.appendChild(playOverlay);
        container.appendChild(progressRing);
        container.appendChild(timeOverlay);

        // Функция форматирования времени
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Обновление прогресса
        videoElement.addEventListener('timeupdate', () => {
            const progress = (videoElement.currentTime / videoElement.duration) * 100;
            const circumference = 2 * Math.PI * 48; // r=48%
            const offset = circumference - (progress / 100) * circumference;

            const progressCircle = document.getElementById(`progress-circle-${messageId}`);
            if (progressCircle) {
                progressCircle.style.strokeDasharray = `${circumference - offset} ${circumference}`;
            }

            timeOverlay.textContent = `${formatTime(videoElement.currentTime)} / ${formatTime(videoElement.duration)}`;
        });

        // Воспроизведение/пауза
        const togglePlay = () => {
            if (this.currentVideo && this.currentVideo !== videoElement) {
                this.currentVideo.pause();
                const prevOverlay = document.querySelector(`#video-note-player-${this.currentPlayerId} .video-note-play-overlay`);
                if (prevOverlay) {
                    prevOverlay.style.display = 'flex';
                }
            }

            if (videoElement.paused) {
                videoElement.play();
                playOverlay.style.display = 'none';
                timeOverlay.style.display = 'block';
                this.currentVideo = videoElement;
                this.currentPlayerId = messageId;
            } else {
                videoElement.pause();
                playOverlay.style.display = 'flex';
            }
        };

        playOverlay.addEventListener('click', togglePlay);
        videoElement.addEventListener('click', togglePlay);

        // Окончание воспроизведения
        videoElement.addEventListener('ended', () => {
            playOverlay.style.display = 'flex';
            timeOverlay.style.display = 'none';
            videoElement.currentTime = 0;
            this.currentVideo = null;
            this.currentPlayerId = null;
        });

        // Пауза при клике на видео
        videoElement.addEventListener('pause', () => {
            if (videoElement.currentTime > 0 && videoElement.currentTime < videoElement.duration) {
                playOverlay.style.display = 'flex';
            }
        });

        // Hover эффекты
        playOverlay.addEventListener('mouseenter', () => {
            playButton.style.transform = 'scale(1.1)';
            playOverlay.style.background = 'rgba(0,0,0,0.4)';
        });

        playOverlay.addEventListener('mouseleave', () => {
            playButton.style.transform = 'scale(1)';
            playOverlay.style.background = 'rgba(0,0,0,0.3)';
        });

        return container;
    }
}

// Глобальный экземпляр
window.videoNotePlayer = new VideoNotePlayer();

// Автоматическая инициализация плееров для существующих видео-кружков
document.addEventListener('DOMContentLoaded', () => {
    const videoNotes = document.querySelectorAll('.message-video-note');
    videoNotes.forEach(videoNote => {
        // Проверяем, что плеер еще не создан
        if (videoNote.querySelector('.video-note-player')) {
            return;
        }

        const videoUrl = videoNote.dataset.videoUrl;
        const messageId = videoNote.dataset.messageId;
        if (videoUrl && messageId) {
            const player = window.videoNotePlayer.createPlayer(videoUrl, messageId);
            videoNote.appendChild(player);
        }
    });
});

console.log('✅ video-note-player.js загружен');
