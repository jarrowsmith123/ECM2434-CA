import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MonstersPage.css';

const BACKEND = "http://localhost:8000";

// Monster images based on type - matching the HomePage icons
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
    'H': 'Health',
    'WB': 'Wellbeing',
    'W': 'Water',
    'WA': 'Waste',
    'N&B': 'Nature and Biodiversity',
    'T': 'Transport'
  };
  return types[type] || type;
};

const MonsterCard = ({ monster }) => {
  // Get the appropriate monster image
  const monsterImage = monsterImages[monster.type] || monsterImages.default;
  
  return (
    <div className="monster-card">
      <div className={`monster-image-container ${getRarityClass(monster.rarity)}`}>
        <img
          src={monsterImage}
          alt={monster.name}
          className="monster-image"
          onError={(e) => {
            // Fallback to placeholder if image doesn't load
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
      </div>
      <div className="monster-info">
        <h3 className="monster-name">{monster.name}</h3>
        <p className="monster-type">{getTypeLabel(monster.type)}</p>
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
    // TODO: Implement when endpoint is written
    
      // These are just completely made up so that i can test what it looks like
      
      /*const sampleMonsters = [
            { id: 1, name: "EcoDragon", type: "N&B", rarity: "L", level: 1 },
            { id: 2, name: "WaterSprite", type: "W", rarity: "R", level: 4 },
            { id: 3, name: "FoodGuardian", type: "F&D", rarity: "C", level: 2 },
            { id: 4, name: "TreeSpirit", type: "N&B", rarity: "E", level: 3 },
            { id: 5, name: "WasteWizard", type: "WA", rarity: "R", level: 8 },
            { id: 6, name: "HealthHero", type: "H", rarity: "C", level: 7 },
          ];
          setMonsters(sampleMonsters);
          setLoading(false);*/
  };
    
    const playGameButtonPressHandler = () => {
        navigate("/monsters_challenge");
    };

  useEffect(() => {
    fetchMonsters();
  }, []);

  return (
    <div className="monsters-container">
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
