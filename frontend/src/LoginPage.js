import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const BACKEND = "http://localhost:8000"

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
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
    </div>
  );
};

export default LoginPage;
