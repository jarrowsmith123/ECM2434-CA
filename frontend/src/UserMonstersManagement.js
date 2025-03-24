import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AdminPage.css';
import config from './config';

const BACKEND = config.API_URL;

const UserMonstersManagement = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userMonsters, setUserMonsters] = useState([]);
  const [availableMonsters, setAvailableMonsters] = useState([]);
  const [selectedMonster, setSelectedMonster] = useState('');
  const [monsterLevel, setMonsterLevel] = useState(1);
  const [editingMonster, setEditingMonster] = useState(null);
  const [newLevel, setNewLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAdminStatus();
    fetchUserData();
    fetchUserMonsters();
    fetchAvailableMonsters();
  }, [userId]);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${BACKEND}/api/user/check-admin/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.is_admin) {
        // If not admin, redirect to home
        navigate('/home');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      navigate('/home');
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/users/${userId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError('Error loading user data: ' + err.message);
    }
  };

  const fetchUserMonsters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/users/${userId}/monsters/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user monsters');
      }

      const monstersData = await response.json();
      setUserMonsters(monstersData);
      setLoading(false);
    } catch (err) {
      setError('Error loading user monsters: ' + err.message);
      setLoading(false);
    }
  };

  const fetchAvailableMonsters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/monsters/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available monsters');
      }

      const monstersData = await response.json();
      setAvailableMonsters(monstersData);
    } catch (err) {
      setError('Error loading available monsters: ' + err.message);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const addMonsterToUser = async () => {
    if (!selectedMonster) {
      setError('Please select a monster to add');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/users/${userId}/add-monster/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monster_id: selectedMonster,
          level: monsterLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add monster');
      }

      const newMonster = await response.json();
      
      // Update the user monsters list
      setUserMonsters([...userMonsters, newMonster]);
      
      // Reset form
      setSelectedMonster('');
      setMonsterLevel(1);
      
      setSuccessMessage('Monster added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error adding monster: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateMonsterLevel = async () => {
    if (!editingMonster) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/player-monsters/${editingMonster.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: newLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update monster level');
      }

      const updatedMonster = await response.json();
      
      // Update the user monsters list
      setUserMonsters(userMonsters.map(monster => 
        monster.id === updatedMonster.id ? updatedMonster : monster
      ));
      
      // Reset form
      setEditingMonster(null);
      setNewLevel(1);
      
      setSuccessMessage('Monster level updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error updating monster level: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteMonster = async (monsterId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/player-monsters/${monsterId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete monster');
      }
      
      // Update the user monsters list
      setUserMonsters(userMonsters.filter(monster => monster.id !== monsterId));
      
      setSuccessMessage('Monster deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error deleting monster: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const getMonsterTypeLabel = (type) => {
    const types = {
      'F&D': 'Food and Drink',
      'HWB': 'Health and Wellbeing',
      'W': 'Water',
      'WA': 'Waste',
      'N&B': 'Nature and Biodiversity',
      'E': 'Energy',
    };
    return types[type] || type;
  };

  const getMonsterRarityLabel = (rarity) => {
    const rarities = {
      'C': 'Common',
      'R': 'Rare',
      'E': 'Epic',
      'L': 'Legendary',
    };
    return rarities[rarity] || rarity;
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-content">
          <div className="admin-header">
            <h2 className="admin-title">Loading User Monsters...</h2>
            <button className="back-button" onClick={handleBack}>Back to Admin</button>
          </div>
          <div className="loading-message">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="admin-header">
          <h2 className="admin-title">
            {user ? `${user.username}'s Monsters` : 'User Monsters'}
          </h2>
          <button className="back-button" onClick={handleBack}>Back to Admin</button>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {/* Add Monster Form */}
        <div className="admin-form-section">
          <h3 className="section-title">Add Monster to User</h3>
          <div className="admin-form">
            <div className="form-group">
              <label>Monster:</label>
              <select 
                value={selectedMonster} 
                onChange={(e) => setSelectedMonster(e.target.value)}
              >
                <option value="">Select a monster</option>
                {availableMonsters.map(monster => (
                  <option key={monster.id} value={monster.id}>
                    {monster.name} ({getMonsterRarityLabel(monster.rarity)} {getMonsterTypeLabel(monster.type)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Level:</label>
              <input 
                type="number" 
                min="1" 
                max="99" 
                value={monsterLevel} 
                onChange={(e) => setMonsterLevel(parseInt(e.target.value))}
              />
            </div>
            <button className="admin-btn create-btn" onClick={addMonsterToUser}>Add Monster</button>
          </div>
        </div>
        
        {/* User Monsters List */}
        <div className="admin-data-container">
          <h3 className="section-title">Current Monsters</h3>
          {userMonsters.length === 0 ? (
            <div className="empty-state">User has no monsters</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Monster</th>
                    <th>Type</th>
                    <th>Rarity</th>
                    <th>Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userMonsters.map(playerMonster => (
                    <tr key={playerMonster.id}>
                      <td>{playerMonster.id}</td>
                      <td>{playerMonster.monster.name}</td>
                      <td>{getMonsterTypeLabel(playerMonster.monster.type)}</td>
                      <td>
                        <span className={`rarity-badge rarity-${playerMonster.monster.rarity.toLowerCase()}`}>
                          {getMonsterRarityLabel(playerMonster.monster.rarity)}
                        </span>
                      </td>
                      <td>
                        {editingMonster && editingMonster.id === playerMonster.id ? (
                          <div className="inline-edit">
                            <input 
                              type="number" 
                              min="1" 
                              max="99" 
                              value={newLevel} 
                              onChange={(e) => setNewLevel(parseInt(e.target.value))}
                            />
                            <button className="small-btn save-btn" onClick={updateMonsterLevel}>Save</button>
                            <button 
                              className="small-btn cancel-btn" 
                              onClick={() => setEditingMonster(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span>{playerMonster.level}</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {editingMonster && editingMonster.id === playerMonster.id ? (
                            null
                          ) : (
                            <>
                              <button 
                                className="admin-action-btn edit-btn"
                                onClick={() => {
                                  setEditingMonster(playerMonster);
                                  setNewLevel(playerMonster.level);
                                }}
                              >
                                Edit Level
                              </button>
                              <button 
                                className="admin-action-btn remove-btn"
                                onClick={() => deleteMonster(playerMonster.id)}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMonstersManagement;
