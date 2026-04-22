import React, { useState, useEffect } from 'react';
import '../styles/Flashcard.css';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcard({ termCards = [], conceptCards = [] }) {
  const [deckMode, setDeckMode] = useState('terms');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [reviewMode, setReviewMode] = useState(false); // true = only unknowns
  const [deck, setDeck] = useState([]); // Active deck based on mode

  // Build active deck from mode
  useEffect(() => {
    const rawCards = deckMode === 'terms' ? termCards : conceptCards;
    setDeck(rawCards);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReviewMode(false);
  }, [deckMode, termCards, conceptCards]);

  const activeDeck = reviewMode
    ? deck.filter((_, i) => !known.has(i))
    : deck;

  const total = activeDeck.length;
  const current = activeDeck[currentIndex];

  const handleFlip = () => setFlipped(f => !f);

  const advance = () => {
    setFlipped(false);
    setCurrentIndex(i => (i + 1 < total ? i + 1 : i));
  };

  const handleKnow = () => {
    // Find original index in deck
    const originalIndex = deck.indexOf(current);
    setKnown(prev => new Set(prev).add(originalIndex));
    advance();
  };

  const handleStillLearning = () => {
    advance();
  };

  const handleReviewUnknowns = () => {
    setReviewMode(true);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleRestartFull = () => {
    setReviewMode(false);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
  };

  const switchMode = (m) => {
    if (m === deckMode) return;
    setDeckMode(m);
  };

  if (termCards.length === 0 && conceptCards.length === 0) {
    return (
      <div className="fc-empty">
        <p>No flashcard content available for this note.</p>
      </div>
    );
  }

  const sourceCards = deckMode === 'terms' ? termCards : conceptCards;
  if (sourceCards.length === 0) {
    return (
      <div className="flashcard-wrapper">
        <div className="deck-mode-toggle">
          <button className={`deck-mode-btn ${deckMode === 'terms' ? 'active' : ''}`} onClick={() => switchMode('terms')}>Key Terms</button>
          <button className={`deck-mode-btn ${deckMode === 'concepts' ? 'active' : ''}`} onClick={() => switchMode('concepts')}>Key Concepts</button>
        </div>
        <div className="fc-empty"><p>No cards in this deck.</p></div>
      </div>
    );
  }

  const isComplete = currentIndex >= total || (currentIndex === total - 1 && (known.has(deck.indexOf(current)) || activeDeck.length === 0));
  // Simpler: complete when we've gone through all
  const isDone = currentIndex >= total;

  const knownCount = known.size;
  const totalDeck = deck.length;

  if (isDone) {
    return (
      <div className="flashcard-wrapper">
        <div className="deck-mode-toggle">
          <button className={`deck-mode-btn ${deckMode === 'terms' ? 'active' : ''}`} onClick={() => switchMode('terms')}>Key Terms</button>
          <button className={`deck-mode-btn ${deckMode === 'concepts' ? 'active' : ''}`} onClick={() => switchMode('concepts')}>Key Concepts</button>
        </div>
        <div className="fc-complete">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
          <h2>Deck Complete!</h2>
          <p>Known: {knownCount} / {totalDeck}</p>
          <div className="fc-complete-actions">
            {knownCount < totalDeck && (
              <button className="fc-btn-learn" onClick={handleReviewUnknowns}>
                Review Unknowns ↺
              </button>
            )}
            <button className="fc-btn-know" onClick={handleRestartFull}>
              Restart Full Deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = total > 0 ? ((currentIndex) / total) * 100 : 0;

  return (
    <div className="flashcard-wrapper">
      <div className="deck-mode-toggle">
        <button className={`deck-mode-btn ${deckMode === 'terms' ? 'active' : ''}`} onClick={() => switchMode('terms')}>Key Terms</button>
        <button className={`deck-mode-btn ${deckMode === 'concepts' ? 'active' : ''}`} onClick={() => switchMode('concepts')}>Key Concepts</button>
      </div>

      <div className="fc-progress-bar">
        <div className="fc-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="fc-counter">
        Card {currentIndex + 1} of {total}
        {reviewMode && <span style={{ marginLeft: 8, color: '#f59e0b' }}>(Reviewing unknowns)</span>}
      </div>

      <div className="fc-card-scene" onClick={handleFlip}>
        <div className={`fc-card-inner ${flipped ? 'flipped' : ''}`}>
          <div className="fc-card-face fc-card-front">
            <div className="fc-term">{current?.front}</div>
            <div className="fc-flip-hint">Click to flip</div>
          </div>
          <div className="fc-card-face fc-card-back">
            <div className="fc-definition">{current?.back}</div>
          </div>
        </div>
      </div>

      <div className="fc-actions">
        <button className="fc-btn-learn" onClick={handleStillLearning}>Still learning ↺</button>
        <button className="fc-btn-know" onClick={handleKnow}>Know it ✓</button>
      </div>
    </div>
  );
}
