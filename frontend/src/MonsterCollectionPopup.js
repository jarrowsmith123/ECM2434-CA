import React, { useState, useEffect } from 'react';
import './MonsterCollectionPopup.css';

const MonsterCollectionPopup = ({ monster, onClose, onCollect }) => {
  const [isWiggling, setIsWiggling] = useState(true); // change back to true
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
      case 'H': return '/images/healthEgg.png';
      case 'WB': return '/images/wellbeingEgg.png';
      case 'W': return '/images/waterEgg.png';
      case 'WA': return '/images/wasteEgg.png';
      case 'N&B': return '/images/natureEgg.png';
      case 'T': return '/images/transportEgg.png';
      default: return '/images/natureEgg.png';
    }
  };

  // This function will randomly select one of the monster variations based on type
  const getRandomMonsterImage = (type) => {
    // We'll randomly choose between variations 1-4 for each type
    const randomNum = Math.floor(Math.random() * 4) + 1;
    
    switch(type) {
      case 'F&D': return `/images/food${randomNum}.png`;
      case 'H': return `/images/health${randomNum}.png`;
      case 'WB': return `/images/wellbeing${randomNum}.png`;
      case 'W': return `/images/water${randomNum}.png`;
      case 'WA': return `/images/waste${randomNum}.png`;
      case 'N&B': return `/images/nature${randomNum}.png`;
      case 'T': return `/images/transport${randomNum}.png`;
      default: return `/images/nature${randomNum}.png`;
    }
  };

  // Fetch quiz question from backend (placeholder for now)
  const fetchQuizQuestion = async (monsterType) => {
    setIsLoading(true);
    try {
      // This would be replaced with actual API call to backend
      // const response = await fetch(`/api/quiz-questions?monsterType=${monsterType}`);
      // const data = await response.json();
    } catch (error) {
      console.error("Error fetching quiz question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit answer to backend (placeholder for now)
  const submitAnswer = async (questionId, answerId) => {
    setIsLoading(true);
    try {
      // This would be replaced with actual API call to backend
      // const response = await fetch('/api/submit-answer', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ questionId, answerId }),
      // });
      // const data = await response.json();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For now, check against the mock data
      const isCorrect = answerId === quizQuestion.correctAnswer;
      setIsAnswerCorrect(isCorrect);
      
      // If correct, proceed with hatching
      if (isCorrect) {
        setTimeout(() => {
          setShowQuiz(false);
          setIsHatched(true);
          
          // Call onCollect with the randomized monster
          setTimeout(() => {
            onCollect(randomMonster);
          }, 2000);
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Fallback to checking locally in case of error
      const isCorrect = answerId === quizQuestion.correctAnswer;
      setIsAnswerCorrect(isCorrect);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set up wiggling animation for 3 seconds
    /*const wiggleTimer = setTimeout(() => {
      setIsWiggling(false);
    }, 3000);*/
    
    // Generate random monster but don't show it yet
    setRandomMonster({
      ...monster,
      imageUrl: getRandomMonsterImage(monster.type)
    });
    
    return () => {
      //clearTimeout(wiggleTimer);
    };
  }, [monster]);

  const handleHatchEgg = () => {
    // Instead of immediately hatching, now show quiz
    setShowQuiz(true);
    fetchQuizQuestion(monster.type);
  };

  const handleAnswerSelection = (answerId) => {
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      submitAnswer('quiz-question-id', selectedAnswer);
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
                  alt={`${monster.name} Egg`}
                  className="egg-image"
                />
              </div>
              <p>The egg is wiggling! It seems ready to hatch.</p>
              <button
                className="hatch-button"
                onClick={handleHatchEgg}
                disabled={false}
              >
                {"Hatch Egg!"}
              </button>
            </>
          ) : showQuiz ? (
            // Quiz state
            <>
              <h2>Answer to hatch your egg!</h2>
              {isLoading && !quizQuestion ? (
                <div className="loading-indicator">
                  <p>Loading quiz question...</p>
                </div>
              ) : quizQuestion ? (
                <div className="quiz-container">
                  <div className={`egg-container ${isWiggling ? 'wiggle' : ''}`}>
                    <img
                      src={getEggImage(monster.type)}
                      alt={`${monster.name} Egg`}
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
                            index === quizQuestion.correctAnswer ? 'correct' : 
                            index === selectedAnswer && index !== quizQuestion.correctAnswer ? 'incorrect' : ''
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
                  alt={randomMonster.name}
                  className="monster-image"
                />
              </div>
              <p>You've hatched a {randomMonster.name}!</p>
              <div className="monster-details">
                <p><span>Type:</span> {getTypeName(randomMonster.type)}</p>
                <p><span>Rarity:</span> <span style={{color: getRarityColor(randomMonster.rarity)}}>{getRarityName(randomMonster.rarity)}</span></p>
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
    case 'H': return 'Health';
    case 'WB': return 'Wellbeing';
    case 'W': return 'Water';
    case 'WA': return 'Waste';
    case 'N&B': return 'Nature and Biodiversity';
    case 'T': return 'Transport';
    default: return 'Unknown';
  }
};

export default MonsterCollectionPopup;
