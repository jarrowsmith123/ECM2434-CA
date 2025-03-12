from rest_framework import serializers
from .models import QuizQuestion

class QuestionTextSerializer(serializers.ModelSerializer):
    # for returning just the question text
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'answer', 'knowledge', 'type']