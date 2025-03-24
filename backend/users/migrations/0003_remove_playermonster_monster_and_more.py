# Generated by Django 5.0.3 on 2025-02-25 04:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_monster_playermonster"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="playermonster",
            name="monster",
        ),
        migrations.RemoveField(
            model_name="playermonster",
            name="user",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="display_name",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="distance_today",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="distance_week",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="total_km",
        ),
        migrations.AddField(
            model_name="userprofile",
            name="game_won_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.DeleteModel(
            name="Monster",
        ),
        migrations.DeleteModel(
            name="PlayerMonster",
        ),
    ]
