from django.urls import path
from . import views

urlpatterns = [
    path('create-question/', views.create_question, name='create-question'),
    path('get-question/<str:monster_type>/', views.get_question_text, name='get-question'),
    path('check-answer/', views.check_answer, name='check-answer'),
]
