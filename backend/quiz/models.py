from django.db import models

# Create your models here.
class QuizQuestion(models.Model):
    question_text = models.CharField(max_length=200)
    answer = models.IntegerField()
    knowledge = models.CharField(max_length=400)
    TYPES = [
        ('F&D', 'Food and Drink'),
        ('H', 'Health'),
        ('WB', 'Wellbeing'),
        ('W', 'Water'),
        ('WA', 'Waste'),
        ('N&B', 'Nature and Biodiversity'),
        ('T', 'Transport'),
    ]
    type = models.CharField(max_length=3, choices=TYPES)