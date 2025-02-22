from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, PlayerMonster, Monster
from django.urls import reverse
from unittest.mock import patch


class UserTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/user/register/'
        self.profile_url = '/api/user/profile/'
        self.token_url = '/api/token/'
        self.user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'securepass123',
        }

    def authenticate_user(self, username, password): # helper function to prevent code duplication
        token_response = self.client.post(self.token_url, {
            'username': username,
            'password': password
        }, format='json')
        if token_response.status_code == status.HTTP_200_OK:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_response.data["access"]}')
        return token_response

    def test_successful_user_flow(self):
        # test succesful registration
        register_response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        
        # test succesful authentication
        token_response = self.authenticate_user(self.user_data['username'], self.user_data['password'])
        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        
        # test initial profile state
        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['total_km'], 0.0)
        
        # test succesful profile update
        update_data = {
            'total_km': 15.5
        }
        update_response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['total_km'], update_data['total_km'])

    def test_edge_cases(self):
        # test registration invalid email
        invalid_email_data = {**self.user_data, 'email': 'notanemail'}
        response = self.client.post(self.register_url, invalid_email_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # test registration existing user
        self.client.post(self.register_url, self.user_data, format='json')
        duplicate_response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        # test wrong password
        wrong_pass_response = self.authenticate_user(self.user_data['username'], 'wrongpass123')
        self.assertEqual(wrong_pass_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # test nonexistent user
        nonexistent_user_response = self.authenticate_user('doesnotexist', 'somepass123')
        self.assertEqual(nonexistent_user_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # test invalid profile update
        self.authenticate_user(self.user_data['username'], self.user_data['password'])
        invalid_updates = {
            'total_km': 'not a number',
        }
        response = self.client.patch(self.profile_url, invalid_updates, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # test unauthorized access
        self.client.credentials()
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



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

