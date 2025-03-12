from django.urls import path
from . import views

urlpatterns = [
    path('create-question/', views.create_question, name='create-question'),
    path('get-question-text/', views.get_question_text, name='get-question-text'),
    path('check-answer/', views.check_answer, name='check-answer'),
]