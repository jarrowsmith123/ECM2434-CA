from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile') # include details from the user model
    game_won_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

# Create a new user profile automatically when a new user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

def get_score(self):
        return self.game_won_count

@classmethod
def get_leaderboard(cls):
    # Minus sign infront of game_won count for descending order
    leaderboard = cls.objects.all().order_by('-game_won_count')
    # Returns tuple of username and score for each user
    return [(profile.user.username, profile.get_score()) for profile in leaderboard]


    


    


