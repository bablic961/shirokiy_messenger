// End-to-End шифрование для Shirokiy Messenger
class E2EEncryption {
    constructor() {
        this.keyPair = null;
        this.publicKeys = new Map(); // Хранилище публичных ключей других пользователей
    }

    // Генерация пары ключей для пользователя
    async generateKeyPair() {
        try {
            this.keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ["encrypt", "decrypt"]
            );

            // Сохраняем приватный ключ в localStorage
            await this.savePrivateKey();

            // Экспортируем публичный ключ для отправки на сервер
            const publicKey = await this.exportPublicKey();

            return publicKey;
        } catch (error) {
            console.error('Ошибка генерации ключей:', error);
            return null;
        }
    }

    // Экспорт публичного ключа
    async exportPublicKey() {
        const exported = await window.crypto.subtle.exportKey(
            "spki",
            this.keyPair.publicKey
        );
        return this.arrayBufferToBase64(exported);
    }

    // Сохранение приватного ключа
    async savePrivateKey() {
        const exported = await window.crypto.subtle.exportKey(
            "pkcs8",
            this.keyPair.privateKey
        );
        const base64 = this.arrayBufferToBase64(exported);
        localStorage.setItem('privateKey', base64);
    }

    // Загрузка приватного ключа
    async loadPrivateKey() {
        const base64 = localStorage.getItem('privateKey');
        if (!base64) return false;

        try {
            const buffer = this.base64ToArrayBuffer(base64);
            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                buffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                true,
                ["decrypt"]
            );

            this.keyPair = { privateKey };
            return true;
        } catch (error) {
            console.error('Ошибка загрузки приватного ключа:', error);
            return false;
        }
    }

    // Импорт публичного ключа другого пользователя
    async importPublicKey(base64Key) {
        try {
            const buffer = this.base64ToArrayBuffer(base64Key);
            return await window.crypto.subtle.importKey(
                "spki",
                buffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                true,
                ["encrypt"]
            );
        } catch (error) {
            console.error('Ошибка импорта публичного ключа:', error);
            return null;
        }
    }

    // Шифрование сообщения
    async encryptMessage(message, recipientPublicKeyBase64) {
        try {
            // Генерируем случайный AES ключ для этого сообщения
            const aesKey = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                ["encrypt", "decrypt"]
            );

            // Шифруем сообщение AES ключом
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                data
            );

            // Экспортируем AES ключ
            const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

            // Импортируем публичный ключ получателя
            const recipientPublicKey = await this.importPublicKey(recipientPublicKeyBase64);

            if (!recipientPublicKey) {
                throw new Error('Не удалось импортировать публичный ключ');
            }

            // Шифруем AES ключ публичным ключом получателя (RSA)
            const encryptedAesKey = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                recipientPublicKey,
                exportedAesKey
            );

            // Возвращаем зашифрованное сообщение в формате JSON
            return JSON.stringify({
                encryptedData: this.arrayBufferToBase64(encryptedData),
                encryptedKey: this.arrayBufferToBase64(encryptedAesKey),
                iv: this.arrayBufferToBase64(iv)
            });
        } catch (error) {
            console.error('Ошибка шифрования:', error);
            return null;
        }
    }

    // Дешифрование сообщения
    async decryptMessage(encryptedMessageJson) {
        try {
            const data = JSON.parse(encryptedMessageJson);

            // Расшифровываем AES ключ приватным ключом (RSA)
            const encryptedAesKey = this.base64ToArrayBuffer(data.encryptedKey);
            const aesKeyData = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                this.keyPair.privateKey,
                encryptedAesKey
            );

            // Импортируем AES ключ
            const aesKey = await window.crypto.subtle.importKey(
                "raw",
                aesKeyData,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["decrypt"]
            );

            // Расшифровываем сообщение AES ключом
            const encryptedData = this.base64ToArrayBuffer(data.encryptedData);
            const iv = this.base64ToArrayBuffer(data.iv);

            const decryptedData = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                encryptedData
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Ошибка дешифрования:', error);
            return '[Не удалось расшифровать сообщение]';
        }
    }

    // Вспомогательные функции
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Инициализация шифрования для пользователя
    async init() {
        // Пытаемся загрузить существующий приватный ключ
        const loaded = await this.loadPrivateKey();

        if (!loaded) {
            // Генерируем новую пару ключей
            const publicKey = await this.generateKeyPair();
            console.log('Сгенерирована новая пара ключей');
            return publicKey;
        } else {
            console.log('Приватный ключ загружен');
            return null;
        }
    }

    // Проверка, зашифровано ли сообщение
    isEncrypted(message) {
        try {
            const data = JSON.parse(message);
            return data.encryptedData && data.encryptedKey && data.iv;
        } catch {
            return false;
        }
    }
}

// Экспортируем глобально
window.E2EEncryption = E2EEncryption;
