from rest_framework import serializers
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    total_km = serializers.FloatField(default=0.0)
    distance_today = serializers.FloatField(default=0.0)
    distance_week = serializers.FloatField(default=0.0)
    display_name = serializers.CharField(max_length=100, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'display_name', 'total_km', 'distance_today', 'distance_week')
        read_only_fields = ('id', 'username', 'email')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'profile')
        extra_kwargs = {"password": {"write_only": True}}
    # this uses django built in validation to check if fields are valid
    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
