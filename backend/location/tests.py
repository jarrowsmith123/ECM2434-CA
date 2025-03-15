from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Location
import json

class LocationModelTests(TestCase): 
    def setUp(self):
        self.location = Location.objects.create(
            location_name="Test Location",
            latitude=40.7128,
            longitude=-74.0060,
        )
    
    #testing that a location can be created in the view with valid attributes
    def test_location_creation(self):
        self.assertEqual(self.location.location_name, "Test Location")
        self.assertEqual(self.location.latitude, 40.7128)
        self.assertEqual(self.location.longitude, -74.0060)
        self.assertEqual(self.location.distance_threshold, 0.005)
    
    #testing the string representation of a location 
    def test_location_string_representation(self):
        self.assertEqual(str(self.location), "Test Location")


class LocationAPITests(TestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "testpassword"
        self.user = User.objects.create_user(username=self.username, password=self.password)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.location = Location.objects.create(
            location_name="Test Location",
            latitude=40.7128,
            longitude=-74.0060,
        )
        
        self.get_all_locations_url = reverse('get_all_locations')
        self.create_location_url = reverse('create_location')
        self.update_location_url = reverse('update_location', args=[self.location.id])
    
    #testing the get_all_locations endpoint
    def test_get_all_locations(self):
        Location.objects.create(
            location_name="Another Location",
            latitude=34.0522,
            longitude=-118.2437,
            distance_threshold=0.002
        )
        
        response = self.client.get(self.get_all_locations_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    #testing creating a valid location
    def test_create_location_success(self):
        data = {
            "location_name": "New Location",
            "latitude": 37.7749,
            "longitude": -122.4194,
        }
        
        response = self.client.post(self.create_location_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Location.objects.count(), 2)
        self.assertEqual(response.data['location_name'], "New Location")
    
    #testing an invalid location (missing fields) cant be created
    def test_create_location_invalid_data(self):
        data = {
            "location_name": "Invalid Location"
        }
        
        response = self.client.post(self.create_location_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Location.objects.count(), 1)

    #testing an exisiting location can be updated
    def test_update_location_success(self):
        data = {
            "location_name": "Updated Location",
            "latitude": 51.5074,
            "longitude": -0.1278
        }
        
        response = self.client.patch(self.update_location_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.location.refresh_from_db()
        self.assertEqual(self.location.location_name, "Updated Location")
        self.assertEqual(self.location.latitude, 51.5074)
        self.assertEqual(self.location.longitude, -0.1278)
        self.assertEqual(self.location.distance_threshold, 0.005)
    
    #testing a location that doesnt exist cant be modified
    def test_update_nonexistent_location(self):
        non_existent_id = 999
        update_url = reverse('update_location', args=[non_existent_id])
        
        data = {
            "location_name": "This Should Fail",
            "latitude": 0,
            "longitude": 0
        }
        
        response = self.client.patch(update_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    #testing authentication is required
    def test_authentication_required(self):
        unauthenticated_client = APIClient()
        
        response = unauthenticated_client.get(self.get_all_locations_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to create a location
        data = {
            "location_name": "Unauthorized Location",
            "latitude": 0,
            "longitude": 0,
        }
        response = unauthenticated_client.post(self.create_location_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = unauthenticated_client.patch(self.update_location_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LocationSerializerTests(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password")
        self.client.force_authenticate(user=self.user)
        self.create_location_url = reverse('create_location')
    
    #testing the latitude validation works
    def test_serializer_validation_latitude_range(self):
        data = {
            "location_name": "Invalid Latitude",
            "latitude": 200,  
            "longitude": 0,
        }
        
        response = self.client.post(self.create_location_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    #testing the longitude validation works
    def test_serializer_validation_longitude_range(self):
        data = {
            "location_name": "Invalid Longitude",
            "latitude": 0,
            "longitude": 200, 
        }
        
        response = self.client.post(self.create_location_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)