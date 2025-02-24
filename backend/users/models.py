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

class Monster(models.Model):
    # Monster Rarity
    RARITY_CHOICES = [
        ('C', 'Common'),
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
    type = models.CharField(max_length=3, choices=TYPES)
    rarity = models.CharField(max_length=1, choices=RARITY_CHOICES)

    def __str__(self):
        return f"{self.name} (Rarity: {self.rarity}, Type:{self.type})"
    
class PlayerMonster(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player_monsters') # includes details from the user
    monster = models.ForeignKey(Monster, on_delete=models.CASCADE, related_name='player_monsters') # includes details from the monster
    level = models.IntegerField(default=1)
    MAX_LEVEL = 99

    def increment_level(self, amount):
        new_level = min(self.level + amount, self.MAX_LEVEL)
        self.level = new_level
        self.save()

    def __str__(self):
        return f"{self.user.username}'s {self.monster.name} (Level: {self.level})"
    
class Location(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    # Distance a user can be away from the location to be considered being there
    distance_threshold = models.FloatField(default=0.001)

    location_name = models.TextField(blank=True)
    description =  models.TextField(blank=True)
    
    # Will auto set current date and time everytime model is saved
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    


