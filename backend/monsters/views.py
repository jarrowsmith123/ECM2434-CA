
from django.shortcuts import render,get_object_or_404
from .models import PlayerMonster
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import MonsterSerializer,PlayerMonsterSerializer
from .models import Monster
from random import choices

# Create your views here.
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_random_monster(request):
    monster_type = request.data.get('type')

    # Validate monster type
    if not Monster.objects.filter(type=monster_type).exists():
        return Response(
            {'error': f'Invalid monster type: {monster_type}'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    rarities = ['C', 'R', 'E', 'L']  # The possible outcomes
    weights = [0.6, 0.25, 0.1, 0.05]  
    
    selected_rarity = choices(rarities, weights=weights)[0]
    selected_monster = Monster.objects.get(type=monster_type, rarity=selected_rarity)
    
    # Check if user already has this monster
    existing_player_monster = PlayerMonster.objects.filter(
        user=request.user,
        monster=selected_monster
    ).first()
    
    if existing_player_monster:
        # Increment level of existing monster
        existing_player_monster.increment_level(1)
        serializer = PlayerMonsterSerializer(existing_player_monster)
        print(existing_player_monster)

    else:
        # Create new player monster
        player_monster = PlayerMonster.objects.create(
            user=request.user,
            monster=selected_monster,
            level=1
        )
        print(player_monster)
        serializer = PlayerMonsterSerializer(player_monster)
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)