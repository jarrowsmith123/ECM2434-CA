import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import MonstersPage from './MonstersPage';
import UserProfilePage from './UserProfilePage';
import OtherUserProfilePage from './OtherUserProfilePage';
import FriendsPage from './FriendsPage';
import MonstersChallengePage from './MonstersChallengePage';
import './App.css';

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
