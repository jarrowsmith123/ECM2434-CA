from django.shortcuts import render,get_object_or_404
from .models import PlayerMonster
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UserSerializer, UserProfileSerializer,MonsterSerializer,PlayerMonsterSerializer
from .models import Monster



@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # add better handling off fails because errors like this come back as 400 bad request
        # this is a conflict error 409 so use that not the 400 error for anything and everything
        # Validation errors: {'username': [ErrorDetail(string='A user with that username already exists.', code='unique')]}
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e: # need to add logging and make this do it properly because printing exceptions is yucky
        print(e)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserProfileSerializer(request.user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_monster(request): # Create new monster
    serializer = MonsterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def increment_player_monster_level(request, player_monster_id):
    # ensures ownership of monster
    player_monster = get_object_or_404(PlayerMonster, pk=player_monster_id, user=request.user)
    #increment defaulted to 1 if not specified how much
    increment_amount = request.data.get('increment_amount', 1)

    try:
        player_monster.increment_level(increment_amount)
        serializer = PlayerMonsterSerializer(player_monster)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_player_monster(request):
    # Get the monster ID from request data
    monster_id = request.data.get('monster_id')
    monster = get_object_or_404(Monster, pk=monster_id)
    
    # Create player monster instance
    player_monster = PlayerMonster.objects.create(
        user=request.user,
        monster=monster,
        level=1,
    )
    try:
        serializer = PlayerMonsterSerializer(player_monster)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(e)
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

