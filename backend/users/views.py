from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer, FriendshipSerializer
from .models import User, Friendship
from django.db.models import Q
from monsters.models import PlayerMonster
from monsters.serializers import PlayerMonsterSerializer
from .models import UserProfile

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
        relationship_data = request.data
        relationship_data['sender'] = request.user.username
        
        serializer = FriendshipSerializer(data=relationship_data)
        
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
        serializer = FriendshipSerializer(Friendship.objects, many=True)
    
        friends = Friendship.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user),
        )
        serializer = FriendshipSerializer(friends, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_user(request):
    try:
        query_string = request.GET.get('search', '')
        users = User.objects.filter(username__icontains=query_string) #
        limit =  request.GET.get('limit', 1) # deaults the limit to 1
        matching_users = users[:int(limit)]
        serializer = UserSerializer(matching_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            # i love defaulting to 500 error and not being more specific, we should have started our error handling sooner lol
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(
        request.user.username,
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_user_profile(request, username):
    try:
        user = User.objects.get(username=username)
        
        # Check if the requesting user is friends with the target user
        is_friend = Friendship.objects.filter(
            Q(sender=request.user, receiver=user, status='accepted') |
            Q(sender=user, receiver=request.user, status='accepted')
        ).exists()
        
        if not is_friend and request.user.username != username:
            return Response(
                {'error': 'You must be friends with this user to view their profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(user)
        
        player_monsters = PlayerMonster.objects.filter(user=user)
        monster_serializer = PlayerMonsterSerializer(player_monsters, many=True)
        
        # Combine user data with monster data
        response_data = serializer.data
        response_data['monsters'] = monster_serializer.data
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    try:
        # Get top 5 users by game_won_count
        top_users = UserProfile.objects.order_by('-game_won_count')[:5]
        
        # Get the requesting user's profile
        user_profile = request.user.profile
        
        # Create list of top users with their ranks
        leaderboard_data = []
        for index, profile in enumerate(top_users):
            leaderboard_data.append({
                'rank': index + 1,
                'username': profile.user.username,
                'game_won_count': profile.game_won_count,
                'is_current_user': profile.user.id == request.user.id
            })
        
        # Find current user's rank if not in top 5
        current_user_in_top = any(entry['is_current_user'] for entry in leaderboard_data)
        current_user_rank = None
        
        if not current_user_in_top:
            # Count how many users have more wins than the current user
            higher_ranked_count = UserProfile.objects.filter(
                game_won_count__gt=user_profile.game_won_count
            ).count()
            
            current_user_rank = higher_ranked_count + 1
            
            # Add current user data
            current_user_data = {
                'rank': current_user_rank,
                'username': request.user.username,
                'game_won_count': user_profile.game_won_count,
                'is_current_user': True
            }
            
            leaderboard_data.append(current_user_data)
        
        return Response({
            'top_users': leaderboard_data,
            'current_user_rank': current_user_rank
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
