from rest_framework import serializers
from .models import Challenge, UserChallenge
from users.serializers import UserSerializer

class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = '__all__'

class UserChallengeSerializer(serializers.ModelSerializer):
    challenge = ChallengeSerializer(read_only=True)
    challenge_id = serializers.IntegerField(write_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserChallenge
        fields = ('id', 'user', 'challenge', 'challenge_id', 'current_progress', 'status', 'assigned_at', 'completed_at')
        read_only_fields = ('id', 'assigned_at', 'completed_at')
    
    def create(self, validated_data):
        user = self.context['request'].user
        challenge_id = validated_data.pop('challenge_id')
        challenge = Challenge.objects.get(id=challenge_id)
        user_challenge = UserChallenge.objects.create(
            user=user,
            challenge=challenge,
            **validated_data
        )
        return user_challenge