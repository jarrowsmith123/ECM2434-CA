// Update your App.js file to include the new route for viewing other users' profiles

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import MonstersPage from './MonstersPage';
import UserProfilePage from './UserProfilePage';
import OtherUserProfilePage from './OtherUserProfilePage';
import FriendsPage from './FriendsPage';
import MonstersChallengePage from './MonstersChallengePage';
import AdminDashboard from './AdminPage';
import UserMonstersManagement from './UserMonstersManagement';
import CreateMonster from './CreateMonster';
import CreateQuestion from './CreateQuestion';
import AdminLocationMap from './AdminLocationMap';
import './App.css';
import config from './config';

// Protected route component for admin-only routes
const AdminRoute = ({ children }) => {
  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return false;
      }
      const response = await fetch(`${config.API_URL}/api/user/check-admin/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      return response.ok && data.is_admin;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };
  // If user is admin, render the children, otherwise redirect to home
  return checkAdminStatus() ? children : <Navigate to="/home" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/monsters" element={<MonstersPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/profile/:username" element={<OtherUserProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/monsters_challenge" element={<MonstersChallengePage />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users/:userId/monsters" element={
            <AdminRoute>
              <UserMonstersManagement />
            </AdminRoute>
          } />
          <Route path="/admin/monsters/create" element={
            <AdminRoute>
              <CreateMonster />
            </AdminRoute>
          } />
          <Route path="/admin/questions/create" element={
            <AdminRoute>
              <CreateQuestion />
            </AdminRoute>
          } />
          <Route path="/admin/locations/map" element={
            <AdminRoute>
              <AdminLocationMap />
            </AdminRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
