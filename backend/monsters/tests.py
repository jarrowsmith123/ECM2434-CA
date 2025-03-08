from django.test import TestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, PlayerMonster, Monster
from unittest.mock import patch
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

# Create your tests here.
class GenerateRandomMonsterTests(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test monsters of Health type with different rarities
        self.common_monster = Monster.objects.create(name='CommonHealth', type='H', rarity='C')
        self.rare_monster = Monster.objects.create(name='RareHealth', type='H', rarity='R')
        self.epic_monster = Monster.objects.create(name='EpicHealth', type='H', rarity='E')
        self.legendary_monster = Monster.objects.create(name='LegendaryHealth', type='H', rarity='L')
        
        self.url = '/api/user/random-monster/'

    def test_generate_new_monster(self):
        response = self.client.post(self.url, {'type': 'H'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlayerMonster.objects.filter(user=self.user).exists())

    def test_duplicate_monster_increases_level(self):
        # Create initial player monster
        initial_monster = PlayerMonster.objects.create(
            user=self.user,
            monster=self.common_monster,
            level=1
        )
        
        # Force common monster by patching random choice
        with patch('random.choices', return_value=['C']):
            response = self.client.post(self.url, {'type': 'H'})
            
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        updated_monster = PlayerMonster.objects.get(id=initial_monster.id)
        self.assertEqual(updated_monster.level, 2)

    def test_authentication_required(self):
        client = APIClient()  # Unauthenticated client
        response = client.post(self.url, {'type': 'H'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_monster_type(self):
        response = self.client.post(self.url, {'type': 'INVALID'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)