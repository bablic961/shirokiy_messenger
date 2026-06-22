#!/usr/bin/env python3
"""
Генератор новых VAPID ключей для push-уведомлений
Запуск: python generate_vapid_keys.py
"""

try:
    from py_vapid import Vapid
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    import base64

    print("=" * 60)
    print("🔑 ГЕНЕРАТОР VAPID КЛЮЧЕЙ")
    print("=" * 60)

    # Генерируем приватный ключ напрямую через cryptography
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())

    # Экспортируем приватный ключ в PEM формат
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    # Получаем публичный ключ
    public_key = private_key.public_key()

    # Экспортируем публичный ключ в uncompressed point format
    public_numbers = public_key.public_numbers()
    x = public_numbers.x.to_bytes(32, byteorder='big')
    y = public_numbers.y.to_bytes(32, byteorder='big')
    public_key_bytes = b'\x04' + x + y  # 0x04 = uncompressed point

    # Base64 URL-safe encoding
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')

    print("\n✅ Ключи успешно сгенерированы!")
    print("\n" + "=" * 60)
    print("📋 VAPID PUBLIC KEY (добавь в .env или settings.py):")
    print("=" * 60)
    print(public_key_b64)

    print("\n" + "=" * 60)
    print("📋 VAPID PRIVATE KEY (добавь в .env или settings.py):")
    print("=" * 60)
    print(private_pem)

    print("\n" + "=" * 60)
    print("📝 ИНСТРУКЦИЯ ПО УСТАНОВКЕ:")
    print("=" * 60)
    print("""
1. Скопируй оба ключа выше

2. Создай/обнови файл .env в корне проекта:

   VAPID_PUBLIC_KEY=<скопируй PUBLIC KEY сюда>
   VAPID_PRIVATE_KEY="<скопируй PRIVATE KEY сюда>"
   VAPID_ADMIN_EMAIL=admin@shirokiy-messenger.com

3. Или обнови settings.py напрямую:

   WEBPUSH_SETTINGS = {
       "VAPID_PUBLIC_KEY": "<PUBLIC KEY>",
       "VAPID_PRIVATE_KEY": '''<PRIVATE KEY>''',
       "VAPID_ADMIN_EMAIL": "admin@shirokiy-messenger.com"
   }

4. Перезапусти веб-приложение на PythonAnywhere

5. Открой сайт в браузере и переподпишись:
   - F12 → Console
   - Выполни:
     navigator.serviceWorker.ready
       .then(reg => reg.pushManager.getSubscription())
       .then(sub => sub && sub.unsubscribe())
       .then(() => location.reload());

6. Разреши уведомления заново когда попросит

7. Протестируй отправку сообщения!
    """)

    print("=" * 60)
    print("✅ ГОТОВО!")
    print("=" * 60)

except Exception as e:
    print(f"\n❌ ОШИБКА: {e}")
    print("\nУстанови необходимые библиотеки:")
    print("pip install --user py-vapid cryptography")
