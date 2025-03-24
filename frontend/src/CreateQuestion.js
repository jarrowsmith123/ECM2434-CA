import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import config from './config';

const BACKEND = config.API_URL;

const CreateQuestion = () => {
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState('');
  const [choice1, setChoice1] = useState('');
  const [choice2, setChoice2] = useState('');
  const [choice3, setChoice3] = useState('');
  const [choice4, setChoice4] = useState('');
  const [answer, setAnswer] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

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

  const handleBack = () => {
    navigate('/admin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!questionText || !choice1 || !choice2 || !choice3 || !choice4 || !answer || !questionType) {
      setError('Please fill in all fields');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Validate that answer is between 0-3
    const answerNum = parseInt(answer);
    if (isNaN(answerNum) || answerNum < 0 || answerNum > 3) {
      setError('Answer must be a number between 0-3');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/quiz/create-question/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_text: questionText,
          choice1: choice1,
          choice2: choice2,
          choice3: choice3,
          choice4: choice4,
          answer: answerNum,
          type: questionType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create question');
      }

      const data = await response.json();
      
      setSuccessMessage('Quiz question created successfully!');
      
      // Reset form
      setQuestionText('');
      setChoice1('');
      setChoice2('');
      setChoice3('');
      setChoice4('');
      setAnswer('');
      setQuestionType('');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error creating quiz question: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        <div className="admin-header">
          <h2 className="admin-title">Create Quiz Question</h2>
          <button className="back-button" onClick={handleBack}>Back to Admin</button>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        
        {/* Create Question Form */}
        <div className="admin-form-section">
          <form onSubmit={handleSubmit}>
            <div className="admin-form">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="questionText">Question Text:</label>
                <textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the quiz question"
                  rows="3"
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="choice1">Choice 1:</label>
                <input
                  id="choice1"
                  type="text"
                  value={choice1}
                  onChange={(e) => setChoice1(e.target.value)}
                  placeholder="Enter choice 1"
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="choice2">Choice 2:</label>
                <input
                  id="choice2"
                  type="text"
                  value={choice2}
                  onChange={(e) => setChoice2(e.target.value)}
                  placeholder="Enter choice 2"
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="choice3">Choice 3:</label>
                <input
                  id="choice3"
                  type="text"
                  value={choice3}
                  onChange={(e) => setChoice3(e.target.value)}
                  placeholder="Enter choice 3"
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="choice4">Choice 4:</label>
                <input
                  id="choice4"
                  type="text"
                  value={choice4}
                  onChange={(e) => setChoice4(e.target.value)}
                  placeholder="Enter choice 4"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="answer">Correct Answer (0-3):</label>
                <input
                  id="answer"
                  type="number"
                  min="0"
                  max="3"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter correct answer index (0-3)"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="questionType">Monster Type:</label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                >
                  <option value="">Select monster type</option>
                  <option value="F&D">Food and Drink</option>
                  <option value="HWB">Health and Wellbeing</option>
                  <option value="W">Water</option>
                  <option value="WA">Waste</option>
                  <option value="N&B">Nature and Biodiversity</option>
                  <option value="E">Energy</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="admin-btn create-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Question'}
                </button>
                <button
                  type="button"
                  className="admin-btn cancel-btn"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;
