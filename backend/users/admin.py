from django.contrib import admin
from .models import Friendship

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "status")
    fields = ("sender", "receiver", "status")