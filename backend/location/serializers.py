from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Location

class LocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Location
        fields = ['id', 'location_name', 'latitude', 'longitude', 'created_at', 'updated_at','distance_threshold']
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