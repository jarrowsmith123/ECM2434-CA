from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Location

class LocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Location
        fields = ['id', 'location_name', 'latitude', 'longitude', 'type', 'created_at', 'updated_at','distance_threshold']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        #Checks that the latitude and longitude values are within valid ranges
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if -90.0 >= latitude or latitude >= 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees")

        if -180.0 >= longitude or longitude >= 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees")

        return data
