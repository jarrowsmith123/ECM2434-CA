from django.urls import path
from . import views

urlpatterns = [
    path("calculate-score/", views.calculate_hand_score, name="calculate-hand-score"),
    path("submit-attempt/", views.submit_challenge_attempt, name="submit-challenge-attempt"),
    path("create-challenge/", views.create_challenge, name="create-challenge"),
]