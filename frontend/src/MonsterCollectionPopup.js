import React, { useState, useEffect } from 'react';
import './MonsterCollectionPopup.css';
import config from './config';

const BACKEND = config.API_URL;

const MonsterCollectionPopup = ({ monster, onClose, onCollect }) => {
  const [isWiggling, setIsWiggling] = useState(true);
  const [isHatched, setIsHatched] = useState(false);
  const [randomMonster, setRandomMonster] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the egg image based on monster type
  const getEggImage = (type) => {
    switch(type) {
      case 'F&D': return '/images/foodEgg.png';
      case 'HWB': return '/images/healthEgg.png';
      case 'W': return '/images/waterEgg.png';
      case 'WA': return '/images/wasteEgg.png';
      case 'N&B': return '/images/natureEgg.png';
      case 'T': return '/images/transportEgg.png';
      default: return '/images/natureEgg.png';
    }
  };

  // This function will get the image for the monster obtained
  const getMonsterImage = (type, rarity) => {
    const typeImageMap = {
      'F&D': 'food',
      'HWB': 'health',
      'W': 'water',
      'WA': 'waste',
      'N&B': 'nature',
      'E': 'energy',
      'T': 'transport'
    };
    
    const rarityNumber = {
      'C': '1',
      'R': '2',
      'E': '3',
      'L': '4'
    };
    
    const baseType = typeImageMap[type] || 'nature';
    const rarityNum = rarityNumber[rarity] || '1';
    
    return `/images/${baseType}${rarityNum}.png`;
  };

  // Generate a random monster from the backend
  const generateRandomMonster = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Call the random-monster endpoint to get a random monster of this type
      const response = await fetch(`${BACKEND}/api/monsters/random-monster/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: monster.type
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate random monster');
      }
      
      const data = await response.json();
      
      // Set the obtained monster
      const obtainedMonster = {
        ...data,
        imageUrl: getMonsterImage(data.monster.type, data.monster.rarity)
      };
      
      setRandomMonster(obtainedMonster);
      
      // Now fetch the quiz question for this monster type
      await fetchQuizQuestion(data.monster.type);
      
    } catch (error) {
      console.error("Error generating random monster:", error);
      // Fallback to using the original monster as a fake random one
      const fakeMonster = {
        id: 'temp-' + Date.now(),
        monster: {
          id: monster.id,
          name: monster.name,
          type: monster.type,
          rarity: 'C' // Default to common
        },
        level: 1,
        imageUrl: getMonsterImage(monster.type, 'C')
      };
      
      setRandomMonster(fakeMonster);
      
      // Try to fetch quiz question anyway
      await fetchQuizQuestion(monster.type);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch quiz question from backend based on monster type
  const fetchQuizQuestion = async (monsterType) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Get quiz question for this monster type
      const response = await fetch(`${BACKEND}/api/quiz/get-question/${monsterType}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz question');
      }
      
      const data = await response.json();
      
      // Format the question and choices
      setQuizQuestion({
        id: data.id,
        question: data.question_text,
        options: [
          data.choice1,
          data.choice2,
          data.choice3,
          data.choice4
        ]
      });
    } catch (error) {
      console.error("Error fetching quiz question:", error);
      // Fallback to mock question if API fails
      setQuizQuestion({
        id: 'mock-1',
        question: 'What is an example of sustainable food practice?',
        options: [
          'Eating meat every day',
          'Growing your own vegetables',
          'Buying imported fruits',
          'Using disposable plates'
        ],
        correctAnswer: 1  // This is a fallback and only used if API fails
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit answer to backend
  const submitAnswer = async (answerId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/quiz/check-answer/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: quizQuestion.id,
          answer: answerId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
      
      const data = await response.json();
      setIsAnswerCorrect(data.correct);
      
      // If correct, proceed with creating the player monster
      if (data.correct) {
        await createPlayerMonster();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Fallback behavior if API fails
      const mockCorrect = answerId === 1; // Just for testing
      setIsAnswerCorrect(mockCorrect);
      
      if (mockCorrect) {
        await createPlayerMonster();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create player monster after correct answer
  const createPlayerMonster = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${BACKEND}/api/monsters/create-player-monster/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monster_id: randomMonster.monster.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create player monster');
      }
      
      // Show hatched monster
      setTimeout(() => {
        setShowQuiz(false);
        setIsHatched(true);
        
        // Notify parent component that monster was collected
        setTimeout(() => {
          onCollect(monster);
        }, 2000);
      }, 1500);
      
    } catch (error) {
      console.error("Error creating player monster:", error);
      // Still go on to hatching even if API fails probably not very wise but oh well
      setTimeout(() => {
        setShowQuiz(false);
        setIsHatched(true);
        setTimeout(() => onCollect(monster), 2000);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  // When component mounts, generate the random monster immediately
  useEffect(() => {
    generateRandomMonster();
  }, [monster]);

  const handleHatchEgg = () => {
    // Show quiz after hatching
    setShowQuiz(true);
  };

  const handleAnswerSelection = (answerId) => {
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      submitAnswer(selectedAnswer);
    }
  };

  const handleTryAgain = () => {
    // Reset answer state and let user try again
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
  };

  return (
    <div className="monster-popup-overlay">
      <div className="monster-popup-container">
        <button className="popup-close-button" onClick={onClose}>×</button>
        
        <div className="popup-content">
          {!showQuiz && !isHatched ? (
            // Initial egg state
            <>
              <h2>You found an egg!</h2>
              <div className={`egg-container ${isWiggling ? 'wiggle' : ''}`}>
                <img
                  src={getEggImage(monster.type)}
                  alt={`${monster.type} Egg`}
                  className="egg-image"
                />
              </div>
              <p>The egg is wiggling! It seems ready to hatch.</p>
              {isLoading ? (
                <p>Preparing egg...</p>
              ) : (
                <button
                  className="hatch-button"
                  onClick={handleHatchEgg}
                  disabled={isLoading || !randomMonster || !quizQuestion}
                >
                  {"Hatch Egg!"}
                </button>
              )}
            </>
          ) : showQuiz ? (
            // Quiz state
            <>
              <h2>Answer to complete the hatching!</h2>
              {isLoading && !quizQuestion ? (
                <div className="loading-indicator">
                  <p>Loading quiz question...</p>
                </div>
              ) : quizQuestion ? (
                <div className="quiz-container">
                  <div className={`egg-container ${isWiggling ? 'wiggle' : ''}`}>
                    <img
                      src={getEggImage(monster.type)}
                      alt={`${monster.type} Egg`}
                      className="egg-image"
                    />
                  </div>
                  <div className="quiz-question">
                    <p>{quizQuestion.question}</p>
                  </div>
                  <div className="quiz-options">
                    {quizQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        className={`quiz-option ${selectedAnswer === index ? 'selected' : ''} ${
                          isAnswerCorrect !== null ? (
                            (isAnswerCorrect && index === selectedAnswer) ? 'correct' : 
                            (!isAnswerCorrect && index === selectedAnswer) ? 'incorrect' : ''
                          ) : ''
                        }`}
                        onClick={() => isAnswerCorrect === null && handleAnswerSelection(index)}
                        disabled={isAnswerCorrect !== null || isLoading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  
                  {isAnswerCorrect === null ? (
                    // No answer submitted yet
                    <button
                      className="submit-answer-button"
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null || isLoading}
                    >
                      {isLoading ? "Submitting..." : "Submit Answer"}
                    </button>
                  ) : isAnswerCorrect === true ? (
                    // Correct answer
                    <div className="answer-result correct">
                      <p>Correct! Your egg is hatching...</p>
                      {isLoading && <p>Creating your monster...</p>}
                    </div>
                  ) : (
                    // Incorrect answer
                    <div className="answer-result incorrect">
                      <p>Oops! That's not correct.</p>
                      <button
                        className="try-again-button"
                        onClick={handleTryAgain}
                        disabled={isLoading}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p>Error loading question. Please try again.</p>
              )}
            </>
          ) : (
            // Hatched state (success)
            <>
              <h2>Congratulations!</h2>
              <div className="monster-reveal">
                <img
                  src={randomMonster.imageUrl}
                  alt={randomMonster.monster.name}
                  className="monster-image"
                />
              </div>
              <p>You've hatched a {randomMonster.monster.name}!</p>
              <div className="monster-details">
                <p><span>Type:</span> {getTypeName(randomMonster.monster.type)}</p>
                <p><span>Rarity:</span> <span style={{color: getRarityColor(randomMonster.monster.rarity)}}>{getRarityName(randomMonster.monster.rarity)}</span></p>
                <p><span>Level:</span> {randomMonster.level}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions from the original code
const getRarityColor = (rarity) => {
  switch(rarity) { // can change these colours later just liked them from now
    case 'C': return '#a5a5a5';
    case 'R': return '#3498db';
    case 'E': return '#9b59b6';
    case 'L': return '#f1c40f';
    default: return '#a5a5a5';
  }
};

// This needs to be changed in the backed so that they just have the full name instead of the code because they are currently being stored as tuples which is stupid
const getRarityName = (rarity) => {
  switch(rarity) {
    case 'C': return 'Common';
    case 'R': return 'Rare';
    case 'E': return 'Epic';
    case 'L': return 'Legendary';
    default: return 'Unknown';
  }
};

const getTypeName = (type) => {
  switch(type) {
    case 'F&D': return 'Food and Drink';
    case 'HWB': return 'Health and Wellbeing';
    case 'W': return 'Water';
    case 'WA': return 'Waste';
    case 'N&B': return 'Nature and Biodiversity';
    case 'T': return 'Transport';
    case 'E': return 'Energy';
    default: return 'Unknown';
  }
};

export default MonsterCollectionPopup;
