from django.db import models

# Create your models here.
class Location(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    # Distance a user can be away from the location to be considered being there
    distance_threshold = models.FloatField(default=0.001)

    location_name = models.TextField(blank=True)
    description =  models.TextField(blank=True)

    # Will auto set current date and time everytime model is saved
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.location_name
