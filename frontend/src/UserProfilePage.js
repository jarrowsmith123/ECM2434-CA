import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfilePage.css';

const BACKEND = "http://localhost:8000";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${BACKEND}/api/user/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token has expired so remove it and ask user to login again
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUserData(data);
      
      setFormData({
        username: data.username || '',
        email: data.email || '',
      });
      
      setLoading(false);
    } catch (err) {
      setError('Error loading profile: ' + err.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // Update user data
      const response = await fetch(`${BACKEND}/api/user/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Fetch updated profile data
      await fetchUserProfile();
      setIsEditing(false);
    } catch (err) {
      setError('Error updating profile: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Clear local storage and redirect to login
      // THis isnt working properly currently so needs a look at
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    } catch (err) {
      setError('Error deleting account: ' + err.message);
    }
  };

  const handleBackClick = () => {
    navigate('/home');
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
              {isEditing ? 'Edit Profile' : 'Your Profile'}
            </h2>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {!isEditing ? (
            // View Mode
            <div className="profile-view">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {userData?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
              
              <div className="profile-details">
                <div className="detail-group">
                  <label className="detail-label">Username</label>
                  <p className="detail-value">{userData?.username}</p>
                </div>
                
                <div className="detail-group">
                  <label className="detail-label">Email</label>
                  <p className="detail-value">{userData?.email}</p>
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
              
              <div className="action-buttons">
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
                
                {!deleteConfirm ? (
                  <button
                    className="delete-button"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="confirm-delete">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="confirm-buttons">
                      <button
                        className="confirm-yes"
                        onClick={handleDeleteAccount}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  className="form-input"
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  className="form-input"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button
                  type="submit"
                  className="submit-button"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: userData?.username || '',
                      email: userData?.email || '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
