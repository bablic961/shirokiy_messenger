from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User, Chat, Message


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Имя пользователя'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'Email'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget = forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Пароль'})
        self.fields['password2'].widget = forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Подтвердите пароль'})


class UserLoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Имя пользователя'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Пароль'}))


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'avatar', 'bio', 'profile_music']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Имя пользователя'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'Email'}),
            'bio': forms.Textarea(attrs={'class': 'form-textarea', 'placeholder': 'О себе', 'rows': 4}),
            'avatar': forms.FileInput(attrs={'class': 'form-file-input', 'accept': 'image/*'}),
            'profile_music': forms.FileInput(attrs={'class': 'form-file-input', 'accept': 'audio/*'}),
        }


class GroupChatForm(forms.ModelForm):
    class Meta:
        model = Chat
        fields = ['name', 'avatar']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Название группы'}),
            'avatar': forms.FileInput(attrs={'class': 'form-file-input'}),
        }


class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['content', 'image', 'video', 'file']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'message-input',
                'placeholder': 'Введите сообщение...',
                'rows': 1,
            }),
            'image': forms.FileInput(attrs={'accept': 'image/*', 'class': 'file-input'}),
            'video': forms.FileInput(attrs={'accept': 'video/*', 'class': 'file-input'}),
            'file': forms.FileInput(attrs={'class': 'file-input'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        content = cleaned_data.get('content')
        image = cleaned_data.get('image')
        video = cleaned_data.get('video')
        file = cleaned_data.get('file')

        if not any([content, image, video, file]):
            raise forms.ValidationError('Необходимо ввести текст или прикрепить файл')

        return cleaned_data
