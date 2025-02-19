from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Challenge, UserChallenge
from .serializers import ChallengeSerializer, UserChallengeSerializer

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        challenge = self.get_object()
        user = request.user
        
        # Check if challenge is already assigned to this user
        if UserChallenge.objects.filter(user=user, challenge=challenge).exists():
            return Response(
                {"detail": "Challenge already assigned to this user"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create a new UserChallenge
        user_challenge = UserChallenge.objects.create(
            user=user,
            challenge=challenge,
            status='assigned'
        )
        
        serializer = UserChallengeSerializer(user_challenge)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = UserChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserChallenge.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        user_challenge = self.get_object()
        progress = request.data.get('progress', None)
        
        if progress is None:
            return Response(
                {"detail": "Progress value is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            progress = float(progress)
        except ValueError:
            return Response(
                {"detail": "Progress must be a number"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update current_progress
        user_challenge.current_progress += progress
        
        # Check if challenge is completed
        if user_challenge.current_progress >= user_challenge.challenge.target_distance:
            user_challenge.status = 'completed'
            user_challenge.completed_at = timezone.now()
            
            # Update user profile total_km
            user_profile = user_challenge.user.profile
            user_profile.total_km += progress
            user_profile.save()
        
        user_challenge.save()
        serializer = self.get_serializer(user_challenge)
        return Response(serializer.data)
