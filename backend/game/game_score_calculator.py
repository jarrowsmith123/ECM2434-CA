class GameScoreCalculator:

    def validate_monsters(self, monsters):
        # Check that the hand size is between 1 and 5
        if not monsters:
            return False
        if len(monsters) > 5:
            return False
        
        # Check that there are no duplicate monsters
        monster_ids = [monster.id for monster in monsters]
        if len(monster_ids) != len(set(monster_ids)):
            return False
        
        return True
        
    def calculate_score(self, monsters):

        if not monsters or not self.validate_monsters(monsters):
            return 0
        
        bio_diversity_multiplier = 1.1
        well_being_multiplier = 1
        score = 0
        multiplier = 1
        monster_levels = [monster.level for monster in monsters]

        types_in_play = [monster.monster.type for monster in monsters]

        # For any waste monsters in play, swap the lowest level monster with that waste card's level
        if 'WA' in types_in_play:
            waste_cards = [monster for monster in monsters if monster.monster.type == 'WA']
            for waste_card in waste_cards:
                min_level = min(monster_levels)
                monster_levels.remove(min_level)
                monster_levels.append(waste_card.level)

        # If at least one of the monster is nature&biodiversity, add a multiplier to all scores
        if 'N&B' in types_in_play:
            multiplier = bio_diversity_multiplier ** len(types_in_play)

        # If at least one of the monster is well-being, add a flat rate to each score
        if 'WB' in types_in_play:
            score += len(types_in_play) * well_being_multiplier

        for level in monster_levels:
            score += level
        # Converting float to int might change expected score so we need to look at this later
        return int(score * multiplier)

        
    