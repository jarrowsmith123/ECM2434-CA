from django.db import models

# Create your models here.
class QuizQuestion(models.Model):
    question_text = models.CharField(max_length=200)
    answer = models.IntegerField()
    knowledge = models.CharField(max_length=400)
    TYPES = [
        ('F&D', 'Food and Drink'),
        ('HWB', 'Health and Wellbeing'),
        ('W', 'Water'),
        ('E', 'Energy'),
        ('WA', 'Waste'),
        ('N&B', 'Nature and Biodiversity'),
    ]
    type = models.CharField(max_length=3, choices=TYPES)