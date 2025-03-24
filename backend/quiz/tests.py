from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import QuizQuestion
from .serializers import QuestionSerializer, QuestionTextSerializer
import json

class QuizQuestionModelTests(TestCase):
    def setUp(self):
        self.question = QuizQuestion.objects.create(
            question_text="What is the most sustainable way to hydrate?",
            choice1="Single-use plastic water bottles",
            choice2="Reusable water bottle",
            choice3="Disposable cups",
            choice4="Buying bottled drinks",
            answer=1, 
            type="W" 
        )
    
    def test_question_creation(self):
        """Test that a question can be created with all fields"""
        self.assertEqual(self.question.question_text, "What is the most sustainable way to hydrate?")
        self.assertEqual(self.question.choice1, "Single-use plastic water bottles")
        self.assertEqual(self.question.choice2, "Reusable water bottle")
        self.assertEqual(self.question.choice3, "Disposable cups")
        self.assertEqual(self.question.choice4, "Buying bottled drinks")
        self.assertEqual(self.question.answer, 1)
        self.assertEqual(self.question.type, "W")
    
    def test_question_type_choices(self):
        """Test that question types are limited to the defined choices"""
        valid_types = ['F&D', 'HWB', 'W', 'E', 'WA', 'N&B']
        
        for q_type in valid_types:
            question = QuizQuestion(
                question_text=f"Test question for {q_type}",
                choice1="Option 1",
                choice2="Option 2",
                choice3="Option 3",
                choice4="Option 4",
                answer=0,
                type=q_type
            )
            question.full_clean()


class SerializerTests(TestCase):
    def setUp(self):
        self.question_data = {
            'question_text': 'Which of these energy sources is renewable?',
            'choice1': 'Coal',
            'choice2': 'Natural gas',
            'choice3': 'Solar power',
            'choice4': 'Oil',
            'answer': 2,
            'type': 'E'
        }
        
        self.question = QuizQuestion.objects.create(**self.question_data)
    
    def test_question_serializer(self):
        serializer = QuestionSerializer(self.question)
        
        self.assertEqual(serializer.data['question_text'], self.question_data['question_text'])
        self.assertEqual(serializer.data['choice1'], self.question_data['choice1'])
        self.assertEqual(serializer.data['choice2'], self.question_data['choice2'])
        self.assertEqual(serializer.data['choice3'], self.question_data['choice3'])
        self.assertEqual(serializer.data['choice4'], self.question_data['choice4'])
        self.assertEqual(serializer.data['answer'], self.question_data['answer'])
        self.assertEqual(serializer.data['type'], self.question_data['type'])
    
    def test_question_text_serializer(self):
        serializer = QuestionTextSerializer(self.question)
        
        self.assertEqual(serializer.data['question_text'], self.question_data['question_text'])
        self.assertEqual(serializer.data['choice1'], self.question_data['choice1'])
        self.assertEqual(serializer.data['choice2'], self.question_data['choice2'])
        self.assertEqual(serializer.data['choice3'], self.question_data['choice3'])
        self.assertEqual(serializer.data['choice4'], self.question_data['choice4'])
        self.assertNotIn('answer', serializer.data)
        self.assertNotIn('type', serializer.data)


class APIViewsTest(APITestCase): 
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword123'
        )
        
        self.client = APIClient()
        
        self.water_question = QuizQuestion.objects.create(
            question_text="What is the most water-efficient practice?",
            choice1="Taking long showers",
            choice2="Fixing leaky faucets",
            choice3="Leaving water running while brushing teeth",
            choice4="Using a hose to clean sidewalks",
            answer=1,
            type="W"
        )
        
        self.energy_question = QuizQuestion.objects.create(
            question_text="What saves the most energy?",
            choice1="Leaving electronics on standby",
            choice2="Using incandescent light bulbs",
            choice3="Using LED light bulbs",
            choice4="Keeping windows open with AC running",
            answer=2,
            type="E"
        )
    
    def test_create_question_authenticated(self):
        self.client.force_authenticate(user=self.user)
        
        new_question = {
            'question_text': 'What is the best way to reduce food waste?',
            'choice1': 'Buy in bulk',
            'choice2': 'Meal planning',
            'choice3': 'Ignoring expiration dates',
            'choice4': 'Weekly shopping without a list',
            'answer': 1,
            'type': 'F&D'
        }
        
        response = self.client.post(
            reverse('create-question'),  
            new_question,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QuizQuestion.objects.count(), 3) 
        
        created_question = QuizQuestion.objects.get(question_text=new_question['question_text'])
        self.assertEqual(created_question.choice2, new_question['choice2'])
        self.assertEqual(created_question.answer, new_question['answer'])
        self.assertEqual(created_question.type, new_question['type'])
    
    def test_create_question_unauthenticated(self):
        new_question = {
            'question_text': 'What is the best way to reduce food waste?',
            'choice1': 'Buy in bulk',
            'choice2': 'Meal planning',
            'choice3': 'Ignoring expiration dates',
            'choice4': 'Weekly shopping without a list',
            'answer': 1,
            'type': 'F&D'
        }
        
        response = self.client.post(
            reverse('create-question'), 
            new_question,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(QuizQuestion.objects.count(), 2) 
    
    def test_get_question_text(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(
            reverse('get-question', kwargs={'monster_type': 'W'})  
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data['question_text'], self.water_question.question_text)
        self.assertEqual(response.data['choice1'], self.water_question.choice1)
        self.assertEqual(response.data['choice2'], self.water_question.choice2)
        self.assertEqual(response.data['choice3'], self.water_question.choice3)
        self.assertEqual(response.data['choice4'], self.water_question.choice4)
        self.assertNotIn('answer', response.data) 
    
    def test_check_answer_correct(self):
        self.client.force_authenticate(user=self.user)
        
        answer_data = {
            'question_id': self.water_question.id,
            'answer': self.water_question.answer
        }
        
        response = self.client.post(
            reverse('check-answer'), 
            answer_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['correct'], True)
    
    def test_check_answer_incorrect(self):
        self.client.force_authenticate(user=self.user)

        incorrect_answer = (self.water_question.answer + 1) % 4
        
        answer_data = {
            'question_id': self.water_question.id,
            'answer': incorrect_answer
        }
        
        response = self.client.post(
            reverse('check-answer'),  
            answer_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['correct'], False)
    
    def test_check_answer_nonexistent_question(self):
        self.client.force_authenticate(user=self.user)
        
        nonexistent_id = 999
        
        answer_data = {
            'question_id': nonexistent_id,
            'answer': 0
        }
        
        response = self.client.post(
            reverse('check_answer'), 
            answer_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)