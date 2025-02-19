from django.db import models
from django.contrib.auth.models import User

class Challenge(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    start_date = models.DateField()
    
    def __str__(self):
        return self.title

class UserChallenge(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    current_progress = models.FloatField(default=0.0, help_text="percentage completed")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'challenge']
        
    def __str__(self):
        return f"{self.user.username}'s {self.challenge.title} Challenge"
