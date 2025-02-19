from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'challenges', views.ChallengeViewSet)
router.register(r'user-challenges', views.UserChallengeViewSet, basename='user-challenge')

urlpatterns = [
    path('', include(router.urls)),
]