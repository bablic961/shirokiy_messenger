from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    online_status = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    public_key = models.TextField(blank=True, null=True)  # Публичный ключ для E2E шифрования
    profile_music = models.FileField(upload_to='profile_music/', null=True, blank=True)  # Музыка профиля

    def __str__(self):
        return self.username


class Subscription(models.Model):
    subscriber = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    subscribed_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscribers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('subscriber', 'subscribed_to')

    def __str__(self):
        return f"{self.subscriber.username} -> {self.subscribed_to.username}"


class Chat(models.Model):
    CHAT_TYPE_CHOICES = [
        ('private', 'Private'),
        ('group', 'Group'),
    ]

    chat_type = models.CharField(max_length=10, choices=CHAT_TYPE_CHOICES, default='private')
    name = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to='chat_avatars/', null=True, blank=True)
    participants = models.ManyToManyField(User, related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.chat_type == 'group':
            return self.name or f"Group {self.id}"
        else:
            users = list(self.participants.all()[:2])
            if len(users) == 2:
                return f"{users[0].username} - {users[1].username}"
            return f"Chat {self.id}"

    def get_last_message(self):
        return self.messages.order_by('-created_at').first()

    def get_avatar_for_user(self, current_user):
        """
        Возвращает аватарку для отображения в списке чатов.
        Для групповых чатов - аватарка группы.
        Для личных чатов - аватарка собеседника.
        """
        if self.chat_type == 'group':
            return self.avatar
        else:
            # Для личного чата возвращаем аватарку собеседника
            other_user = self.participants.exclude(id=current_user.id).first()
            return other_user.avatar if other_user else None

    def get_display_name_for_user(self, current_user):
        """
        Возвращает имя для отображения в списке чатов.
        Для групповых чатов - название группы.
        Для личных чатов - имя собеседника.
        """
        if self.chat_type == 'group':
            return self.name or f"Group {self.id}"
        else:
            other_user = self.participants.exclude(id=current_user.id).first()
            return other_user.username if other_user else "Unknown"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='messages/images/', null=True, blank=True)
    video = models.FileField(upload_to='messages/videos/', null=True, blank=True)
    file = models.FileField(upload_to='messages/files/', null=True, blank=True)
    voice = models.FileField(upload_to='messages/voice/', null=True, blank=True)
    video_note = models.FileField(upload_to='messages/video_notes/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        if self.content:
            return f"{self.sender.username}: {self.content[:50]}"
        elif self.image:
            return f"{self.sender.username}: [Изображение]"
        elif self.video:
            return f"{self.sender.username}: [Видео]"
        elif self.voice:
            return f"{self.sender.username}: [Голосовое]"
        elif self.video_note:
            return f"{self.sender.username}: [Видео-кружок]"
        elif self.file:
            return f"{self.sender.username}: [Файл]"
        return f"{self.sender.username}: [Сообщение]"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('subscription', 'New Subscription'),
        ('group_invite', 'Group Invite'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, null=True, blank=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.notification_type}"


class MessageReaction(models.Model):
    REACTION_CHOICES = [
        ('👍', 'Thumbs Up'),
        ('❤️', 'Heart'),
        ('😂', 'Laughing'),
        ('😮', 'Surprised'),
        ('😢', 'Sad'),
        ('🔥', 'Fire'),
    ]

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to message {self.message.id}"


class PushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Push subscription for {self.user.username}"
