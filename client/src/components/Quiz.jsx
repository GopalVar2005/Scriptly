import React, { useState, useEffect } from 'react';
import { generateQuiz } from '../services/api';
import '../styles/Quiz.css';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({ noteId, subject, cachedQuizData }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | active | complete
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  
  // Keep track of current shuffled options so they don't re-shuffle on render change
  const [currentOptions, setCurrentOptions] = useState([]);

  useEffect(() => {
    if (cachedQuizData && Array.isArray(cachedQuizData) && cachedQuizData.length > 0) {
      setQuizData(cachedQuizData);
    }
  }, [cachedQuizData]);

  // Set up question when changing currentQuestion or when quizData is set
  useEffect(() => {
    if (phase === "active" && quizData && quizData[currentQuestion]) {
      const q = quizData[currentQuestion];
      const allOpts = [q.correct_answer, ...(q.distractors || [])];
      setCurrentOptions(shuffleArray(allOpts));
      setSelectedOption(null);
      setAnswered(false);
    }
  }, [currentQuestion, phase, quizData]);

  const handleStartQuiz = async () => {
    setError(null);
    if (quizData && quizData.length > 0) {
      resetQuizState();
      setPhase("active");
      return;
    }

    setPhase("loading");
    try {
      const data = await generateQuiz(noteId);
      if (data && data.quiz_data && data.quiz_data.length > 0) {
        setQuizData(data.quiz_data);
        resetQuizState();
        setPhase("active");
      } else {
        throw new Error("No quiz data returned");
      }
    } catch (err) {
      console.error("Quiz start error:", err);
      setError(err.message || "Failed to generate quiz");
      setPhase("idle");
    }
  };

  const resetQuizState = () => {
    setCurrentQuestion(0);
    setScore(0);
    setResults([]);
    setSelectedOption(null);
    setAnswered(false);
  };

  const handleOptionSelect = (option) => {
    if (answered) return;
    
    setSelectedOption(option);
    setAnswered(true);
    
    const q = quizData[currentQuestion];
    const isCorrect = option === q.correct_answer;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setResults(prev => [
      ...prev,
      {
        question: q.question,
        correct: q.correct_answer,
        chosen: option,
        wasCorrect: isCorrect
      }
    ]);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      setPhase("complete");
    }
  };

  if (phase === "idle") {
    return (
      <div className="quiz-wrapper">
        <div className="quiz-idle">
          <h2>Test your knowledge</h2>
          <p>Test your knowledge with questions generated from "{subject || 'this material'}"</p>
          {error && <div className="quiz-error">{error}</div>}
          <button className="quiz-start-btn" onClick={handleStartQuiz}>
            Start Quiz 🎯
          </button>
          <div className="quiz-cache-note">
            Questions are generated once and saved for future attempts
          </div>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="quiz-wrapper">
        <div className="quiz-loading">
          <div className="quiz-spinner"></div>
          <p>Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (phase === "active" && quizData) {
    const q = quizData[currentQuestion];
    const total = quizData.length;
    const progress = ((currentQuestion) / total) * 100;

    return (
      <div className="quiz-wrapper">
        <div className="quiz-header">
          <span className="quiz-counter">Question {currentQuestion + 1} of {total}</span>
          <span className="quiz-score-live">Score: {score}</span>
        </div>
        
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="quiz-question-text">{q.question}</div>

        <div className="quiz-options">
          {currentOptions.map((opt, i) => {
            let btnClass = "quiz-option";
            if (answered) {
              if (opt === q.correct_answer) btnClass += " correct";
              else if (opt === selectedOption) btnClass += " wrong";
            }
            return (
              <button
                key={i}
                className={btnClass}
                disabled={answered}
                onClick={() => handleOptionSelect(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ textAlign: 'right' }}>
            <button className="quiz-next-btn" onClick={handleNext}>
              {currentQuestion < total - 1 ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "complete") {
    const total = quizData.length;
    const pct = Math.round((score / total) * 100) || 0;
    
    let colorClass = "red";
    if (pct >= 70) colorClass = "green";
    else if (pct >= 50) colorClass = "yellow";

    return (
      <div className="quiz-wrapper">
        <div className="quiz-complete">
          <div className={`quiz-score-display ${colorClass}`}>
            {score}/{total}
          </div>
          <div className="quiz-score-label">Quiz Complete!</div>
          <div className="quiz-score-pct">You scored {pct}%</div>

          <div className="quiz-results-list">
            {results.map((res, i) => (
              <div key={i} className="quiz-result-item">
                <div className="quiz-result-q">
                  <span style={{ color: res.wasCorrect ? '#22c55e' : '#ef4444' }}>{res.wasCorrect ? '✓' : '✗'}</span>
                  <span>{res.question}</span>
                </div>
                <div className="quiz-result-detail">
                  {!res.wasCorrect && (
                    <div style={{ marginBottom: '4px' }}>
                      <span className="wrong-ans">Your answer: {res.chosen}</span>
                    </div>
                  )}
                  <div>
                    <span className="correct-ans">Correct answer: {res.correct}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="quiz-complete-actions">
            <button className="quiz-retake-btn" onClick={() => {
              resetQuizState();
              setPhase("active");
            }}>
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
