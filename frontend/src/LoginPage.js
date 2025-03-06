import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const BACKEND = "http://localhost:8000"

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [policyChecked, setPolicyChecked] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if(!isLogin && !policyChecked) {
      setError("You must accept the Terms and Conditions to create an account");
      setLoading(false);
      return
    }

    const formData = new FormData(e.target);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
      ...(isLogin ? {} : { email: formData.get('email') })
    };

    try {
      const endpoint = BACKEND + (isLogin ? '/api/token/' : '/api/user/register/');
        
      console.log(data);
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const result = await response.json();
      // look back over this
      if (isLogin) {
        localStorage.setItem('accessToken', result.access);
        localStorage.setItem('refreshToken', result.refresh);
        // Navigate to home page after successful login
        navigate('/home');
      } else {
        // After successful registration, switch to login mode
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-container">
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                className="form-input"
                id="username"
                name="username"
                type="text"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="form-input"
                  id="email"
                  name="email"
                  type="email"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                className="form-input"
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </div>

          {isLogin && (
            <div className='policy-container'>
              <input 
                type='checkbox'
                id='policy'
                checked={policyChecked}
                onChange={(e) => setPolicyChecked(e.target.checked)}
                required
              />
              <label htmlFor='policy' className='policy-label'>
                I accept the <span onClick={() => setShowPolicy(true)} className='policy-link'>Terms and Conditions</span>
              </label>
            </div>
          )}


          {error && (
            <span className="error-message">{error}</span>
          )}

          <div className="button-container">
            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>

        <div className="toggle-container">
          <button
            className="toggle-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>

      {showPolicy && (
        <div className='policy-popup'>
          <div className='policy-content'>
            <span className='close-button' onClick={() => setShowPolicy(false)}><X/></span>
            <h2>Terms and Conditions</h2>
            <p>
              1 - Introduction
              This Privacy Policy and Terms of Conditions document outlines how we collect, use, store, and protect your personal information in compliance with the General Data Protection Regulation (GDPR).

              2 - Information we Collect
              We collect the following personal data:
              Username
              Email address
              Password

              2.1 - Purpose of Data Collection
              The data is collected solely for the purpose of:
              User account creation
              Login authentication
              Leaderboard profiles
              Communication related to account management

              3 - Legal Basis for Processing
              Our legal basis for processing your personal data is:
              Consent: By creating an account, you provide explicit consent for data processing
              Contractual necessity: Data is necessary to provide the game service

              4 - Data Storage and Security

              4.1 - Storage Location
              All user data is stored directly in our secure database
              No third-party data processors are involved

              4.2 - Security Measures
              Passwords are hashed and salted
              Encrypted database connections
              Access to user data is strictly limited to essential personnel

              5 - User Rights Under GDPR
              As a user, you have the following rights

              5.1 - Right to Access
              You can request a copy of all personal data we store about you
              Requests will be processed within 30 days

              5.2 - Right to Modification
              You can update your username, email, or password at any time
              You can make corrections to inaccurate personal data

              5.3 - Right to Deletion
              You can request complete deletion of your account and associated data
              Upon request, all your personal data will be permanently erased

              5.4 - Right to restrict Processing
              You can request limitations on how we process your personal data

              6 - Data Retention
              User data is retained as long as the account is active
              Inactive accounts may be subject to deletion after 9 months of inactivity

              7. Consent and Account Termination

              7.1 - Consent
              By creating an account, you consent to this Privacy Policy
              You can withdraw consent at any time by deleting your account

              8 - Changes to Privacy Policy
              We may update this policy periodically
              Users will be notified of significant changes
              Continued use of the game after changes constitutes acceptance

              Last Updated: 4th March 2025

              By creating an account, you agree to our Terms and Conditions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
