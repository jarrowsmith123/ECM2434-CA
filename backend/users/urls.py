from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='user-profile'),
    path('delete/', views.delete_user, name='delete-user'),
]
