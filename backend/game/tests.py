from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from users.models import Monster, PlayerMonster
from .game_score_calculator import GameScoreCalculator

class GameScoreCalculatorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test monsters
        self.monster_wb = Monster.objects.create(name='WellbeingMonster', type='WB', rarity='C')
        self.monster_nb = Monster.objects.create(name='BiodiversityMonster', type='N&B', rarity='R')
        self.monster_wa = Monster.objects.create(name='WasteMonster', type='WA', rarity='E')
        self.monster_health = Monster.objects.create(name='HealthMonster', type='H', rarity='C')
        
        # Create player monsters
        self.player_wb = PlayerMonster.objects.create(user=self.user, monster=self.monster_wb, level=2)
        self.player_nb = PlayerMonster.objects.create(user=self.user, monster=self.monster_nb, level=3)
        self.player_wa = PlayerMonster.objects.create(user=self.user, monster=self.monster_wa, level=4)
        self.player_health = PlayerMonster.objects.create(user=self.user, monster=self.monster_health, level=1)
        
        self.calculator = GameScoreCalculator()

    def test_validation(self):
        # Test empty hand
        self.assertFalse(self.calculator.validate_monsters([]))
        
        # Test too big hand
        six_monsters = [self.player_health] * 6
        self.assertFalse(self.calculator.validate_monsters(six_monsters))
        
        # Test duplicates in hand
        duplicates = [self.player_health, self.player_health]
        self.assertFalse(self.calculator.validate_monsters(duplicates))
        
        # Test ok hand
        valid_hand = [self.player_health, self.player_wb]
        self.assertTrue(self.calculator.validate_monsters(valid_hand))

    def test_waste_card_mechanic(self):
        hand = [self.player_wa, self.player_health, self.player_wb]  # levels 4, 1, 2
        score = self.calculator.calculate_score(hand)
        # Waste level 4 replaces level 1, WB bonus of 3
        expected_score = (4 + 2 + 4 + 3)
        self.assertEqual(score, expected_score)

    def test_biodiversity_multiplier(self):
        hand = [self.player_nb, self.player_health, self.player_wb]  # 3 different types
        score = self.calculator.calculate_score(hand)
        base_score = 3 + 1 + 2  # score for no multiplier
        type_bonus = 1.1 ** 3 # WB bonus for 3 types
        expected_score = int((base_score + type_bonus) * type_bonus)
        self.assertEqual(score, expected_score)

    def test_wellbeing_bonus(self):
        hand = [self.player_wb, self.player_health]  # 2 types
        score = self.calculator.calculate_score(hand)
        expected_score = 2 + 1 + 2  # Levels + WB bonus of 2 types
        self.assertEqual(score, expected_score)