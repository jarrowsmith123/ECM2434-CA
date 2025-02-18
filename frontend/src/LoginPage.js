import React, { useState } from 'react';

const BACKEND = "http://localhost:8000"

const LoginPage = () => {
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
        
      if (isLogin) {
        localStorage.setItem('accessToken', result.access);
        localStorage.setItem('refreshToken', result.refresh);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div >
        <div>
          <h2>
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <label htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </div>

          {error && (
              <text>{error}</text>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>

        <div>
          <button
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
