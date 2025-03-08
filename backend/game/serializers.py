from rest_framework import serializers
from .models import GameChallenge

class GameChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameChallenge
        fields = ['id', 'name', 'target_score']