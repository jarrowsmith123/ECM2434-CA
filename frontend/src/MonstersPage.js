import React, { useEffect, useState } from 'react';
import './Colours.css';
import './MonstersPage.css';

const BACKEND = "http://localhost:8000";

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

const MonsterCard = ({ monster }) => (
  <div className="monster-card">
    <div className={`monster-image-container ${getRarityClass(monster.rarity)}`}>
      <img 
        src="/api/placeholder/400/400"
        alt={monster.name}
        className="monster-image"
      />
      <div className="rarity-badge">
        {monster.rarity === 'C' ? 'Common' :
         monster.rarity === 'R' ? 'Rare' :
         monster.rarity === 'E' ? 'Epic' :
         'Legendary'}
      </div>
    </div>
    <div className="monster-info">
      <h3 className="monster-name">{monster.name}</h3>
      <p className="monster-type">{getTypeLabel(monster.type)}</p>
    </div>
  </div>
);

const MonstersPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMonsters = async () => {
    // TODO: Implement when endpoint is written
    
    setLoading(false);
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
      </div>
    </div>
  );
};

export default MonstersPage;
