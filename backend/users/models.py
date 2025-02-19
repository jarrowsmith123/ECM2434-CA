from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile') # include details from the user model
    display_name = models.CharField(max_length=100, blank=True)
    total_km = models.FloatField(default=0.0)
    distance_today = models.FloatField(default=0.0)
    distance_week = models.FloatField(default=0.0)
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

class Monster(models.Model):
    # Monster Rarity
    RARITY_CHOICES = [
        ('C', 'Common'),
        ('U', 'Uncommon'),
        ('R', 'Rare'),
        ('E', 'Epic'),
        ('L', 'Legendary'),
    ]

    TYPES = [
        ('F&D', 'Food and Drink'),
        ('H', 'Health'),
        ('WB', 'Wellbeing'),
        ('W', 'Water'),
        ('WA', 'Waste'),
        ('N&B', 'Nature and Biodiversity'),
        ('T', 'Transport'),
    ]

    name = models.CharField(max_length=20)
    # maybe add level cap in future such as 99?
    level = models.IntegerField()
    type = models.CharField(choices=TYPES)
    rarity = models.CharField(choices=RARITY_CHOICES)

    def __str__(self):
        return f"{self.name} (Level: {self.level}, Rarity: {self.rarity}, Type:{self.type})"
    
class PlayerMonster(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player_monsters')
    monster = models.ForeignKey(Monster, on_delete=models.CASCADE, related_name='player_monsters')
    level = models.IntegerField(default=1)
    MAX_LEVEL = 99

    def increment_level(self, amount):
        new_level = min(self.level + amount, self.MAX_LEVEL)
        self.level = new_level
        self.save()

    def __str__(self):
        return f"{self.user.username}'s {self.monster.name} (Level: {self.level})"