import React, { useState, useEffect, useCallback } from 'react';
import { Target, Check, RotateCcw, PartyPopper } from 'lucide-react';
import { updateNote } from '../services/api';
import '../styles/Flashcard.css';

export default function Flashcard({ noteId, termCards = [], conceptCards = [], initialProgress }) {
  const [deckMode, setDeckMode] = useState("terms"); // "terms" | "concepts"
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Independent progress state for terms and concepts
  const [progress, setProgress] = useState(() => {
    // Merge initial backend progress with any local storage fallback, preferring backend if available
    const defaultProgress = {
      terms: { known: [], lastReviewedAt: null },
      concepts: { known: [], lastReviewedAt: null }
    };
    
    // Check localStorage first
    let local = null;
    if (noteId && noteId !== 'demo') {
      try {
        const stored = localStorage.getItem(`scriptly_fc_${noteId}`);
        if (stored) local = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local flashcard progress', e);
      }
    }
    
    return initialProgress || local || defaultProgress;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  const currentDeck = deckMode === "terms" ? termCards : conceptCards;
  const currentKnown = progress[deckMode]?.known || [];
  
  // Filter for review mode (only unknowns)
  const activeDeck = isReviewMode 
    ? currentDeck.filter((_, idx) => !currentKnown.includes(idx))
    : currentDeck;

  const totalCards = activeDeck.length;
  const isComplete = totalCards > 0 && currentIndex >= totalCards;
  const allMastered = currentDeck.length > 0 && currentKnown.length === currentDeck.length;
  const masteryPercent = currentDeck.length > 0 ? Math.round((currentKnown.length / currentDeck.length) * 100) : 0;

  // Save progress to backend (and localStorage as backup)
  const saveProgress = useCallback(async (newProgress) => {
    setProgress(newProgress);
    
    if (noteId && noteId !== 'demo') {
      try {
        // Save local backup immediately
        localStorage.setItem(`scriptly_fc_${noteId}`, JSON.stringify(newProgress));
        // Save to backend async
        await updateNote(noteId, { flashcard_progress: newProgress });
      } catch (err) {
        console.error("Failed to save flashcard progress to backend", err);
      }
    }
  }, [noteId]);

  // Reset index when switching decks or review mode
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [deckMode, isReviewMode]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 150); // wait for flip animation to start before changing text
  };

  const handleKnow = () => {
    // Only add if not already known (when not in review mode)
    const actualIndex = isReviewMode 
      ? currentDeck.findIndex(c => c.front === activeDeck[currentIndex].front) 
      : currentIndex;
      
    if (!currentKnown.includes(actualIndex)) {
      const newKnown = [...currentKnown, actualIndex];
      saveProgress({
        ...progress,
        [deckMode]: {
          known: newKnown,
          lastReviewedAt: new Date().toISOString()
        }
      });
    }
    handleNext();
  };

  const handleStillLearning = () => {
    // If we mark it "still learning" and it was previously known, remove it from known
    const actualIndex = isReviewMode 
      ? currentDeck.findIndex(c => c.front === activeDeck[currentIndex].front) 
      : currentIndex;
      
    if (currentKnown.includes(actualIndex)) {
      const newKnown = currentKnown.filter(idx => idx !== actualIndex);
      saveProgress({
        ...progress,
        [deckMode]: {
          known: newKnown,
          lastReviewedAt: new Date().toISOString()
        }
      });
    }
    handleNext();
  };

  const startReviewUnknowns = () => {
    setIsReviewMode(true);
  };

  const startOver = () => {
    setIsReviewMode(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };
  
  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset your mastery progress for this deck?")) {
      saveProgress({
        ...progress,
        [deckMode]: { known: [], lastReviewedAt: new Date().toISOString() }
      });
      setIsReviewMode(false);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  if (!termCards.length && !conceptCards.length) {
    return (
      <div className="flashcard-wrapper">
        <div className="fc-empty">No flashcards available. Save a note with terms and concepts first.</div>
      </div>
    );
  }

  return (
    <div className="flashcard-wrapper">
      
      {/* Top Mastery Bar */}
      {currentDeck.length > 0 && (
        <div className="fc-mastery-bar">
          <div className="fc-mastery-text">
            {masteryPercent}% Mastered <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>({currentKnown.length} of {currentDeck.length})</span>
          </div>
          <div className="fc-mastery-track">
            <div className="fc-mastery-fill" style={{ width: `${masteryPercent}%` }}></div>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="deck-mode-toggle">
        <button 
          className={`deck-mode-btn ${deckMode === 'terms' ? 'active' : ''}`}
          onClick={() => setDeckMode('terms')}
          disabled={termCards.length === 0}
        >
          Terms ({termCards.length})
        </button>
        <button 
          className={`deck-mode-btn ${deckMode === 'concepts' ? 'active' : ''}`}
          onClick={() => setDeckMode('concepts')}
          disabled={conceptCards.length === 0}
        >
          Concepts ({conceptCards.length})
        </button>
      </div>

      {allMastered && isReviewMode ? (
        <div className="fc-complete">
          <PartyPopper size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
          <h2>All Mastered!</h2>
          <p>You've successfully learned all the {deckMode} in this deck.</p>
          <div className="fc-complete-actions">
            <button className="fc-btn-learn" onClick={startOver}>Review All Cards</button>
            <button className="fc-btn-learn" onClick={resetProgress} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Reset Progress</button>
          </div>
        </div>
      ) : isComplete ? (
        <div className="fc-complete">
          <h2>Great job!</h2>
          <p>You've gone through all the cards in this {isReviewMode ? 'review session' : 'deck'}.</p>
          
          <div className="fc-complete-actions">
            {currentKnown.length < currentDeck.length && (
              <button className="fc-btn-know" onClick={startReviewUnknowns} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} /> Review remaining {currentDeck.length - currentKnown.length}
              </button>
            )}
            <button className="fc-btn-learn" onClick={startOver} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={16} /> Start Over
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="fc-progress-bar">
            <div 
              className="fc-progress-fill" 
              style={{ width: `${(currentIndex / totalCards) * 100}%` }}
            ></div>
          </div>
          <div className="fc-counter">
            Card {currentIndex + 1} of {totalCards} {isReviewMode && <span style={{ color: 'var(--accent)' }}>(Review Mode)</span>}
          </div>

          <div className="fc-card-scene" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`fc-card-inner ${isFlipped ? 'flipped' : ''}`}>
              <div className="fc-card-face fc-card-front">
                <div className="fc-term">{activeDeck[currentIndex].front}</div>
                <div className="fc-flip-hint">Tap to see {deckMode === 'terms' ? 'definition' : 'explanation'}</div>
              </div>
              <div className="fc-card-face fc-card-back">
                <div className="fc-definition">{activeDeck[currentIndex].back}</div>
              </div>
            </div>
          </div>

          <div className="fc-actions">
            <button className="fc-btn-learn" onClick={handleStillLearning}>
              Still learning
            </button>
            <button className="fc-btn-know" onClick={handleKnow} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
