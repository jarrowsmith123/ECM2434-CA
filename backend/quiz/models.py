from django.db import models

class QuizQuestion(models.Model):
    question_text = models.CharField(max_length=200)
    choice1 = models.CharField(max_length=200)
    choice2 = models.CharField(max_length=200)
    choice3 = models.CharField(max_length=200)
    choice4 = models.CharField(max_length=200)
    answer = models.IntegerField()  # Index of the correct answer (0-3)
    TYPES = [
        ('F&D', 'Food and Drink'),
        ('HWB', 'Health and Wellbeing'),
        ('W', 'Water'),
        ('E', 'Energy'),
        ('WA', 'Waste'),
        ('N&B', 'Nature and Biodiversity'),
    ]
    type = models.CharField(max_length=3, choices=TYPES)
