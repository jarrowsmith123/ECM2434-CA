import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import config from './config';

const BACKEND = config.API_URL;

const CreateMonster = () => {
  const navigate = useNavigate();
  const [monsterName, setMonsterName] = useState('');
  const [monsterType, setMonsterType] = useState('');
  const [monsterRarity, setMonsterRarity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

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

  const handleBack = () => {
    navigate('/admin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!monsterName || !monsterType || !monsterRarity) {
      setError('Please fill in all fields');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/monsters/create-monster/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: monsterName,
          type: monsterType,
          rarity: monsterRarity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create monster');
      }

      const data = await response.json();
      
      setSuccessMessage(`Monster "${data.name}" created successfully!`);
      
      // Reset form
      setMonsterName('');
      setMonsterType('');
      setMonsterRarity('');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error creating monster: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="admin-header">
          <h2 className="admin-title">Create New Monster</h2>
          <button className="back-button" onClick={handleBack}>Back to Admin</button>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {/* Create Monster Form */}
        <div className="admin-form-section">
          <form onSubmit={handleSubmit}>
            <div className="admin-form">
              <div className="form-group">
                <label htmlFor="monsterName">Monster Name:</label>
                <input
                  id="monsterName"
                  type="text"
                  value={monsterName}
                  onChange={(e) => setMonsterName(e.target.value)}
                  placeholder="Enter monster name"
                  maxLength={20}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="monsterType">Type:</label>
                <select
                  id="monsterType"
                  value={monsterType}
                  onChange={(e) => setMonsterType(e.target.value)}
                >
                  <option value="">Select monster type</option>
                  <option value="F&D">Food and Drink</option>
                  <option value="HWB">Health and Wellbeing</option>
                  <option value="W">Water</option>
                  <option value="WA">Waste</option>
                  <option value="N&B">Nature and Biodiversity</option>
                  <option value="E">Energy</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="monsterRarity">Rarity:</label>
                <select
                  id="monsterRarity"
                  value={monsterRarity}
                  onChange={(e) => setMonsterRarity(e.target.value)}
                >
                  <option value="">Select monster rarity</option>
                  <option value="C">Common</option>
                  <option value="R">Rare</option>
                  <option value="E">Epic</option>
                  <option value="L">Legendary</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="admin-btn create-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Monster'}
                </button>
                <button
                  type="button"
                  className="admin-btn cancel-btn"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMonster;
