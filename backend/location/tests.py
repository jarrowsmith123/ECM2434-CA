from django.test import TestCase
from .models import Location

class LocationTestCase(TestCase):
    def setUp(self):
        Location.objects.create(name="Library", latitude=40.7128, longitude=-74.0060)
    
    def test_location_name(self):
        library = Location.objects.get(name="Library")
        self.assertEqual(library.name, "Library")