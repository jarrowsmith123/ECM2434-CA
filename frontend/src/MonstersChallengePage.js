import React, { useState, useEffect } from 'react';
import './MonstersChallengePage.css';

const BACKEND = "http://localhost:8000/api";

// This is all for getting the images filepath
const getMonsterImage = (type, rarity) => {
  const typeImageMap = {
    'F&D': 'food',     // Food and Drink
    'H': 'health',     // Health
    'WB': 'wellbeing', // Wellbeing
    'W': 'water',      // Water
    'WA': 'waste',     // Waste
    'N&B': 'nature',   // Nature and Biodiversity
    'T': 'transport'   // Transport
  };
  
  // Maps the rarity to the number on the image
  const rarityNumber = {
    'C': '1', // Common
    'R': '2', // Rare
    'E': '3', // Epic
    'L': '4'  // Legendary
  };
  
  // Get the base type name
  const baseType = typeImageMap[type] || 'nature';
  
  // Get rarity number or use commin represented as 1 as default
  const rarityNum = rarityNumber[rarity] || '1';
  
  // Return the full image path
  return `/images/${baseType}${rarityNum}.png`;
};

// Get CSS class based on monster rarity to make they look pretty
const getRarityClass = (rarity) => {
  switch(rarity) {
    case 'C': return 'rarity-common';
    case 'R': return 'rarity-rare';
    case 'E': return 'rarity-epic';
    case 'L': return 'rarity-legendary';
    default: return 'rarity-common';
  }
};

// Get the type as a label
const getTypeLabel = (type) => {
  const types = {
    'F&D': 'Food and Drink',
    'H': 'Health',
    'WB': 'Wellbeing',
    'W': 'Water',
    'WA': 'Waste',
    'N&B': 'Nature and Biodiversity',
    'T': 'Transport'
  };
  return types[type] || type;
};

// For part of the game logic
const calculateMonsterScore = (monsters) => {
  if (!monsters || monsters.length === 0 || monsters.length > 5) {
    return 0;
  }
  
  // Check for duplicate monsters
  const monsterIds = monsters.map(monster => monster.id);
  if (new Set(monsterIds).size !== monsterIds.length) {
    return 0;
  }
  
  const BIO_DIVERSITY_MULTIPLIER = 1.1;
  const WELL_BEING_MULTIPLIER = 1;
  
  let score = 0;
  let multiplier = 1;
  
  let monsterLevels = monsters.map(monster => monster.level);
  const typesInPlay = monsters.map(monster => monster.monster.type);
  
  // For any waste monsters in play, swap the lowest level monster with that waste card's level
  if (typesInPlay.includes('WA')) {
    const wasteCards = monsters.filter(monster => monster.monster.type === 'WA');
    
    for (const wasteCard of wasteCards) {
      const minLevel = Math.min(...monsterLevels);
      const minIndex = monsterLevels.indexOf(minLevel);
      monsterLevels.splice(minIndex, 1);
      monsterLevels.push(wasteCard.level);
    }
  }
  
  // If at least one of the monster is nature&biodiversity, add a multiplier to all scores
  if (typesInPlay.includes('N&B')) {
    multiplier = Math.pow(BIO_DIVERSITY_MULTIPLIER, typesInPlay.length);
  }
  
  // If at least one of the monster is well-being, add a flat rate to each score
  if (typesInPlay.includes('WB')) {
    score += typesInPlay.length * WELL_BEING_MULTIPLIER;
  }
  
  // Add all monster levels to the score
  for (const level of monsterLevels) {
    score += level;
  }
  
  // Convert to integer as done in backend
  return Math.floor(score * multiplier);
};

const SelectableMonsterCard = ({ monster, isSelected, isInHand, onToggleSelect }) => {
  const monsterImage = getMonsterImage(monster.monster.type, monster.monster.rarity);
  const baseScore = monster.level;
  
  return (
    <div
      className={`monster-card ${isSelected ? 'is-selected' : ''} ${isInHand ? 'in-hand' : ''}`}
      onClick={() => onToggleSelect(monster)}
    >
      <div className={`monster-image-container ${getRarityClass(monster.monster.rarity)}`}>
        <img
          src={monsterImage}
          alt={monster.monster.name}
          className="monster-image"
        />
        <div className="rarity-badge">
          {monster.monster.rarity === 'C' ? 'Common' :
           monster.monster.rarity === 'R' ? 'Rare' :
           monster.monster.rarity === 'E' ? 'Epic' :
           'Legendary'}
        </div>
        <div className="level-badge">Lvl {monster.level}</div>
        <div className="score-badge">{baseScore} pts</div>
      </div>
      <div className="monster-info">
        <h3 className="monster-name">{monster.monster.name}</h3>
        <p className="monster-type">{getTypeLabel(monster.monster.type)}</p>
      </div>
    </div>
  );
};

const HandMonsterCard = ({ monster, onRemove }) => {
  const monsterImage = getMonsterImage(monster.monster.type, monster.monster.rarity);
  const baseScore = monster.level;
  
  return (
    <div className="hand-monster-card">
      <div className={`monster-image-container ${getRarityClass(monster.monster.rarity)}`}>
        <img
          src={monsterImage}
          alt={monster.monster.name}
          className="monster-image"
        />
        <button
          className="remove-button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(monster.id);
          }}
          aria-label="Remove monster from team"
        >
          ×
        </button>
        <div className="score-badge">{baseScore} pts</div>
      </div>
      <div className="monster-name-small">{monster.monster.name}</div>
    </div>
  );
};

const calculateSynergies = (monstersInHand) => {
  // This function is no longer used for score calculation
  // But we'll keep it for UI display purposes only
  const synergies = [];
  const typeCount = {};
  
  // Count types
  monstersInHand.forEach(monster => {
    typeCount[monster.monster.type] = (typeCount[monster.monster.type] || 0) + 1;
  });
  
  // Check for type synergies.  3 of the same type this is for
  Object.entries(typeCount).forEach(([type, count]) => {
    if (count >= 3) {
      synergies.push({
        name: `${getTypeLabel(type)} Trio`,
        description: `3 or more ${getTypeLabel(type)} monsters`,
        bonus: 0 // No actual bonus, just for display
      });
    }
  });
  
  // Check for actual backend synergies
  const typesInPlay = monstersInHand.map(monster => monster.monster.type);
  
  if (typesInPlay.includes('N&B')) {
    synergies.push({
      name: 'Biodiversity Multiplier',
      description: `Nature & Biodiversity multiplies score by ${Math.pow(1.1, typesInPlay.length).toFixed(2)}`,
      bonus: 0 // Just for display, actual bonus calculated in score
    });
  }
  
  if (typesInPlay.includes('WB')) {
    synergies.push({
      name: 'Wellbeing Bonus',
      description: `Wellbeing adds +${typesInPlay.length} to score`,
      bonus: typesInPlay.length
    });
  }
  
  if (typesInPlay.includes('WA')) {
    const wasteCards = monstersInHand.filter(monster => monster.monster.type === 'WA');
    synergies.push({
      name: 'Waste Management',
      description: `${wasteCards.length} Waste card(s) replace lowest levels`,
      bonus: 0 // Just for display
    });
  }
  
  return synergies;
};

const MonsterChallengePage = () => {
  const [monsters, setMonsters] = useState([]);
  const [monstersInHand, setMonstersInHand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [synergies, setSynergies] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };
  
  // Fetch API helper with auth headers so that you don't have to keep writting it all
  const fetchWithAuth = async (endpoint, options = {}) => {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
    };
    
    const response = await fetch(`${BACKEND}${endpoint}`, {
      ...defaultOptions,
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const playerMonsters = await fetchWithAuth('/monsters/get-player-monsters/');
      setMonsters(playerMonsters);
      
      // Mock data as this doenst exist in the backend yet
      const challengeData = {
        id: 1,
        name: "Monsters Challenge",
        target_score: 350
      };
      setChallenge(challengeData);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load game data. Please try again later.');
      setLoading(false);
    }
  };
  
  const calculateScore = async (monsters) => {
    if (monsters.length === 0) {
      setCurrentScore(0);
      setSynergies([]);
      return;
    }
    
    try {
      const response = await fetchWithAuth('/game/calculate-score/', {
        method: 'POST',
        body: JSON.stringify({
          monster_ids: monsters.map(monster => monster.id)
        })
      });
      
      setCurrentScore(response.score);
      
      // The synergies are done in the frontend becaue the backend has dont it yet but it will do
      const currentSynergies = calculateSynergies(monsters);
      setSynergies(currentSynergies);
      
    } catch (err) {
      console.error("Error calculating score:", err);
      // Fallback to front-end calculation
      const backendScore = calculateMonsterScore(monsters);
      const currentSynergies = calculateSynergies(monsters);
      
      setSynergies(currentSynergies);
      setCurrentScore(backendScore);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    calculateScore(monstersInHand);
  }, [monstersInHand]);
  
  const toggleMonsterSelection = (monster) => {
    const isInHand = monstersInHand.some(m => m.id === monster.id);
    
    if (isInHand) {
      // Remove from hand if already selected
      removeFromHand(monster.id);
    } else {
      // Add to hand if not selected and hand isn't full
      if (monstersInHand.length >= 5) {
        setError('Your team is full! Remove a monster first.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      setMonstersInHand([...monstersInHand, monster]);
    }
  };
  
  // Remove monster from hand
  const removeFromHand = (monsterId) => {
    setMonstersInHand(monstersInHand.filter(m => m.id !== monsterId));
  };
  
  const submitChallenge = async () => {
    if (monstersInHand.length === 0) {
      setError('You need to add monsters to your team first!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const result = await fetchWithAuth('/game/submit-attempt/', {
        method: 'POST',
        body: JSON.stringify({
          challenge_id: challenge.id,
          monster_ids: monstersInHand.map(m => m.id)
        })
      });
      
      if (result.success) {
        setShowSuccess(true);
        setSuccessMessage(result.message || 'Challenge completed!');
        
        // Update the monsters with the new levels
        if (result.monsters_leveled && result.monsters_leveled.length > 0) {
          // Refresh monsters data after successful challenge
          const updatedMonsters = await fetchWithAuth('/monsters/get-player-monsters/');
          setMonsters(updatedMonsters);
        }
        
        setTimeout(() => {
          setShowSuccess(false);
          setMonstersInHand([]);
        }, 3000);
      } else {
        setError(result.message || 'Not enough score to complete the challenge. Try a different combination!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error("Error submitting challenge:", err);
      setError('Failed to submit challenge. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const resetTeam = () => {
    setMonstersInHand([]);
  };
  
  return (
    <div className="monsters-container">
      <div className="monsters-content">
        {/* Challenge Info Card */}
        <div className="challenge-card">
          <div className="challenge-header">
            <h2 className="challenge-title">
              {challenge ? challenge.name : 'Loading Challenge...'}
            </h2>
          </div>
          {challenge && (
            <div className="challenge-info">
              <div className="target-score-container">
                <div className="target-score-label">Target Score:</div>
                <div className="target-score-value">{challenge.target_score}</div>
              </div>
              <div className="score-gauge-container">
                <div className="score-gauge-background">
                  <div
                    className="score-gauge-fill"
                    style={{
                      width: `${Math.min(100, (currentScore / challenge.target_score) * 100)}%`,
                      backgroundColor: currentScore >= challenge.target_score ? 'var(--secondary-color)' : 'var(--primary-color)'
                    }}
                  ></div>
                </div>
                <div className="current-score-value">Current Score: {currentScore}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Success Message */}
        {showSuccess && (
          <div className="success-message">
            <h3>Challenge Completed!</h3>
            <p>{successMessage}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {/* Game Layout */}
        <div className="game-area">
          {/* Team Area */}
          <div className="hand-area">
            <h3 className="area-title">Your Team</h3>
            <div className="team-container">
              {monstersInHand.length === 0 ? (
                <div className="empty-team-message">
                  Tap on monsters below to add them to your team (max 5)
                </div>
              ) : (
                <div className="hand-monsters">
                  {monstersInHand.map((monster) => (
                    <HandMonsterCard
                      key={monster.id}
                      monster={monster}
                      onRemove={removeFromHand}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Synergy Bonuses */}
            {synergies.length > 0 && (
              <div className="synergy-container">
                <h3 className="synergy-title">Team Synergies</h3>
                <div className="synergy-list">
                  {synergies.map((synergy, index) => (
                    <div key={index} className="synergy-item">
                      <div className="synergy-name">{synergy.name}</div>
                      <div className="synergy-description">{synergy.description}</div>
                      <div className="synergy-bonus">+{synergy.bonus} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="game-button submit-button"
                onClick={submitChallenge}
                disabled={monstersInHand.length === 0}
              >
                Submit Challenge
              </button>
              <button
                className="game-button reset-button"
                onClick={resetTeam}
                disabled={monstersInHand.length === 0}
              >
                Reset Team
              </button>
            </div>
          </div>
          
          {/* Monster Collection */}
          <div className="collection-area">
            <h3 className="area-title">Your Monsters</h3>
            {loading ? (
              <div className="loading-message">Loading your monsters...</div>
            ) : (
             <div className="collection-grid">
               {monsters.map((monster) => (
                 <SelectableMonsterCard
                   key={monster.id}
                   monster={monster}
                   isSelected={false}
                   isInHand={monstersInHand.some(m => m.id === monster.id)}
                   onToggleSelect={toggleMonsterSelection}
                 />
               ))}
             </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonsterChallengePage;
