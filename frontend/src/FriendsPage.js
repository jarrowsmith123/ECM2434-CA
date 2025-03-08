import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FriendsPage.css';

const BACKEND = "http://localhost:8000";

const FriendsPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tab, setTab] = useState('friends'); // tabs: friends, requests, add

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${BACKEND}/api/user/friends/`, {
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
        throw new Error('Failed to fetch friends');
      }

      const data = await response.json();
      
      // Filter friends by status
      const acceptedFriends = data.filter(f => f.status === 'accepted');
      const receivedRequests = data.filter(f => f.status === 'pending' && f.receiver_username === localStorage.getItem('username'));
      const outgoingRequests = data.filter(f => f.status === 'pending' && f.sender_username === localStorage.getItem('username'));
      
      setFriends(acceptedFriends);
      setPendingRequests(receivedRequests);
      setSentRequests(outgoingRequests);
      setLoading(false);
    } catch (err) {
      setError('Error loading friends: ' + err.message);
      setLoading(false);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/create-friend-request/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: username,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      setSuccessMessage('Friend request sent successfully!');
      setUsername('');
      // Refresh the friends list
      fetchFriends();
    } catch (err) {
      setError('Error sending friend request: ' + err.message);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      setError('');
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/accept-friend-request/${requestId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept friend request');
      }

      setSuccessMessage('Friend request accepted!');
      // Refresh the friends list
      fetchFriends();
    } catch (err) {
      setError('Error accepting friend request: ' + err.message);
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      setError('');
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/decline-friend-request/${requestId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to decline friend request');
      }

      setSuccessMessage('Friend request declined!');
      // Refresh the friends list
      fetchFriends();
    } catch (err) {
      setError('Error declining friend request: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="friends-container">
        <div className="friends-content">
          <div className="friends-card">
            <div className="friends-header">
              <h2 className="friends-title">Loading friends...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-container">
      <div className="friends-content">
        <div className="friends-card">
          <div className="friends-header">
            <h2 className="friends-title">Friends</h2>
          </div>

          {/* Tab Navigation */}
          <div className="tabs-container">
            <div
              className={`tab ${tab === 'friends' ? 'active' : ''}`}
              onClick={() => setTab('friends')}
            >
              My Friends
              {friends.length > 0 && <span className="tab-badge">{friends.length}</span>}
            </div>
            <div
              className={`tab ${tab === 'requests' ? 'active' : ''}`}
              onClick={() => setTab('requests')}
            >
              Friend Requests
              {pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
            </div>
            <div
              className={`tab ${tab === 'add' ? 'active' : ''}`}
              onClick={() => setTab('add')}
            >
              Add Friend
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="error-message">{error}</div>
          )}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Friends List Tab */}
          {tab === 'friends' && (
            <div className="friends-list">
              <h3>My Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className="empty-state">
                  <p>You don't have any friends yet.</p>
                  <button
                    className="action-button"
                    onClick={() => setTab('add')}
                  >
                    Add Friends
                  </button>
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                      <div className="friend-avatar">
                        {(friend.sender_username === localStorage.getItem('username')
                          ? friend.receiver_username
                          : friend.sender_username).charAt(0).toUpperCase()}
                      </div>
                      <div className="friend-name">
                        {friend.sender_username === localStorage.getItem('username')
                          ? friend.receiver_username
                          : friend.sender_username}
                      </div>
                      <div className="friend-since">
                        Friends since {new Date(friend.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sentRequests.length > 0 && (
                <div className="sent-requests-section">
                  <h3>Sent Requests ({sentRequests.length})</h3>
                  <div className="requests-list">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="request-item">
                        <div className="request-avatar">
                          {request.receiver_username.charAt(0).toUpperCase()}
                        </div>
                        <div className="request-details">
                          <div className="request-username">{request.receiver_username}</div>
                          <div className="request-status">Pending</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {tab === 'requests' && (
            <div className="requests-container">
              <h3>Friend Requests ({pendingRequests.length})</h3>
              {pendingRequests.length === 0 ? (
                <div className="empty-state">
                  <p>You don't have any pending friend requests.</p>
                </div>
              ) : (
                <div className="requests-list">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="request-item">
                      <div className="request-avatar">
                        {request.sender_username.charAt(0).toUpperCase()}
                      </div>
                      <div className="request-details">
                        <div className="request-username">{request.sender_username}</div>
                        <div className="request-date">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="request-actions">
                        <button
                          className="accept-button"
                          onClick={() => acceptFriendRequest(request.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="decline-button"
                          onClick={() => declineFriendRequest(request.id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Friend Tab */}
          {tab === 'add' && (
            <div className="add-friend-container">
              <h3>Add a Friend</h3>
              <form onSubmit={sendFriendRequest} className="add-friend-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="username">Username</label>
                  <input
                    className="form-input"
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your friend's username"
                    required
                  />
                </div>
                <button type="submit" className="send-request-button">
                  Send Friend Request
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
