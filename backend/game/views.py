from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from users.models import PlayerMonster
from .game_score_calculator import GameScoreCalculator
from .models import GameChallenge
from .serializers import GameChallengeSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_hand_score(request):

    try:
        monster_ids = request.data.get('monster_ids', [])
        monsters = PlayerMonster.objects.filter(
            id__in=monster_ids,
            user=request.user
        )
    # TODO add better error handling and codes
    except PlayerMonster.DoesNotExist:
        return Response({
            'error': 'Invalid monster IDs'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    calculator = GameScoreCalculator()
    score = calculator.calculate_score(monsters)
    
    return Response({
        'score': score
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_challenge_attempt(request):
    try:
        challenge_id = request.data.get('challenge_id')
        challenge = get_object_or_404(GameChallenge, id=challenge_id)
        challenge_data = GameChallengeSerializer(challenge).data

        monster_ids = request.data.get('monster_ids', [])
        monsters = PlayerMonster.objects.filter(
            id__in=monster_ids,
            user=request.user
        )

        calculator = GameScoreCalculator()
        score = calculator.calculate_score(monsters)

        if score >= challenge.target_score:
            for monster in monsters:
                monster.level += 1
                monster.save()

            return Response({
                'success': True,
                'score': score,
                'challenge': challenge_data,
                'message': 'Challenge completed! Monsters leveled up.',
                'monsters_leveled': [monster.id for monster in monsters]
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'score': score,
                'challenge': challenge_data,
                'message': 'Score not high enough to complete challenge.'
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Again better error handling needed but this will do for now
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    serializer = GameChallengeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)