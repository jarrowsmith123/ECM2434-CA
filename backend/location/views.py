from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_location(request):
    user_lat = request.data.get("latitude")
    user_long = request.data.get("longitude")

    if user_lat is None or user_long is None:
        return JsonResponse({"error": "Latitude and longitude are required"}, status=400)

    campus_locations = [
        {"name": "Forum", "lat": 50.735546, "long": -3.533178},
        {"name": "Lower Hoopern Valley", "lat": 50.734263, "long": -3.531650},
        {"name": "Gym", "lat": 50.738043, "long": -3.536892},
        {"name": "Reed Pond", "lat": 50.732781, "long": -3.535829},
        {"name": "Sports park solar panels", "lat": 50.739161, "long": -3.532229}
    ]
    # will have to be changeable by gamekeepers

    threshold = 0.00015  # roughly 15m

    for location in campus_locations:
        if abs(user_lat - location["lat"]) < threshold and abs(user_long - location["long"]) < threshold:
            return JsonResponse({"message": f"You are at the {location['name']}!"})

    return JsonResponse({"message": "You are not at a recognized campus location."})