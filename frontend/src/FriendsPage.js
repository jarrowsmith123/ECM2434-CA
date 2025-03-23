import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FriendsPage.css';

const BACKEND = "http://localhost:8000";

const FriendsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tab, setTab] = useState('friends'); // tabs: friends, requests, add
  const [isSearching, setIsSearching] = useState(false);
    
  useEffect(() => {
    fetchCurrentUser();
    fetchFriends();
  }, []);
    
  const fetchCurrentUser = async() => {
      const token = localStorage.getItem('accessToken');
      
      const user_response = await fetch(`${BACKEND}/api/user/me/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
  
      setUser(await user_response.json());
  }

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
      const receivedRequests = data.filter(f => f.status === 'pending' && f.receiver_username === user);
      const outgoingRequests = data.filter(f => f.status === 'pending' && f.sender_username === user);
      
      setFriends(acceptedFriends);
      setPendingRequests(receivedRequests);
      setSentRequests(outgoingRequests);
      setLoading(false);
    } catch (err) {
      setError('Error loading friends: ' + err.message);
      setLoading(false);
    }
  };

  const searchUsers = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!searchTerm.trim()) {
      setError('Please enter a username to search');
      return;
    }
    
    try {
      setIsSearching(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/user/search-user/?search=${searchTerm}&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search for users');
      }

      const data = await response.json();
      // Filter out the current user from results
      const filteredResults = data.filter(user => user.username !== user);
      setSearchResults(filteredResults);
      setIsSearching(false);
      
      if (filteredResults.length === 0) {
        setError('No users found with that username');
      }
    } catch (err) {
      setError('Error searching for users: ' + err.message);
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (username) => {
    setError('');
    setSuccessMessage('');
    
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

      setSuccessMessage(`Friend request sent to ${username}!`);
      // Refresh the friends list
      fetchFriends();
      // Clear search results
      setSearchResults([]);
      setSearchTerm('');
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

  // Check if the user is already a friend or has a pending request
  const checkFriendshipStatus = (username) => {
    // Check if they're already friends
    const isFriend = friends.some(f =>
      (f.sender_username === username && f.receiver_username === localStorage.getItem('username')) ||
      (f.receiver_username === username && f.sender_username === localStorage.getItem('username'))
    );
    
    if (isFriend) {
      return "friends";
    }
    
    // Check if there's a pending request from the current user
    const hasSentRequest = sentRequests.some(r => r.receiver_username === username);
    if (hasSentRequest) {
      return "sent";
    }
    
    // Check if there's a pending request to the current user
    const hasReceivedRequest = pendingRequests.some(r => r.sender_username === username);
    if (hasReceivedRequest) {
      return "received";
    }
    
    return "none";
  };

  // Add function to navigate to friend's profile
  const navigateToFriendProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  const handleBackClick = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="friends-container">
        <button className="back-button" onClick={handleBackClick}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>
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
      <button className="back-button" onClick={handleBackClick}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
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
              onClick={() => {
                setTab('add');
                setSearchResults([]);
                setSearchTerm('');
                setError('');
                setSuccessMessage('');
              }}
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
                  {friends.map((friend) => {
                    const friendUsername = friend.sender_username === user
                      ? friend.receiver_username
                      : friend.sender_username;
                    
                    return (
                      <div
                        key={friend.id}
                        className="friend-card"
                        onClick={() => navigateToFriendProfile(friendUsername)}
                      >
                        <div className="friend-avatar">
                          {friendUsername.charAt(0).toUpperCase()}
                        </div>
                        <div className="friend-name">
                          {friendUsername}
                        </div>
                        <div className="friend-since">
                          Friends since {new Date(friend.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
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
              <h3>Find Friends</h3>
              <form onSubmit={searchUsers} className="search-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="searchTerm">Search by username</label>
                  <div className="search-input-container">
                    <input
                      className="form-input"
                      id="searchTerm"
                      name="searchTerm"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter username to search"
                      required
                    />
                    <button type="submit" className="search-button" disabled={isSearching}>
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </form>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  <h4>Search Results</h4>
                  <div className="results-list">
                    {searchResults.map((user) => {
                      const status = checkFriendshipStatus(user.username);
                      return (
                        <div key={user.id} className="user-result-item">
                          <div className="user-avatar">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-username">{user.username}</div>
                          </div>
                          <div className="user-actions">
                            {status === "none" && (
                              <button
                                className="add-friend-button"
                                onClick={() => sendFriendRequest(user.username)}
                              >
                                Add Friend
                              </button>
                            )}
                            {status === "friends" && (
                              <span className="friendship-status friends">Already Friends</span>
                            )}
                            {status === "sent" && (
                              <span className="friendship-status sent">Request Sent</span>
                            )}
                            {status === "received" && (
                              <span className="friendship-status received">Respond to Request</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
