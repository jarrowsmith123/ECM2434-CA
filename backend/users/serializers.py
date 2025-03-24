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
        fields = ('id', 'username', 'email', 'password', 'profile', 'is_superuser')
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
    # Define actual sender and receiver fields to accept the users
    sender = serializers.CharField(write_only=True)
    receiver = serializers.CharField(write_only=True)
    
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'sender_username', 'receiver_username', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender_username', 'receiver_username']
        
    def create(self, validated_data):
        sender = User.objects.get(username=validated_data['sender'])
        receiver = User.objects.get(username=validated_data['receiver'])
        
        friendship = Friendship.objects.create(
            sender=sender,
            receiver=receiver,
            status='pending'
        )
        return friendship

    def validate(self, data):
        # Check if the sender and receiver are the same user
        sender = data.get('sender')
        receiver = data.get('receiver')
        
        if sender == receiver:
            raise serializers.ValidationError("Sender and receiver cannot be the same user.")
            
        try:
            sender_user = User.objects.get(username=sender)
            receiver_user = User.objects.get(username=receiver)
            
            if Friendship.objects.filter(sender=sender_user, receiver=receiver_user).exists():
                raise serializers.ValidationError("Friend request already exists.")
            if Friendship.objects.filter(sender=receiver_user, receiver=sender_user).exists():
                raise serializers.ValidationError("Friend request already exists.")
        except User.DoesNotExist:
            raise serializers.ValidationError("One or both users do not exist.")
            
        return data
