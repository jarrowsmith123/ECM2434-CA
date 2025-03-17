from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='user-profile'),
    path('delete/', views.delete_user, name='delete-user'),
    path('friends/', views.get_friends, name='get-friends'),
    path('create-friend-request/', views.create_friend_request, name='send-friend-request'),
    path('accept-friend-request/<int:friend_request_id>/', views.accept_friend_request, name='accept-friend-request'),
    path('decline-friend-request/<int:friend_request_id>/', views.decline_friend_request, name='decline-friend-request'),
    path('search-user/', views.search_user, name='search-user'),
    path('profile/<str:username>/', views.view_user_profile, name='view-user-profile'),
    path('me/', views.me, name='me'),
]
