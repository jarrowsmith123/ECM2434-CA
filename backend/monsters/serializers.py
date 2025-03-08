from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Monster,PlayerMonster

class MonsterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Monster
        fields = ['id','name','type','rarity']


class PlayerMonsterSerializer(serializers.ModelSerializer):
    monster = MonsterSerializer(read_only=True)
    class Meta:
        model = PlayerMonster
        fields = ['id', 'user', 'monster', 'level']