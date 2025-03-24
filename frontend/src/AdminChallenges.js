import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import config from './config';

const BACKEND = config.API_URL;

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for the form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    target_score: 0
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) return;

      const response = await fetch(`${BACKEND}/api/user/admin/challenges/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading challenges: ' + err.message);
      setLoading(false);
    }
  };

  const handleCreateChallenge = () => {
    setFormData({
      id: null,
      name: '',
      target_score: 0
    });
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditChallenge = (challenge) => {
    setFormData({
      id: challenge.id,
      name: challenge.name,
      target_score: challenge.target_score
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/challenges/${challengeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete challenge');
      }

      // Remove the deleted challenge from the state
      setChallenges(challenges.filter(challenge => challenge.id !== challengeId));
      setSuccessMessage('Challenge deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error deleting challenge: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Convert target_score to number if it's that field
    if (name === 'target_score') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      
      let url = `${BACKEND}/api/user/admin/challenges/`;
      let method = 'POST';
      
      if (formMode === 'edit') {
        url = `${BACKEND}/api/user/admin/challenges/${formData.id}/`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          target_score: formData.target_score
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${formMode} challenge`);
      }

      const data = await response.json();
      
      if (formMode === 'create') {
        setChallenges([...challenges, data]);
        setSuccessMessage('Challenge created successfully');
      } else {
        setChallenges(challenges.map(challenge => 
          challenge.id === data.id ? data : challenge
        ));
        setSuccessMessage('Challenge updated successfully');
      }
      
      setShowForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Error ${formMode === 'create' ? 'creating' : 'updating'} challenge: ` + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderChallenges = () => {
    if (loading) return <div className="loading-message">Loading challenges...</div>;
    
    if (challenges.length === 0) {
      return (
        <div className="empty-state">
          <p>No challenges found. Create your first challenge!</p>
          <button className="admin-btn create-btn" onClick={handleCreateChallenge}>
            Create Challenge
          </button>
        </div>
      );
    }
    
    return (
      <div className="admin-data-container">
        <h3 className="section-title">All Game Challenges</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Target Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map(challenge => (
                <tr key={challenge.id}>
                  <td>{challenge.id}</td>
                  <td>{challenge.name}</td>
                  <td>{challenge.target_score}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="admin-action-btn edit-btn"
                        onClick={() => handleEditChallenge(challenge)}
                      >
                        Edit
                      </button>
                      <button 
                        className="admin-action-btn remove-btn"
                        onClick={() => handleDeleteChallenge(challenge.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-action-bar">
          <button className="admin-btn create-btn" onClick={handleCreateChallenge}>
            Create New Challenge
          </button>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    if (!showForm) return null;
    
    return (
      <div className="admin-form-section">
        <h3 className="section-title">
          {formMode === 'create' ? 'Create New Challenge' : 'Edit Challenge'}
        </h3>
        <form className="admin-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="name">Challenge Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter challenge name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="target_score">Target Score</label>
            <input
              type="number"
              id="target_score"
              name="target_score"
              value={formData.target_score}
              onChange={handleFormChange}
              required
              min="1"
              placeholder="Enter target score"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="admin-btn cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-btn save-btn"
            >
              {formMode === 'create' ? 'Create Challenge' : 'Update Challenge'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div>
      {/* Messages */}
      {error && (
        <div className="error-message">{error}</div>
      )}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      {/* Form for creating/editing challenges */}
      {renderForm()}
      
      {/* List of challenges */}
      {!showForm && renderChallenges()}
    </div>
  );
};

export default AdminChallenges;
