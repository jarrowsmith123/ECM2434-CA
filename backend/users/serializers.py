from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Friendship

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile

        fields = ('game_won_count', 'created_at', 'updated_at')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'profile')
        read_only_fields = ('id', 'profile')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
    
    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
            
        instance.save()
        return instance


class FriendshipSerializer(serializers.ModelSerializer):

    # Use the username field of the sender and receiver in output so frontend can display them
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender_username', 'receiver_username', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

