import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import MonstersPage from './MonstersPage';
import ChallengesPage from './ChallengesPage'
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/monsters" element={<MonstersPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
