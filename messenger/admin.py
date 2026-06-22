from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Chat, Message, Notification, Subscription, MessageReaction, PushSubscription


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'online_status', 'last_seen', 'date_joined']
    list_filter = ['online_status', 'is_staff', 'is_active', 'date_joined']
    search_fields = ['username', 'email']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('avatar', 'bio', 'online_status', 'last_seen')
        }),
    )


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['id', 'chat_type', 'name', 'created_at', 'updated_at', 'get_participants_count']
    list_filter = ['chat_type', 'created_at']
    search_fields = ['name']
    filter_horizontal = ['participants']
    readonly_fields = ['created_at', 'updated_at']

    def get_participants_count(self, obj):
        return obj.participants.count()
    get_participants_count.short_description = 'Участников'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'chat', 'sender', 'content_preview', 'created_at', 'is_read', 'is_deleted']
    list_filter = ['is_read', 'is_deleted', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Содержимое'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'sender', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'sender__username', 'content']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'subscriber', 'subscribed_to', 'created_at']
    list_filter = ['created_at']
    search_fields = ['subscriber__username', 'subscribed_to__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'emoji', 'created_at']
    list_filter = ['emoji', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'endpoint_preview', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'endpoint']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    def endpoint_preview(self, obj):
        return obj.endpoint[:50] + '...' if len(obj.endpoint) > 50 else obj.endpoint
    endpoint_preview.short_description = 'Endpoint'
