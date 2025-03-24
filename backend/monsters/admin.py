from django.contrib import admin
from .models import Monster, PlayerMonster

@admin.register(Monster)
class MonsterAdmin(admin.ModelAdmin):
    list_display = ("name", "rarity", "type")  # Show these fields in the list view
    fields = ("name", "rarity", "type")  # Fields shown in the admin form

@admin.register(PlayerMonster)
class PlayerMonsterAdmin(admin.ModelAdmin):
    list_display = ("user", "monster", "level")  # Show these fields in the list view
    fields = ("user", "monster", "level")  # Fields shown in the admin form
