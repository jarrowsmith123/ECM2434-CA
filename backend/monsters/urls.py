from django.urls import path
from . import views

urlpatterns = [
    path('create-monster/', views.create_monster, name='create-monster'),
    path('create-player-monster/', views.create_player_monster, name='create-player-monster'),
    path('increment-level/', views.increment_player_monster_level, name='increment-player-monster'),
    path('random-monster/', views.generate_random_monster, name='random-monster'),
    path('get-player-monsters/', views.get_player_monsters, name='get-player-monsters')
]