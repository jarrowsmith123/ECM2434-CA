import React, { useState } from 'react';
import './Tutorial.css';

const Tutorial = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Welcome to Campus Connect!",
            content: "logo.png"
        },
        {
            title: "How to collect eggs",
            content: "",
            image: "collect_eggs.png"
        },
        {
            title: "Monster Inventory",
            content: "Click the 'Monsters' button to view your monster collection.",
            image: "monsters_button.png"
        },
        {
            title: "Friends Page",
            content: "Click the 'Friends' button to view your friends and their monster collection.",
            image: "friends_button.png"
        },
        {
            title: "Profile Page",
            content: "Click the 'Profile' button to view your profile and achievement.", 
            image: "profile_button.png"
        }
    ];
    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };
    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };
    
    const handleComplete = () => {
        onComplete();
    };

    return (
        <div className="tutorial-overlay">
            <div className="tutorial">
                <div className="tutorial-content">
                    <h2>{slides[currentSlide].title}</h2>
                    <div className="tutorial-image-container">
                        <img
                            src={slides[currentSlide].image}
                            alt={`Tutorial slide ${currentSlide + 1}`}
                            className="tutorial-image"
                            />
                    </div>
                    <p>{slides[currentSlide].content}</p>
                    <div className="tutorial-navigation">
                        <div className="tutorial-dots">
                            {slides.mao((_, index) => (
                                    <span
                                        key={index}
                                        className={`tutorial-dot ${index === currentSlide ? "active" : ""}`}
                                        onClick={() => setCurrentSlide(index)}
                                    />
                                ))}    
                        </div>  
                            <div className="tutorial-buttons">
                                {currentSlide > 0 && (
                                    <button className="tutorial-button" onClick={prevSlide}>
                                        Back
                                    </button>
                                )}
                                {currentSlide < slides.length - 1 ? (
                                    <button className="tutorial-button next-button" onClick={nextSlide}>
                                        Next
                                    </button>
                                ) : (
                                    <button className="tutorial-button done-button" onClick={handleComplete}>
                                        Get Started!
                                    </button>
                                )}
                            </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tutorial;