from django.contrib import admin
from .models import GameChallenge

@admin.register(GameChallenge)
class GameChallengeAdmin(admin.ModelAdmin):
    list_display = ("name","target_score")  # Show these fields in the list view
    fields = ("name","target_score")  # Fields shown in the admin form