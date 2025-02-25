import React, { useState, useEffect } from 'react';
import './ChallengesPage.css';

const BACKEND = "http://localhost:8000";

const ChallengeCard = ({ challenge, onClaimLoot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`challenge-card ${challenge.isCompleted ? 'completed' : ''}`}>
      <div className="challenge-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="challenge-location">
          <h3 className="location-name">{challenge.locationName}</h3>
          <span className="location-type">{challenge.locationType}</span>
        </div>
        <div className="challenge-status">
          {challenge.isCompleted ? (
            <span className="status-badge completed">Completed</span>
          ) : (
            <span className="status-badge pending">In Progress</span>
          )}
        </div>
      </div>

      <div className={`challenge-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="challenge-details">
          <h4 className="challenge-title">{challenge.title}</h4>
          <p className="challenge-description">{challenge.description}</p>
          
          <div className="challenge-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${challenge.progress}%` }}
              />
            </div>
            <span className="progress-text">{challenge.progress}% Complete</span>
          </div>

          <div className="challenge-rewards">
            <h5>Rewards:</h5>
            <ul>
              {challenge.rewards.map((reward, index) => (
                <li key={index}>{reward}</li>
              ))}
            </ul>
          </div>
        </div>

        {challenge.lootBoxAvailable && (
          <div className="loot-box-section">
            <div className="loot-box-container">
              <div className={`loot-box ${challenge.canClaimLoot ? 'available' : 'locked'}`}>
                <img 
                  src="/api/placeholder/100/100"
                  alt="Loot Box"
                  className="loot-box-image"
                />
              </div>
              <button
                className="claim-button"
                disabled={!challenge.canClaimLoot}
                onClick={() => onClaimLoot(challenge.id)}
              >
                {challenge.canClaimLoot ? 'Claim Loot Box' : 'Not Available'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchChallenges = async () => {
    try {
      // TODO: Replace with actual API call
      const mockChallenges = [
        {
          id: 1,
          locationName: "Green Park",
          locationType: "Nature and Biodiversity",
          title: "Park Explorer",
          description: "Visit 3 different areas within Green Park",
          progress: 66,
          isCompleted: false,
          lootBoxAvailable: true,
          canClaimLoot: true,
          rewards: ["Nature Spirit Monster", "50 XP"]
        },
        // Add more mock challenges as needed
      ];
      
      setChallenges(mockChallenges);
    } catch (err) {
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimLoot = async (challengeId) => {
    try {
      // TODO: Implement loot box claiming logic
      console.log(`Claiming loot for challenge ${challengeId}`);
    } catch (err) {
      setError('Failed to claim loot box');
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const filteredChallenges = challenges.filter(challenge => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return challenge.isCompleted;
    if (activeFilter === 'inProgress') return !challenge.isCompleted;
    return true;
  });

  return (
    <div className="challenges-container">
      <div className="challenges-content">
        <div className="challenges-card">
          <div className="challenges-header">
            <h2 className="challenges-title">Location Challenges</h2>
          </div>

          <div className="filter-section">
            <button 
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-button ${activeFilter === 'inProgress' ? 'active' : ''}`}
              onClick={() => setActiveFilter('inProgress')}
            >
              In Progress
            </button>
            <button 
              className={`filter-button ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </button>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {loading ? (
            <div className="loading-message">Loading challenges...</div>
          ) : (
            <div className="challenges-grid">
              {filteredChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge}
                  onClaimLoot={handleClaimLoot}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengesPage;
