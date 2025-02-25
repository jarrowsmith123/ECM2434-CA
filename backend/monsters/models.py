from django.db import models
from users.models import User

# Create your models here.
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
