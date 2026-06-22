import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        user = self.scope['user']
        if user.is_authenticated:
            await self.update_user_status(user.id, True)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        user = self.scope['user']
        if user.is_authenticated:
            await self.update_user_status(user.id, False)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope['user']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': user.username,
                'user_id': user.id,
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        user_id = event['user_id']

        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'user_id': user_id,
        }))

    @database_sync_to_async
    def update_user_status(self, user_id, status):
        from django.utils import timezone
        User.objects.filter(id=user_id).update(
            online_status=status,
            last_seen=timezone.now()
        )
