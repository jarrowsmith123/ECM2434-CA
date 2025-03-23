import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MonstersPage.css';

const BACKEND = "http://localhost:8000";

// Monster images based on type
const monsterImages = {
  'F&D': { C: ['/images/food1.png'],
    R: ['/images/food2.png'],
    E: ['/images/food3.png'],
    L: ['/images/food4.png']
  },

  'H': { C: ['/images/health1.png'],
    R: ['/images/health2.png'],
    E: ['/images/health3.png'],
    L: ['/images/health.png']
  },

  'WB': { C: ['/images/wellbeing1.png'],
    R: ['/images/wellbeing2.png'],
    E: ['/images/wellbeing3.png'],
    L: ['/images/wellbeing4.png']
  },

  'W': { C: ['/images/water1.png'],
    R: ['/images/water2.png'],
    E: ['/images/water3.png'],
    L: ['/images/water4.png']
  },

  'WA': { C: ['/images/waste1.png'],
    R: ['/images/waste2.png'],
    E: ['/images/waste3.png'],
    L: ['/images/waste4.png']
  },

  'N&B': { C: ['/images/nature1.png'],
    R: ['/images/nature2.png'],
    E: ['/images/nature3.png'],
    L: ['/images/nature4.png']
  },

  'T': { C: ['/images/transport1.png'],
    R: ['/images/transport2.png'],
    E: ['/images/transport3.png'],
    L: ['/images/transport4.png'],
  },
  // Default image if type doesn't match
  'default': '/images/nature1.png'
};

const getRarityClass = (rarity) => {
  switch(rarity) {
    case 'C': return 'rarity-common';
    case 'R': return 'rarity-rare';
    case 'E': return 'rarity-epic';
    case 'L': return 'rarity-legendary';
    default: return 'rarity-common';
  }
};

const getTypeLabel = (type) => {
  const types = {
    'F&D': 'Food and Drink',
    'HWB': 'Health and Wellbeing',
    'W': 'Water',
    'WA': 'Waste',
    'N&B': 'Nature and Biodiversity',
    'T': 'Transport'
  };
  return types[type] || type;
};

const MonsterCard = ({ monster }) => {
  // Get the appropriate monster image based on type and rarity
  const getMonsterImage = () => {
    const typeImages = monsterImages[monster.monster.type];
    if (typeImages && typeImages[monster.monster.rarity]) {
      // If we have images for this type and rarity
      const images = typeImages[monster.monster.rarity];
      return images[0]; // Just use the first one for now
    }
    return monsterImages.default;
  };
  
  return (
    <div className="monster-card">
      <div className={`monster-image-container ${getRarityClass(monster.monster.rarity)}`}>
        <img
          src={getMonsterImage()}
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
      </div>
      <div className="monster-info">
        <h3 className="monster-name">{monster.monster.name}</h3>
        <p className="monster-type">{getTypeLabel(monster.monster.type)}</p>
      </div>
    </div>
  );
};

const MonstersPage = () => {
  const navigate = useNavigate();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add levels
  const fetchMonsters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/monsters/get-player-monsters/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch monsters');
      }
      
      const monstersData = await response.json();
      setMonsters(monstersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching monsters:', error);
      setError('Failed to load monsters. Please try again later.');
      setLoading(false);
    }
  };
    
  const playGameButtonPressHandler = () => {
    navigate("/monsters_challenge");
  };

  const handleBackClick = () => {
    navigate('/home');
  };

  useEffect(() => {
    fetchMonsters();
  }, []);

  return (
    <div className="monsters-container">
      <button className="back-button" onClick={handleBackClick}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
      <div className="monsters-content">
        <div className="monsters-card">
          <div className="monsters-header">
            <h2 className="monsters-title">Monster Collection</h2>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {loading ? (
            <div className="loading-message">Loading your monsters...</div>
          ) : (
            <div className="monsters-grid">
              {monsters.map(monster => (
                <MonsterCard key={monster.id} monster={monster} />
              ))}
            </div>
          )}
        </div>
          <button
            className="game-button"
            onClick={playGameButtonPressHandler}
          >
            Play Game
        </button>
      </div>
    </div>
  );
};

export default MonstersPage;
