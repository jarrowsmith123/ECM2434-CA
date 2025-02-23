from django.db import models
from users.models import Monster

# Create your models here.
class GameChallenge(models.Model):
    target_score = models.IntegerField()
    name = models.CharField(max_length=20)
    required_type = models.CharField(
        max_length=3,
        choices=Monster.TYPES
    )

    def __str__(self):
        return f"Target Score: {self.target_score}, Required Type: {self.required_type}"