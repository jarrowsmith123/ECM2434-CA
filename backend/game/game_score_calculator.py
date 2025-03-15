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
        # given a list of monsters, returns an integer score based on different synergies and the sum of the levels

        if not monsters or not self.validate_monsters(monsters):
            return 0
        
        # These are the multipliers for each type
        bio_diversity_multiplier = 1.2
        well_being_multiplier = 20
        water_multiplier = 1.5

        score = 0
        multiplier = 1

        monster_levels = [monster.level for monster in monsters]
        types_in_play = [monster.monster.type for monster in monsters]

        # Water synergy - adds a multiplier proportional to number of missing monsters
        if 'W' in types_in_play:
            multiplier = max((water_multiplier * (5 - len(monsters))),1) # if a 5 monsters played this will make multiplier = 0, so normalise to 1

        # Energy synergy - each energy card is doubled if not playing 5 monsters
        if 'E' in types_in_play:

            energy_cards = [monster for monster in monsters if monster.monster.type == 'E']
            if len(monster_levels) < 5:
                for energy_card in energy_cards:
                    monster_levels.remove(energy_card.level)
                    monster_levels.append(energy_card.level * 2)

        # Food synergy - if food and drinak AND waste are in play, double score of all food cards
        if 'WA' in types_in_play and 'F&D' in types_in_play:
           
            food_cards = [monster for monster in monsters if monster.monster.type == 'F&D']
            for food_card in food_cards:
                monster_levels.remove(food_card.level)
                monster_levels.append(food_card.level * 2)
           
        # Waste synergy - for any waste monsters in play, swap the lowest level monster with that waste monster's score
        if 'WA' in types_in_play:
            waste_cards = [monster for monster in monsters if monster.monster.type == 'WA']
            for waste_card in waste_cards:
                min_level = min(monster_levels)
                monster_levels.remove(min_level)
                monster_levels.append(waste_card.level)

        # Nature synergy - if at least one of the monsters is nature&biodiversity, add a multiplier to all scores based on the number of types in play
        if 'N&B' in types_in_play:
            multiplier *= bio_diversity_multiplier ** len(types_in_play)

        # Health synergy - If at least one of the monster is health & well being, add a flat rate to each score
        if 'HWB' in types_in_play:
            score += len(monsters) * well_being_multiplier

        for level in monster_levels:
            score += level

        # Converting float to int might change expected score so we need to look at this later
        return int(score * multiplier)

    