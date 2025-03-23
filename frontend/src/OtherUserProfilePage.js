import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './UserProfilePage.css';

// Helper function to get color based on monster type
const getMonsterColor = (type) => {
  const typeColors = {
    'N&B': '#4ade80', // Nature & Biodiversity - Green
    'HWB': '#60a5fa', // Health & Wellbeing - Blue
    'F&D': '#f97316', // Food & Diet - Orange
    'ECO': '#a78bfa', // Economic - Purple
    'SOC': '#f43f5e', // Social - Pink
    'ENV': '#10b981', // Environmental - Teal
    'default': '#6b7280'  // Default - Gray
  };
  
  return typeColors[type] || typeColors.default;
};

// Helper function to convert rarity code to full text
const getRarityText = (rarityCode) => {
  const rarityMap = {
    'C': 'Common',
    'U': 'Uncommon',
    'R': 'Rare',
    'E': 'Epic',
    'L': 'Legendary'
  };
  
  return rarityMap[rarityCode] || rarityCode;
};

// Monster images based on type
const monsterImages = {
  'F&D': {
    C: ['/images/food1.png'],
    R: ['/images/food2.png'],
    E: ['/images/food3.png'],
    L: ['/images/food4.png']
  },
  'H': {
    C: ['/images/health1.png'],
    R: ['/images/health2.png'],
    E: ['/images/health3.png'],
    L: ['/images/health.png']
  },
  'WB': {
    C: ['/images/wellbeing1.png'],
    R: ['/images/wellbeing2.png'],
    E: ['/images/wellbeing3.png'],
    L: ['/images/wellbeing4.png']
  },
  'W': {
    C: ['/images/water1.png'],
    R: ['/images/water2.png'],
    E: ['/images/water3.png'],
    L: ['/images/water4.png']
  },
  'WA': {
    C: ['/images/waste1.png'],
    R: ['/images/waste2.png'],
    E: ['/images/waste3.png'],
    L: ['/images/waste4.png']
  },
  'N&B': {
    C: ['/images/nature1.png'],
    R: ['/images/nature2.png'],
    E: ['/images/nature3.png'],
    L: ['/images/nature4.png']
  },
  'T': {
    C: ['/images/transport1.png'],
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

const BACKEND = "http://localhost:8000";

const OtherUserProfilePage = () => {
  const { username } = useParams(); // Get the username from URL parameters
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const profileUrl = `${BACKEND}/api/user/profile/${username}/`

      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return;
        }
        if (response.status === 403) {
          setError('You must be friends with this user to view their profile.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUserData(data);
      
      // Get monsters from the response
      if (data.monsters) {
        setMonsters(data.monsters);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error loading profile: ' + err.message);
      setLoading(false);
    }
  };

  // Get the appropriate monster image based on type and rarity
  const getMonsterImage = (monster) => {
    const typeImages = monsterImages[monster.type];
    if (typeImages && typeImages[monster.rarity]) {
      // If we have images for this type and rarity
      const images = typeImages[monster.rarity];
      return images[0]; // Just use the first one for now
    }
    return monsterImages.default;
  };

  const handleBackClick = () => {
    navigate(-1); // Navigate back to previous page
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <h2 className="profile-title">Loading profile...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <h2 className="profile-title">Error</h2>
            </div>
            <div className="error-message">{error}</div>
            <button
              className="action-button"
              onClick={() => navigate('/friends')}
            >
              Back to Friends
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button className="back-button" onClick={handleBackClick}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <h2 className="profile-title">
              {isSelf ? 'My Profile' : `${username}'s Profile`}
            </h2>
          </div>
          
          {userData && (
            <div className="profile-view">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {username ? username.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              
              <div className="profile-details">
                <div className="detail-group">
                  <label className="detail-label">Username</label>
                  <p className="detail-value">{username}</p>
                </div>
                
                <div className="detail-group">
                  <label className="detail-label">Email</label>
                  <p className="detail-value">{userData?.email || 'Not visible'}</p>
                </div>
                
                <div className="detail-group">
                  <label className="detail-label">Account Created</label>
                  <p className="detail-value">
                    {userData?.profile?.created_at ?
                      new Date(userData.profile.created_at).toLocaleDateString() :
                      'Not available'}
                  </p>
                </div>
                
                <div className="detail-group">
                  <label className="detail-label">Games Won</label>
                  <p className="detail-value">{userData?.profile?.game_won_count || 0}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="monster-section">
            <h3 className="section-title">
              {isSelf ? 'My Monsters' : `${username}'s Monsters`}
            </h3>
            
            {monsters.length === 0 ? (
              <div className="empty-state">
                <p>{isSelf
                  ? "You don't have any monsters yet."
                  : `${username} doesn't have any monsters yet.`}
                </p>
                {isSelf && (
                  <button
                    className="action-button"
                    onClick={() => navigate('/monsters_challenge')}
                  >
                    Get Monsters
                  </button>
                )}
              </div>
            ) : (
              <div className="monsters-grid">
                {monsters.map((playerMonster) => {
                  // Access the monster data from the nested structure
                  const monster = playerMonster.monster;
                  
                  return (
                    <div key={playerMonster.id} className="monster-card">
                      <div className={`monster-image-container ${getRarityClass(monster.rarity)}`}>
                        <img
                          src={getMonsterImage(monster)}
                          alt={monster.name}
                          className="monster-image"
                        />
                        <div className="rarity-badge">
                          {getRarityText(monster.rarity)}
                        </div>
                        <div className="level-badge">Lvl {playerMonster.level}</div>
                      </div>
                      <div className="monster-info">
                        <h3 className="monster-name">{monster.name}</h3>
                        <p className="monster-type">{getTypeLabel(monster.type)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="profile-actions">
            <button
              className="action-button secondary"
              onClick={() => navigate('/friends')}
            >
              Back to Friends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUserProfilePage;
