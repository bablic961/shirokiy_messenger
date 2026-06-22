from django.urls import path
from . import views

app_name = 'messenger'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('chat/<int:chat_id>/', views.chat_view, name='chat'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/<int:user_id>/', views.profile_view, name='profile_user'),
    path('create-chat/<int:user_id>/', views.create_chat_view, name='create_chat'),
    path('create-group/', views.create_group_view, name='create_group'),
    path('delete-message/<int:message_id>/', views.delete_message_view, name='delete_message'),
    path('subscribe/<int:user_id>/', views.subscribe_view, name='subscribe'),
    path('unsubscribe/<int:user_id>/', views.unsubscribe_view, name='unsubscribe'),
    path('search/', views.search_users_view, name='search_users'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('api/save-public-key/', views.save_public_key_view, name='save_public_key'),
    path('api/get-public-key/<int:user_id>/', views.get_public_key_view, name='get_public_key'),
    path('api/add-reaction/<int:message_id>/', views.add_reaction_view, name='add_reaction'),
    path('api/search-messages/<int:chat_id>/', views.search_messages_view, name='search_messages'),
    path('api/send-voice/', views.send_voice_view, name='send_voice'),
    path('api/send-video-note/', views.send_video_note_view, name='send_video_note'),
    path('api/remove-profile-music/', views.remove_profile_music_view, name='remove_profile_music'),
    path('api/push-subscription/save/', views.save_push_subscription, name='save_push_subscription'),
    path('api/push-subscription/delete/', views.delete_push_subscription, name='delete_push_subscription'),
    path('api/push-subscription/vapid-public-key/', views.get_vapid_public_key, name='get_vapid_public_key'),
    path('settings/', views.settings_view, name='settings'),
    path('test-features/', views.test_features_view, name='test_features'),
]
