import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import AdminChallenges from './AdminChallenges'; // Import the new component

const BACKEND = "http://localhost:8000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAdminStatus();
    fetchData();
  }, [activeTab]);

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

  const fetchData = async () => {
    // Only fetch data for the current tab (skip for challenges tab)
    if (activeTab === 'challenges') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      let endpoint = '';
      
      switch (activeTab) {
        case 'users':
          endpoint = '/api/user/admin/users/';
          break;
        case 'monsters':
          endpoint = '/api/user/admin/monsters/';
          break;
        case 'questions':
          endpoint = '/api/user/admin/quiz-questions/';
          break;
        case 'locations':
          endpoint = '/api/user/admin/locations/';
          break;
        default:
          endpoint = '/api/user/admin/users/';
      }

      const response = await fetch(`${BACKEND}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      
      switch (activeTab) {
        case 'users':
          setUsers(data);
          break;
        case 'monsters':
          setMonsters(data);
          break;
        case 'questions':
          setQuestions(data);
          break;
        case 'locations':
          setLocations(data);
          break;
        default:
          setUsers(data);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error loading data: ' + err.message);
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/admin/users/${userId}/admin-status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_admin: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update admin status');
      }

      // Update the users list with the new admin status
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, is_admin: !currentStatus }
          : user
      ));
      
      setSuccessMessage('Admin status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error updating admin status: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBackClick = () => {
    navigate('/home');
  };

  const handleViewUserMonsters = (userId) => {
    navigate(`/admin/users/${userId}/monsters`);
  };

  const handleViewLocationMap = () => {
    navigate('/admin/locations/map');
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

  const renderUsers = () => {
    if (loading) return <div className="loading-message">Loading users...</div>;
    
    return (
      <div className="admin-data-container">
        <h3 className="section-title">All Users</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Admin Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <span className={user.is_admin ? 'admin-badge' : 'user-badge'}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="admin-action-btn view-btn"
                        onClick={() => handleViewUserMonsters(user.id)}
                      >
                        View Monsters
                      </button>
                      <button
                        className={user.is_admin ? "admin-action-btn remove-btn" : "admin-action-btn promote-btn"}
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMonsters = () => {
    if (loading) return <div className="loading-message">Loading monsters...</div>;
    
    return (
      <div className="admin-data-container">
        <h3 className="section-title">All Monsters</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Rarity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monsters.map(monster => (
                <tr key={monster.id}>
                  <td>{monster.id}</td>
                  <td>{monster.name}</td>
                  <td>{getMonsterTypeLabel(monster.type)}</td>
                  <td>
                    <span className={`rarity-badge rarity-${monster.rarity.toLowerCase()}`}>
                      {getMonsterRarityLabel(monster.rarity)}
                    </span>
                  </td>
                  <td>
                    <button className="admin-action-btn view-btn">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-action-bar">
          <button className="admin-btn create-btn" onClick={() => navigate('/admin/monsters/create')}>Create New Monster</button>
        </div>
      </div>
    );
  };
    
  const renderQuestions = () => {
      if (loading) return <div className="loading-message">Loading questions...</div>;
      
      return (
      <div className="admin-data-container">
          <h3 className="section-title">All Quiz Questions</h3>
          <div className="admin-table-container">
          <table className="admin-table">
              <thead>
              <tr>
                  <th>ID</th>
                  <th>Question</th>
                  <th>Choices</th>
                  <th>Correct Answer</th>
                  <th>Type</th>
              </tr>
              </thead>
              <tbody>
              {questions.map(question => (
                  <tr key={question.id}>
                  <td>{question.id}</td>
                  <td>{question.question_text}</td>
                  <td>
                      <ol className="choices-list">
                      <li>{question.choice1}</li>
                      <li>{question.choice2}</li>
                      <li>{question.choice3}</li>
                      <li>{question.choice4}</li>
                      </ol>
                  </td>
                  <td>Choice {question.answer + 1}</td>
                  <td>{getMonsterTypeLabel(question.type)}</td>
                  </tr>
              ))}
              </tbody>
          </table>
          </div>
          <div className="admin-action-bar">
          <button className="admin-btn create-btn" onClick={() => navigate('/admin/questions/create')}>Create New Question</button>
          </div>
      </div>
      );
  };

  const renderLocations = () => {
    if (loading) return <div className="loading-message">Loading locations...</div>;
    
    return (
      <div className="admin-data-container">
        <h3 className="section-title">All Locations</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => (
                <tr key={location.id}>
                  <td>{location.id}</td>
                  <td>{location.location_name}</td>
                  <td>{getMonsterTypeLabel(location.type)}</td>
                  <td>{`${location.latitude}, ${location.longitude}`}</td>
                  <td>
                    <button className="admin-action-btn edit-btn">Edit</button>
                    <button className="admin-action-btn remove-btn">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-action-bar">
          <button className="admin-btn view-map-btn" onClick={handleViewLocationMap}>View Location Map</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <button className="back-button" onClick={handleBackClick}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
      <div className="admin-content">
        <div className="admin-header">
          <h2 className="admin-title">Admin Dashboard</h2>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'monsters' ? 'active' : ''}`}
            onClick={() => setActiveTab('monsters')}
          >
            Monsters
          </button>
          <button
            className={`admin-tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Quiz Questions
          </button>
          <button
            className={`admin-tab ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
          <button
            className={`admin-tab ${activeTab === 'challenges' ? 'active' : ''}`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="admin-tab-content">
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'monsters' && renderMonsters()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'locations' && renderLocations()}
          {activeTab === 'challenges' && <AdminChallenges />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
