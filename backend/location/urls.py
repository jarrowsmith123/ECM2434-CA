from django.urls import path
from .views import check_location

urlpatterns = [
    path("check-location/", check_location, name="check-location"),
]