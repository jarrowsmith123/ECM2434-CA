# Generated by Django 5.0.3 on 2025-03-16 23:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0002_alter_quizquestion_type"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="quizquestion",
            name="knowledge",
        ),
        migrations.AddField(
            model_name="quizquestion",
            name="choice1",
            field=models.CharField(default=0, max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="quizquestion",
            name="choice2",
            field=models.CharField(default=0, max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="quizquestion",
            name="choice3",
            field=models.CharField(default=0, max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="quizquestion",
            name="choice4",
            field=models.CharField(default=0, max_length=200),
            preserve_default=False,
        ),
    ]
