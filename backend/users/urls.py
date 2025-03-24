from django.urls import path
from . import views
from . import admin_views

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
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    
    # Admin routes
    path('admin/users/', admin_views.get_all_users, name='admin-get-all-users'),
    path('admin/users/<int:user_id>/', admin_views.get_user_detail, name='admin-get-user-detail'),
    path('admin/users/<int:user_id>/admin-status/', admin_views.update_user_admin_status, name='admin-update-user-admin-status'),
    path('admin/monsters/', admin_views.get_all_monsters, name='admin-get-all-monsters'),
    path('admin/users/<int:user_id>/monsters/', admin_views.get_user_monsters, name='admin-get-user-monsters'),
    path('admin/users/<int:user_id>/add-monster/', admin_views.add_monster_to_user, name='admin-add-monster-to-user'),
    path('admin/player-monsters/<int:player_monster_id>/', admin_views.update_player_monster, name='admin-update-player-monster'),
    path('admin/player-monsters/<int:player_monster_id>/delete/', admin_views.delete_player_monster, name='admin-delete-player-monster'),
    path('admin/quiz-questions/', admin_views.get_all_quiz_questions, name='admin-get-all-quiz-questions'),
    path('admin/locations/', admin_views.get_locations_with_monsters, name='admin-get-locations-with-monsters'),
    path('admin/locations/create/', admin_views.create_location_with_monster, name='admin-create-location-with-monster'),
    path('check-admin/', admin_views.check_admin_status, name='check-admin-status'),
    path('admin/challenges/', admin_views.get_all_challenges, name='admin-get-all-challenges'),
    path('admin/challenges/create/', admin_views.create_challenge, name='admin-create-challenge'),
    path('admin/challenges/<int:challenge_id>/', admin_views.manage_challenge, name='admin-manage-challenge'),
]
