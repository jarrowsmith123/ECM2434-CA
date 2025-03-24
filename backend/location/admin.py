from django.contrib import admin
from .models import Location
# Register your models here.
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("location_name","latitude","longitude","distance_threshold")  # Show these fields in the list view
    fields = ("location_name","latitude","longitude","distance_threshold")  # Fields shown in the admin form