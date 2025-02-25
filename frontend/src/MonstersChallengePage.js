import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './MonstersChallengePage.css';

const BACKEND = "http://localhost:8000";

// Monster images based on type - matching the HomePage icons
const monsterImages = {
  'F&D': '/images/Food_Monster.png',
  'H': '/images/Nature_Monster.png',
  'WB': '/images/Gym_Monster.png',
  'W': '/images/Nature_Monster.png',
  'WA': '/images/Electricity_Monster.png',
  'N&B': '/images/Nature_Monster.png',
  'T': '/images/Gym_Monster.png',
  // Default image if type doesn't match
  'default': '/images/Nature_Monster.png'
};

// Get CSS class based on monster rarity
const getRarityClass = (rarity) => {
  switch(rarity) {
    case 'C': return 'rarity-common';
    case 'R': return 'rarity-rare';
    case 'E': return 'rarity-epic';
    case 'L': return 'rarity-legendary';
    default: return 'rarity-common';
  }
};

// Get human-readable type label
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

// Calculate monster base score based on rarity and level
const calculateMonsterBaseScore = (monster) => {
  const rarityMultiplier = {
    'C': 1,
    'R': 2,
    'E': 3,
    'L': 5
  };
  
  return (monster.level * rarityMultiplier[monster.rarity]) * 10;
};

// Draggable Monster Card Component
const DraggableMonsterCard = ({ monster, index, inHand }) => {
  const monsterImage = monsterImages[monster.type] || monsterImages.default;
  const baseScore = calculateMonsterBaseScore(monster);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'monster',
    item: { monster, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    canDrag: () => !inHand, // Prevent dragging if already in hand
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult && dropResult.dropped) {
        // Successfully dropped
      }
    }
  }));
  
  return (
    <div
      ref={drag}
      className={`monster-card ${isDragging ? 'is-dragging' : ''} ${inHand ? 'in-hand' : ''}`}
    >
      <div className={`monster-image-container ${getRarityClass(monster.rarity)}`}>
        <img
          src={monsterImage}
          alt={monster.name}
          className="monster-image"
          onError={(e) => {
            e.target.src = "/api/placeholder/400/400";
          }}
        />
        <div className="rarity-badge">
          {monster.rarity === 'C' ? 'Common' :
           monster.rarity === 'R' ? 'Rare' :
           monster.rarity === 'E' ? 'Epic' :
           'Legendary'}
        </div>
        <div className="level-badge">Lvl {monster.level}</div>
        <div className="score-badge">{baseScore} pts</div>
      </div>
      <div className="monster-info">
        <h3 className="monster-name">{monster.name}</h3>
        <p className="monster-type">{getTypeLabel(monster.type)}</p>
      </div>
    </div>
  );
};

// Monster in Hand Component
const HandMonsterCard = ({ monster, index, removeFromHand }) => {
  const monsterImage = monsterImages[monster.type] || monsterImages.default;
  const baseScore = calculateMonsterBaseScore(monster);
  
  return (
    <div className="hand-monster-card">
      <div className={`monster-image-container ${getRarityClass(monster.rarity)}`}>
        <img
          src={monsterImage}
          alt={monster.name}
          className="monster-image"
          onError={(e) => {
            e.target.src = "/api/placeholder/400/400";
          }}
        />
        <button 
          className="remove-button" 
          onClick={() => removeFromHand(index)}
        >
          ×
        </button>
        <div className="score-badge">{baseScore} pts</div>
      </div>
      <div className="monster-name-small">{monster.name}</div>
    </div>
  );
};

// Drop Target for Monster Hand
const MonsterHandDropZone = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'monster',
    drop: (item) => {
      onDrop(item.monster);
      return { dropped: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));
  
  return (
    <div
      ref={drop}
      className={`hand-drop-zone ${isOver ? 'drop-zone-active' : ''}`}
    >
      {children}
    </div>
  );
};

// Calculate synergy bonuses based on monster combinations
const calculateSynergies = (monstersInHand) => {
  const synergies = [];
  const typeCount = {};
  
  // Count types
  monstersInHand.forEach(monster => {
    typeCount[monster.type] = (typeCount[monster.type] || 0) + 1;
  });
  
  // Check for type synergies (3 of same type)
  Object.entries(typeCount).forEach(([type, count]) => {
    if (count >= 3) {
      synergies.push({
        name: `${getTypeLabel(type)} Trio`,
        description: `3 or more ${getTypeLabel(type)} monsters`,
        bonus: 250
      });
    }
  });
  
  // Check for rarity synergies
  const hasCommon = monstersInHand.some(m => m.rarity === 'C');
  const hasRare = monstersInHand.some(m => m.rarity === 'R');
  const hasEpic = monstersInHand.some(m => m.rarity === 'E');
  const hasLegendary = monstersInHand.some(m => m.rarity === 'L');
  
  if (hasCommon && hasRare && hasEpic) {
    synergies.push({
      name: 'Rarity Ladder',
      description: 'Common + Rare + Epic monsters',
      bonus: 200
    });
  }
  
  if (hasLegendary && monstersInHand.length >= 3) {
    synergies.push({
      name: 'Legendary Leadership',
      description: 'Legendary monster with at least 2 followers',
      bonus: 300
    });
  }
  
  // Check for level synergies
  const highLevelCount = monstersInHand.filter(m => m.level >= 5).length;
  if (highLevelCount >= 2) {
    synergies.push({
      name: 'Experienced Team',
      description: '2 or more monsters level 5+',
      bonus: highLevelCount * 50
    });
  }
  
  return synergies;
};

// Main Game Component
const MonsterChallengePage = () => {
  const [monsters, setMonsters] = useState([]);
  const [monstersInHand, setMonstersInHand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [synergies, setSynergies] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Mock data for development
  const sampleMonsters = [
    { id: 1, name: "EcoDragon", type: "N&B", rarity: "L", level: 3 },
    { id: 2, name: "WaterSprite", type: "W", rarity: "R", level: 4 },
    { id: 3, name: "FoodGuardian", type: "F&D", rarity: "C", level: 2 },
    { id: 4, name: "TreeSpirit", type: "N&B", rarity: "E", level: 5 },
    { id: 5, name: "WasteWizard", type: "WA", rarity: "R", level: 4 },
    { id: 6, name: "HealthHero", type: "H", rarity: "C", level: 3 },
    { id: 7, name: "TransportTitan", type: "T", rarity: "E", level: 6 },
    { id: 8, name: "WellbeingWarrior", type: "WB", rarity: "R", level: 5 },
    { id: 9, name: "NatureNymph", type: "N&B", rarity: "C", level: 2 },
    { id: 10, name: "FoodFairy", type: "F&D", rarity: "R", level: 7 },
    { id: 11, name: "WaterWizard", type: "W", rarity: "E", level: 8 },
    { id: 12, name: "RecycleRanger", type: "WA", rarity: "C", level: 4 },
  ];
  
  const sampleChallenge = {
    id: 1,
    name: "Monsters Challenge",
    target_score: 350
  };
  
  // Fetch monsters and active challenge
  const fetchData = async () => {
    try {
      // When endpoints are ready, replace with actual API calls
      // const response = await fetch(`${BACKEND}/api/player-monsters/`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      //   }
      // });
      // const data = await response.json();
      // setMonsters(data);
      
      // const challengeResponse = await fetch(`${BACKEND}/api/game-challenge/active/`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      //   }
      // });
      // const challengeData = await challengeResponse.json();
      // setChallenge(challengeData);
      
      // For development, use sample data
      setMonsters(sampleMonsters);
      setChallenge(sampleChallenge);
      setLoading(false);
    } catch (err) {
      setError('Failed to load game data. Please try again later.');
      setLoading(false);
    }
  };
  
  // Calculate current score whenever hand changes
  useEffect(() => {
    if (monstersInHand.length === 0) {
      setCurrentScore(0);
      setSynergies([]);
      return;
    }
    
    // Calculate base score from monsters
    const baseScore = monstersInHand.reduce((total, monster) => {
      return total + calculateMonsterBaseScore(monster);
    }, 0);
    
    // Calculate synergy bonuses
    const currentSynergies = calculateSynergies(monstersInHand);
    const synergyBonus = currentSynergies.reduce((total, synergy) => {
      return total + synergy.bonus;
    }, 0);
    
    setSynergies(currentSynergies);
    setCurrentScore(baseScore + synergyBonus);
  }, [monstersInHand]);
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Add monster to hand
  const addMonsterToHand = (monster) => {
    // Prevent duplicates in hand
    if (monstersInHand.some(m => m.id === monster.id)) {
      return;
    }
    
    // Limit hand size to 5 monsters
    if (monstersInHand.length >= 5) {
      setError('Your hand is full! Remove a monster first.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setMonstersInHand([...monstersInHand, monster]);
  };
  
  // Remove monster from hand
  const removeFromHand = (index) => {
    const newHand = [...monstersInHand];
    newHand.splice(index, 1);
    setMonstersInHand(newHand);
  };
  
  // Submit challenge attempt
  const submitChallenge = async () => {
    if (monstersInHand.length === 0) {
      setError('You need to add monsters to your hand first!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      // When endpoint is ready, replace with actual API call
      // const response = await fetch(`${BACKEND}/api/game/submit-challenge/`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      //   },
      //   body: JSON.stringify({
      //     challenge_id: challenge.id,
      //     monster_ids: monstersInHand.map(m => m.id)
      //   })
      // });
      // const result = await response.json();
      
      // For development, simulate result
      const success = currentScore >= (challenge?.target_score || 0);
      
      if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setMonstersInHand([]);
        }, 3000);
      } else {
        setError('Not enough score to complete the challenge. Try a different combination!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to submit challenge. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setMonstersInHand([]);
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
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
              <p>Your monsters gained experience!</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {/* Monster Hand Area */}
          <div className="game-area">
            <div className="hand-area">
              <h3 className="area-title">Your Hand</h3>
              <MonsterHandDropZone onDrop={addMonsterToHand}>
                {monstersInHand.length === 0 ? (
                  <div className="empty-hand-message">
                    Drag monsters here to build your team (max 5)
                  </div>
                ) : (
                  <div className="hand-monsters">
                    {monstersInHand.map((monster, index) => (
                      <HandMonsterCard 
                        key={monster.id} 
                        monster={monster} 
                        index={index}
                        removeFromHand={removeFromHand}
                      />
                    ))}
                  </div>
                )}
              </MonsterHandDropZone>
              
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
                  onClick={resetGame}
                  disabled={monstersInHand.length === 0}
                >
                  Reset Hand
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
                 {monsters.map((monster, index) => (
                   <DraggableMonsterCard
                     key={monster.id}
                     monster={monster}
                     index={index}
                     inHand={monstersInHand.some(m => m.id === monster.id)}
                   />
                 ))}
               </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MonsterChallengePage;
