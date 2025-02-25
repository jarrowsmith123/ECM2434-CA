from django.db import models
from monsters.models import Monster

# Create your models here.
class GameChallenge(models.Model):
    target_score = models.IntegerField()
    name = models.CharField(max_length=20)

    def __str__(self):
        return f"Target Score: {self.target_score}"
