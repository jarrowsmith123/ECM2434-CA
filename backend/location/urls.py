from django.urls import path
from . import views

urlpatterns = [
    path('locations/', views.get_all_locations, name='get_all_locations'),
    path('locations/create/', views.create_location, name='create_location'),
    path('locations/update/<int:location_id>/', views.update_location, name='update_location'),
]