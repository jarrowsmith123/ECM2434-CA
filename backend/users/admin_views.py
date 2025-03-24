from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from monsters.models import Monster, PlayerMonster
from quiz.models import QuizQuestion
from location.models import Location
from .serializers import UserSerializer
from monsters.serializers import MonsterSerializer, PlayerMonsterSerializer
from quiz.serializers import QuestionSerializer
from location.serializers import LocationSerializer
from game.models import GameChallenge
from game.serializers import GameChallengeSerializer

# Admin permission check - now uses is_superuser
def is_admin(user):
    return user.is_superuser

# Admin User Management
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_detail(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_admin_status(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        is_admin_value = request.data.get('is_admin')
        
        if is_admin_value is not None:
            user.is_superuser = is_admin_value
            user.is_staff = is_admin_value  # Also update is_staff for admin panel access
            user.save()
            return Response({"message": f"Admin status updated for {user.username}"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "is_admin field is required"}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin Monster Management
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_monsters(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        monsters = Monster.objects.all()
        serializer = MonsterSerializer(monsters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_monsters(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        monsters = PlayerMonster.objects.filter(user=user)
        serializer = PlayerMonsterSerializer(monsters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_monster_to_user(request, user_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        monster_id = request.data.get('monster_id')
        level = request.data.get('level', 1)
        
        if not monster_id:
            return Response({"error": "monster_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            monster = Monster.objects.get(id=monster_id)
        except Monster.DoesNotExist:
            return Response({"error": "Monster not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user already has this monster
        existing_monster = PlayerMonster.objects.filter(user=user, monster=monster).first()
        if existing_monster:
            return Response({"error": "User already has this monster"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new player monster
        player_monster = PlayerMonster.objects.create(
            user=user,
            monster=monster,
            level=level
        )
        
        serializer = PlayerMonsterSerializer(player_monster)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_player_monster(request, player_monster_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        player_monster = PlayerMonster.objects.get(id=player_monster_id)
        level = request.data.get('level')
        
        if level is not None:
            player_monster.level = level
            player_monster.save()
            
        serializer = PlayerMonsterSerializer(player_monster)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except PlayerMonster.DoesNotExist:
        return Response({"error": "Player monster not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_player_monster(request, player_monster_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        player_monster = PlayerMonster.objects.get(id=player_monster_id)
        player_monster.delete()
        return Response({"message": "Player monster deleted"}, status=status.HTTP_200_OK)
    except PlayerMonster.DoesNotExist:
        return Response({"error": "Player monster not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin Quiz Question Management
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_quiz_questions(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        questions = QuizQuestion.objects.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin Location Management with Monster assignment
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_locations_with_monsters(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        locations = Location.objects.all()
        location_data = []
        
        for location in locations:
            location_serializer = LocationSerializer(location).data
            location_data.append(location_serializer)
            
        return Response(location_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_location_with_monster(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        location_serializer = LocationSerializer(data=request.data)
        if location_serializer.is_valid():
            location = location_serializer.save()
            return Response(location_serializer.data, status=status.HTTP_201_CREATED)
            
        print(location_serializer.errors)
            
        return Response(location_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Check if user is admin
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_admin_status(request):
    try:
        is_admin_user = is_admin(request.user)
        return Response({"is_admin": is_admin_user}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin Challenge Management
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_challenges(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        challenges = GameChallenge.objects.all().order_by('id')
        serializer = GameChallengeSerializer(challenges, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        serializer = GameChallengeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_challenge(request, challenge_id):
    if not is_admin(request.user):
        return Response({"error": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        challenge = get_object_or_404(GameChallenge, id=challenge_id)
        
        if request.method == 'GET':
            serializer = GameChallengeSerializer(challenge)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            serializer = GameChallengeSerializer(challenge, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            challenge.delete()
            return Response({"message": "Challenge deleted successfully"}, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
