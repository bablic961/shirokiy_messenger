from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Max
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json
from .models import User, Chat, Message, Notification, Subscription, MessageReaction, PushSubscription
from .forms import UserRegisterForm, UserLoginForm, UserProfileForm, GroupChatForm, MessageForm
from .push_notifications import send_message_notification


def register_view(request):
    if request.user.is_authenticated:
        return redirect('messenger:home')

    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('messenger:home')
    else:
        form = UserRegisterForm()

    return render(request, 'messenger/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('messenger:home')

    if request.method == 'POST':
        form = UserLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                user.online_status = True
                user.save()
                return redirect('messenger:home')
    else:
        form = UserLoginForm()

    return render(request, 'messenger/login.html', {'form': form})


@login_required
def logout_view(request):
    request.user.online_status = False
    request.user.last_seen = timezone.now()
    request.user.save()
    logout(request)
    return redirect('messenger:login')


@login_required
def home_view(request):
    chats = Chat.objects.filter(participants=request.user).annotate(
        last_message_time=Max('messages__created_at')
    ).order_by('-last_message_time')

    subscriptions = request.user.subscriptions.select_related('subscribed_to')

    context = {
        'chats': chats,
        'subscriptions': subscriptions,
    }
    return render(request, 'messenger/home.html', context)


@login_required
def chat_view(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)
    messages_list = chat.messages.filter(is_deleted=False).select_related('sender').prefetch_related('reactions__user')

    messages_list.filter(~Q(sender=request.user)).update(is_read=True)

    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        image = request.FILES.get('image')
        video = request.FILES.get('video')
        file = request.FILES.get('file')
        voice = request.FILES.get('voice')
        video_note = request.FILES.get('video_note')

        # Определяем тип файла
        if file:
            if file.content_type.startswith('image/'):
                image = file
                file = None
            elif file.content_type.startswith('video/'):
                video = file
                file = None

        if content or image or video or file or voice or video_note:
            message = Message.objects.create(
                chat=chat,
                sender=request.user,
                content=content,
                image=image,
                video=video,
                file=file,
                voice=voice,
                video_note=video_note
            )

            # Отправляем push-уведомления
            try:
                send_message_notification(message)
            except Exception as e:
                print(f"Failed to send push notification: {e}")

            return redirect('messenger:chat', chat_id=chat.id)

    context = {
        'chat': chat,
        'messages': messages_list,
    }
    return render(request, 'messenger/chat.html', context)


@login_required
def profile_view(request, user_id=None):
    if user_id:
        profile_user = get_object_or_404(User, id=user_id)
        is_own_profile = request.user == profile_user
    else:
        profile_user = request.user
        is_own_profile = True

    is_subscribed = Subscription.objects.filter(
        subscriber=request.user,
        subscribed_to=profile_user
    ).exists() if not is_own_profile else False

    if request.method == 'POST' and is_own_profile:
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('messenger:profile')
    else:
        form = UserProfileForm(instance=profile_user) if is_own_profile else None

    context = {
        'profile_user': profile_user,
        'is_own_profile': is_own_profile,
        'is_subscribed': is_subscribed,
        'form': form,
    }
    return render(request, 'messenger/profile.html', context)


@login_required
def create_chat_view(request, user_id):
    other_user = get_object_or_404(User, id=user_id)

    existing_chat = Chat.objects.filter(
        chat_type='private',
        participants=request.user
    ).filter(participants=other_user).first()

    if existing_chat:
        return redirect('messenger:chat', chat_id=existing_chat.id)

    chat = Chat.objects.create(chat_type='private')
    chat.participants.add(request.user, other_user)

    return redirect('messenger:chat', chat_id=chat.id)


@login_required
def create_group_view(request):
    if request.method == 'POST':
        form = GroupChatForm(request.POST, request.FILES)
        if form.is_valid():
            group = form.save(commit=False)
            group.chat_type = 'group'
            group.save()
            group.participants.add(request.user)
            return redirect('messenger:chat', chat_id=group.id)
    else:
        form = GroupChatForm()

    users = User.objects.exclude(id=request.user.id)
    context = {
        'form': form,
        'users': users,
    }
    return render(request, 'messenger/create_group.html', context)


@login_required
def delete_message_view(request, message_id):
    message = get_object_or_404(Message, id=message_id, sender=request.user)
    chat_id = message.chat.id
    message.is_deleted = True
    message.save()
    return redirect('messenger:chat', chat_id=chat_id)


@login_required
def subscribe_view(request, user_id):
    user_to_subscribe = get_object_or_404(User, id=user_id)

    if user_to_subscribe != request.user:
        subscription, created = Subscription.objects.get_or_create(
            subscriber=request.user,
            subscribed_to=user_to_subscribe
        )
        if created:
            Notification.objects.create(
                recipient=user_to_subscribe,
                notification_type='subscription',
                sender=request.user,
                content=f'{request.user.username} подписался на вас'
            )

    return redirect('messenger:profile_user', user_id=user_id)


@login_required
def unsubscribe_view(request, user_id):
    user_to_unsubscribe = get_object_or_404(User, id=user_id)
    Subscription.objects.filter(
        subscriber=request.user,
        subscribed_to=user_to_unsubscribe
    ).delete()
    return redirect('messenger:profile_user', user_id=user_id)


@login_required
def search_users_view(request):
    query = request.GET.get('q', '')
    users = User.objects.filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    ).exclude(id=request.user.id)[:20]

    context = {
        'users': users,
        'query': query,
    }
    return render(request, 'messenger/search_users.html', context)


@login_required
def notifications_view(request):
    notifications = request.user.notifications.all()[:50]
    notifications.update(is_read=True)

    context = {
        'notifications': notifications,
    }
    return render(request, 'messenger/notifications.html', context)


@login_required
def save_public_key_view(request):
    if request.method == 'POST':
        import json
        data = json.loads(request.body)
        public_key = data.get('public_key')

        if public_key:
            request.user.public_key = public_key
            request.user.save()
            return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'error'}, status=400)


@login_required
def get_public_key_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        return JsonResponse({
            'status': 'success',
            'public_key': user.public_key or ''
        })
    except User.DoesNotExist:
        return JsonResponse({'status': 'error'}, status=404)


@login_required
def add_reaction_view(request, message_id):
    if request.method == 'POST':
        import json
        message = get_object_or_404(Message, id=message_id)

        # Проверяем, что пользователь участник чата
        if not message.chat.participants.filter(id=request.user.id).exists():
            return JsonResponse({'status': 'error', 'message': 'Access denied'}, status=403)

        data = json.loads(request.body)
        emoji = data.get('emoji')

        if emoji not in dict(MessageReaction.REACTION_CHOICES):
            return JsonResponse({'status': 'error', 'message': 'Invalid emoji'}, status=400)

        # Добавляем или удаляем реакцию
        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=request.user,
            emoji=emoji
        )

        if not created:
            reaction.delete()
            return JsonResponse({'status': 'removed', 'emoji': emoji})

        return JsonResponse({'status': 'added', 'emoji': emoji})

    return JsonResponse({'status': 'error'}, status=400)


@login_required
def search_messages_view(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)
    query = request.GET.get('q', '').strip()

    if query:
        messages = chat.messages.filter(
            Q(content__icontains=query),
            is_deleted=False
        ).select_related('sender')[:50]
    else:
        messages = []

    messages_data = [{
        'id': msg.id,
        'content': msg.content,
        'sender': msg.sender.username,
        'created_at': msg.created_at.strftime('%d.%m.%Y %H:%M')
    } for msg in messages]

    return JsonResponse({'messages': messages_data})


@login_required
def settings_view(request):
    return render(request, 'messenger/settings.html')


@login_required
def test_features_view(request):
    return render(request, 'messenger/test_features.html')


@login_required
def send_voice_view(request):
    if request.method == 'POST':
        chat_id = request.POST.get('chat_id')
        voice_file = request.FILES.get('voice')

        if not chat_id or not voice_file:
            return JsonResponse({'status': 'error', 'message': 'Missing data'}, status=400)

        chat = get_object_or_404(Chat, id=chat_id, participants=request.user)

        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            voice=voice_file
        )

        return JsonResponse({
            'status': 'success',
            'message_id': message.id
        })

    return JsonResponse({'status': 'error'}, status=400)


@login_required
def send_video_note_view(request):
    if request.method == 'POST':
        chat_id = request.POST.get('chat_id')
        video_note_file = request.FILES.get('video_note')

        if not chat_id or not video_note_file:
            return JsonResponse({'status': 'error', 'message': 'Missing data'}, status=400)

        chat = get_object_or_404(Chat, id=chat_id, participants=request.user)

        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            video_note=video_note_file
        )

        return JsonResponse({
            'status': 'success',
            'message_id': message.id
        })

    return JsonResponse({'status': 'error'}, status=400)


@login_required
def remove_profile_music_view(request):
    if request.method == 'POST':
        request.user.profile_music.delete(save=False)
        request.user.profile_music = None
        request.user.save()
        return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'error'}, status=400)


@login_required
@require_http_methods(["POST"])
def save_push_subscription(request):
    """
    Сохраняет push-подписку пользователя в базе данных.
    """
    try:
        data = json.loads(request.body)

        subscription_info = data.get('subscription')
        if not subscription_info:
            return JsonResponse({'error': 'No subscription data provided'}, status=400)

        endpoint = subscription_info.get('endpoint')
        keys = subscription_info.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not all([endpoint, p256dh, auth]):
            return JsonResponse({'error': 'Invalid subscription data'}, status=400)

        # Создаем или обновляем подписку
        subscription, created = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth
            }
        )

        return JsonResponse({
            'status': 'success',
            'created': created,
            'subscription_id': subscription.id
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def delete_push_subscription(request):
    """
    Удаляет push-подписку пользователя.
    """
    try:
        data = json.loads(request.body)
        endpoint = data.get('endpoint')

        if not endpoint:
            return JsonResponse({'error': 'No endpoint provided'}, status=400)

        deleted_count, _ = PushSubscription.objects.filter(
            user=request.user,
            endpoint=endpoint
        ).delete()

        return JsonResponse({
            'status': 'success',
            'deleted': deleted_count > 0
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_vapid_public_key(request):
    """
    Возвращает VAPID публичный ключ для подписки на push-уведомления.
    """
    return JsonResponse({
        'publicKey': settings.WEBPUSH_SETTINGS['VAPID_PUBLIC_KEY']
    })


