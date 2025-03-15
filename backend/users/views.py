from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer, FriendshipSerializer
from .models import User, Friendship
from django.db.models import Q
from django.shortcuts import render

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(status=status.HTTP_201_CREATED)
            
        if serializer.errors:
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_409_CONFLICT
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_friend_request(request):
    try:
        serializer = FriendshipSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        if serializer.errors:
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_409_CONFLICT
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, friend_request_id):
    try:
        friend_request = Friendship.objects.get(id=friend_request_id)
        if friend_request.receiver != request.user:
            return Response(
                {'error': 'You do not have permission to accept this friend request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        friend_request.status = 'accepted'
        friend_request.save()
        return Response(status=status.HTTP_200_OK)
    except Friendship.DoesNotExist:
        return Response(
            {'error': 'Friend request not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def decline_friend_request(request, friend_request_id):
    try:
        friend_request = Friendship.objects.get(id=friend_request_id)
        if friend_request.receiver != request.user:
            return Response(
                {'error': 'You do not have permission to decline this friend request.'},
                status=status.HTTP_403_FORBIDDEN
            )
        friend_request.status = 'declined'
        friend_request.save()
        return Response(status=status.HTTP_200_OK)
    except Friendship.DoesNotExist:
        return Response(
            {'error': 'Friend request not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    try:
        friends = Friendship.objects.filter(
            Q(sender=request.user) or  Q(receiver=request.user),
        )
        serializer = FriendshipSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except AttributeError as e:
        return Response(
            {'error': f'User profile not found. {str(e)}'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(str(e))
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    try:
        user = request.user
        user.delete()
        return Response(
            {'message': 'account deleted'},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        return Response(
            {'error': 'failed to delete account'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def leaderboard(request):
    ordered_players = User.objects.all().order_by('-game_won_count')
    return [(player.user.username, player.game_won_count) for player in ordered_players]
