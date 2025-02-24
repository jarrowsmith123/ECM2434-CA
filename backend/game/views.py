from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.models import PlayerMonster
from .game_score_calculator import GameScoreCalculator

@api_view(['POST'])
def calculate_hand_score(request):

    try:
        monster_ids = request.data.get('monster_ids', [])
        monsters = PlayerMonster.objects.filter(
            id__in=monster_ids,
            user=request.user
        )

    except PlayerMonster.DoesNotExist:
        return Response({
            'error': 'Invalid monster IDs'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    calculator = GameScoreCalculator()
    score = calculator.calculate_score(monsters)
    
    return Response({
        'score': score
    }, status=status.HTTP_200_OK)