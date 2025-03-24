import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LeaderboardPage.css';
import config from './config';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${config.API_URL}/api/user/leaderboard/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();
        setLeaderboardData(data.top_users);
        setCurrentUserRank(data.current_user_rank);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [navigate]);

  const handleBackClick = () => {
    navigate('/home');
  };

  const handleProfileClick = (username) => {
    if (username === leaderboardData.find(user => user.is_current_user)?.username) {
      navigate('/profile');
    } else {
      navigate(`/profile/${username}`);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-container">
          <h1>Leaderboard</h1>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-container">
          <h1>Leaderboard</h1>
          <div className="error-message">{error}</div>
          <button className="back-button" onClick={handleBackClick}>Back to Home</button>
        </div>
      </div>
    );
  }

  // Sort top 5 users at the beginning, then current user if not in top 5
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    // First sort by rank
    if (a.rank < 6 && b.rank >= 6) return -1;
    if (a.rank >= 6 && b.rank < 6) return 1;
    // Then by rank within each group
    return a.rank - b.rank;
  });

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>Monster Master Leaderboard</h1>
        
        <div className="leaderboard-list">
          <div className="leaderboard-header">
            <span className="rank-header">Rank</span>
            <span className="username-header">Player</span>
            <span className="wins-header">Wins</span>
          </div>
          
          {sortedLeaderboard.map((user, index) => (
            <div 
              key={index} 
              className={`leaderboard-item ${user.is_current_user ? 'current-user' : ''} ${user.rank <= 3 ? `top-${user.rank}` : ''}`}
              onClick={() => handleProfileClick(user.username)}
            >
              <div className="rank-badge">
                {user.rank <= 3 ? (
                  <span className={`trophy trophy-${user.rank}`}>🏆</span>
                ) : (
                  <span className="rank-number">{user.rank}</span>
                )}
              </div>
              <span className="username">{user.username}</span>
              <span className="win-count">{user.game_won_count}</span>
            </div>
          ))}
        </div>
        
        <div className="leaderboard-footer">
          <button className="back-button" onClick={handleBackClick}>Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 