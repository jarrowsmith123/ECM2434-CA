from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='user-profile'),
    path('create-monster/', views.create_monster, name='create-monster'),
    path('create-player-monster/', views.create_player_monster, name='create-player-monster'),
    path('increment-level/', views.increment_player_monster_level, name='increment-player-monster'),
    path('random-monster/', views.generate_random_monster, name='random-monster'),
    
    path('locations/', views.get_all_locations, name='get_all_locations'),
    path('locations/create/', views.create_location, name='create_location'),
    path('locations/update/<int:location_id>/', views.update_location, name='update_location'),
]