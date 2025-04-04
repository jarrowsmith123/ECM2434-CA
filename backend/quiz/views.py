from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import QuestionSerializer, QuestionTextSerializer
from .models import QuizQuestion
from monsters.models import Monster
import random

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_question(request):
    try:
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # This error handling is stinky but as always someone else will fix it :)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_question_text(request, monster_type):
    try:
        # gets the type of the monster and picks a random question from that type
        questions = QuizQuestion.objects.filter(type=monster_type)
        chosen_question = random.choice(questions)
        serializer = QuestionTextSerializer(chosen_question)
        return Response(serializer.data)
    except QuizQuestion.DoesNotExist:
        return Response({'error': 'No questions found for this monster type'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_answer(request):
    try:
        question_id = request.data.get('question_id')
        user_answer = request.data.get('answer')
        
        question = QuizQuestion.objects.get(pk=question_id)
        if question.answer == user_answer:
            return Response({'correct': True})
        else:
            return Response({'correct': False})
    except QuizQuestion.DoesNotExist:
        return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
