# Generated by Django 5.0.3 on 2025-02-25 04:22

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Monster",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=20)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("F&D", "Food and Drink"),
                            ("H", "Health"),
                            ("WB", "Wellbeing"),
                            ("W", "Water"),
                            ("WA", "Waste"),
                            ("N&B", "Nature and Biodiversity"),
                            ("T", "Transport"),
                        ],
                        max_length=3,
                    ),
                ),
                (
                    "rarity",
                    models.CharField(
                        choices=[
                            ("C", "Common"),
                            ("R", "Rare"),
                            ("E", "Epic"),
                            ("L", "Legendary"),
                        ],
                        max_length=1,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PlayerMonster",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("level", models.IntegerField(default=1)),
                (
                    "monster",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="player_monsters",
                        to="monsters.monster",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="player_monsters",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
