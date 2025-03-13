from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='user-profile'),
    path('delete/', views.delete_user, name='delete-user'),
    path('friends/', views.get_friends, name='get-friends'),
    path('create-friend-request/', views.create_friend_request, name='send-friend-request'),
    path('accept-friend-request/', views.accept_friend_request, name='accept-friend-request'),
    path('tutorial-status/', views.get_tutorial_status, name='get-tutorial-status'),
    path('tutorial-completed/', views.mark_tutorial_completed, name='tutorial-completed'),
]
