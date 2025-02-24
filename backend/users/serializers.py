from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile,Location

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile
        fields = ('total_km', 'distance_today', 'distance_week')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True)

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
    

class LocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Location
        fields = ['id', 'name', 'latitude', 'longitude', 'created_at', 'updated_at','threshold']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        #Checks that the latitude and longitude values are within valid ranges
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not (-90 <= latitude <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees")

        if longitude is not (-180 <= longitude <= 180):
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees")

        return data
