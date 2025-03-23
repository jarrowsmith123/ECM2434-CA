from rest_framework import serializers
from .models import QuizQuestion

class QuestionTextSerializer(serializers.ModelSerializer):
    # for returning just the question text
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'choice1', 'choice2', 'choice3', 'choice4']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'choice1', 'choice2', 'choice3', 'choice4', 'answer', 'type']
