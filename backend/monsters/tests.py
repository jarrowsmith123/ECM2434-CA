from django.test import TestCase
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import UserProfile
from unittest.mock import patch
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Monster, PlayerMonster

# Create your tests here.
class GenerateRandomMonsterTests(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test monsters of Health type with different rarities
        # NOTE: Changed type to 'HWB' to match the TYPES choices in Monster model
        self.common_monster = Monster.objects.create(name='CommonHealth', type='HWB', rarity='C')
        self.rare_monster = Monster.objects.create(name='RareHealth', type='HWB', rarity='R')
        self.epic_monster = Monster.objects.create(name='EpicHealth', type='HWB', rarity='E')
        self.legendary_monster = Monster.objects.create(name='LegendaryHealth', type='HWB', rarity='L')
        
        # Update URL path to match urls.py
        self.url = '/api/monsters/random-monster/'

    def test_generate_new_monster(self):
        response = self.client.post(self.url, {'type': 'HWB'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlayerMonster.objects.filter(user=self.user).exists())

    

    def test_authentication_required(self):
        client = APIClient()  # Unauthenticated client
        response = client.post(self.url, {'type': 'HWB'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_monster_type(self):
        response = self.client.post(self.url, {'type': 'INVALID'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class MonsterModelTests(TestCase):
    def setUp(self):
        self.monster = Monster.objects.create(
            name='TestMonster',
            type='HWB',
            rarity='C'
        )
        
    def test_monster_creation(self):
        self.assertEqual(self.monster.name, 'TestMonster')
        self.assertEqual(self.monster.type, 'HWB')
        self.assertEqual(self.monster.rarity, 'C')
        
    def test_monster_string_representation(self):
        expected_str = f"TestMonster (Rarity: C, Type:HWB)"
        self.assertEqual(str(self.monster), expected_str)
        
class PlayerMonsterTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.monster = Monster.objects.create(name='TestMonster', type='HWB', rarity='C')
        self.player_monster = PlayerMonster.objects.create(
            user=self.user,
            monster=self.monster,
            level=1
        )
        
    def test_player_monster_creation(self):
        self.assertEqual(self.player_monster.user, self.user)
        self.assertEqual(self.player_monster.monster, self.monster)
        self.assertEqual(self.player_monster.level, 1)
        
    def test_increment_level(self):
        self.player_monster.increment_level(1)
        self.assertEqual(self.player_monster.level, 2)
        
        # Test max level
        self.player_monster.level = PlayerMonster.MAX_LEVEL - 1
        self.player_monster.increment_level(2)
        self.assertEqual(self.player_monster.level, PlayerMonster.MAX_LEVEL)
        
    def test_string_representation(self):
        expected_str = f"testuser's TestMonster (Level: 1)"
        self.assertEqual(str(self.player_monster), expected_str)