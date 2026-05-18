import React, { useState, useMemo } from 'react';
import { BookOpen, Brain, ChevronRight, Eye, EyeOff, Check, X, RotateCcw, Trophy } from 'lucide-react';
import Flashcard from './Flashcard';
import Quiz from './Quiz';
import '../styles/revision.css';

/**
 * RevisionMode — A guided, step-by-step revision flow that sequences
 * existing study components (recap, flashcards, quiz) into a focused session.
 * 
 * Steps:
 *   1. Quick Recap (read & absorb)
 *   2. Concept Recall (active recall — cover/reveal)
 *   3. Flashcard Sprint (existing Flashcard component)
 *   4. Quiz Challenge (existing Quiz component)
 *   5. Session Summary (stats from the session)
 */

const STEPS = ['recap', 'concepts', 'flashcards', 'quiz', 'summary'];

const STEP_LABELS = {
  recap: 'Read & Absorb',
  concepts: 'Active Recall',
  flashcards: 'Flashcard Sprint',
  quiz: 'Quiz Challenge',
  summary: 'Session Complete'
};

export default function RevisionMode({ note, termCards = [], conceptCards = [] }) {
  const [currentStep, setCurrentStep] = useState('recap');
  const [conceptIndex, setConceptIndex] = useState(0);
  const [conceptRevealed, setConceptRevealed] = useState(false);
  const [conceptScore, setConceptScore] = useState({ got: 0, missed: 0 });
  const [quizScore, setQuizScore] = useState(null);

  // Determine which steps are available based on note data
  const availableSteps = useMemo(() => {
    const steps = [];
    if (note.quick_recap) steps.push('recap');
    if (note.key_concepts && note.key_concepts.length > 0) steps.push('concepts');
    if (termCards.length > 0 || conceptCards.length > 0) steps.push('flashcards');
    steps.push('quiz'); // Quiz can be generated on the fly, so always available
    steps.push('summary'); // Always available
    return steps;
  }, [note, termCards, conceptCards]);

  const currentStepIndex = availableSteps.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < availableSteps.length) {
      setCurrentStep(availableSteps[nextIndex]);
    }
  };

  const skipStep = () => {
    goToNextStep();
  };

  const restartSession = () => {
    setCurrentStep(availableSteps[0]);
    setConceptIndex(0);
    setConceptRevealed(false);
    setConceptScore({ got: 0, missed: 0 });
    setQuizScore(null);
  };

  // Step progress dots
  const renderProgress = () => (
    <div className="revision-progress">
      {availableSteps.map((step, i) => {
        const isCurrent = step === currentStep;
        const isCompleted = i < currentStepIndex;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div className={`revision-step-connector ${isCompleted ? 'completed' : ''}`} />
            )}
            <div
              className={`revision-step-dot ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              title={STEP_LABELS[step]}
            />
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Step 1: Quick Recap ───
  const renderRecap = () => (
    <div className="revision-step">
      <div className="revision-step-header">
        <div className="revision-step-label">Step {currentStepIndex + 1} of {availableSteps.length}</div>
        <h2 className="revision-step-title">Read & Absorb</h2>
        <p className="revision-step-subtitle">Read through the recap to prime your memory before testing</p>
      </div>

      <div className="revision-recap-card">
        {note.quick_recap}
      </div>

      <div className="revision-actions">
        <button className="revision-btn revision-btn-primary" onClick={goToNextStep}>
          I've reviewed this <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // ─── Step 2: Concept Recall ───
  const renderConceptRecall = () => {
    const concepts = note.key_concepts || [];
    const current = concepts[conceptIndex];
    const isLast = conceptIndex >= concepts.length - 1;

    const handleGotIt = () => {
      setConceptScore(prev => ({ ...prev, got: prev.got + 1 }));
      advanceConcept(isLast);
    };

    const handleMissed = () => {
      setConceptScore(prev => ({ ...prev, missed: prev.missed + 1 }));
      advanceConcept(isLast);
    };

    const advanceConcept = (last) => {
      if (last) {
        goToNextStep();
      } else {
        setConceptIndex(prev => prev + 1);
        setConceptRevealed(false);
      }
    };

    if (!current) return null;

    return (
      <div className="revision-step">
        <div className="revision-step-header">
          <div className="revision-step-label">Step {currentStepIndex + 1} of {availableSteps.length}</div>
          <h2 className="revision-step-title">Active Recall</h2>
          <p className="revision-step-subtitle">Try to recall the explanation before revealing it</p>
        </div>

        <div className="concept-recall-counter">
          Concept {conceptIndex + 1} of {concepts.length}
        </div>

        <div className="concept-recall-card">
          <div className="concept-recall-name">{current.concept}</div>

          {!conceptRevealed ? (
            <>
              <div className="concept-recall-prompt">
                Can you explain this concept? Think about it, then reveal.
              </div>
              <button
                className="revision-btn revision-btn-primary"
                onClick={() => setConceptRevealed(true)}
              >
                <Eye size={16} /> Reveal Explanation
              </button>
            </>
          ) : (
            <>
              <div className="concept-reveal-content">
                <p><strong>Explanation:</strong> {current.explanation}</p>
                {current.why_it_matters && (
                  <p><em>Why it matters: {current.why_it_matters}</em></p>
                )}
              </div>
              <div className="revision-actions" style={{ marginTop: '16px' }}>
                <button className="revision-btn revision-btn-success" onClick={handleGotIt}>
                  <Check size={16} /> I knew this
                </button>
                <button className="revision-btn revision-btn-danger" onClick={handleMissed}>
                  <X size={16} /> Didn't recall
                </button>
              </div>
            </>
          )}
        </div>

        <div className="revision-actions" style={{ marginTop: '24px' }}>
          <button className="revision-btn revision-btn-primary" onClick={goToNextStep}>
            Continue to {
              availableSteps[currentStepIndex + 1] === 'flashcards' ? 'Flashcards' :
              availableSteps[currentStepIndex + 1] === 'quiz' ? 'Quiz' : 'Summary'
            } <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ─── Step 3: Flashcard Sprint ───
  const renderFlashcards = () => (
    <div className="revision-step">
      <div className="revision-step-header">
        <div className="revision-step-label">Step {currentStepIndex + 1} of {availableSteps.length}</div>
        <h2 className="revision-step-title">Flashcard Sprint</h2>
        <p className="revision-step-subtitle">Review your terms and concepts with flashcards</p>
      </div>

      <Flashcard
        noteId={note._id}
        termCards={termCards}
        conceptCards={conceptCards}
        initialProgress={note.flashcard_progress}
      />

      <div className="revision-actions" style={{ marginTop: '24px' }}>
        <button className="revision-btn revision-btn-primary" onClick={goToNextStep}>
          Continue to Quiz <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // ─── Step 4: Quiz Challenge ───
  const renderQuiz = () => (
    <div className="revision-step">
      <div className="revision-step-header">
        <div className="revision-step-label">Step {currentStepIndex + 1} of {availableSteps.length}</div>
        <h2 className="revision-step-title">Quiz Challenge</h2>
        <p className="revision-step-subtitle">Test your understanding with multiple choice questions</p>
      </div>

      <Quiz
        noteId={note._id}
        subject={note.subject_detected || note.title}
        cachedQuizData={note.quiz_data}
      />

      <div className="revision-actions" style={{ marginTop: '24px' }}>
        <button className="revision-btn revision-btn-primary" onClick={goToNextStep}>
          Finish Session <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // ─── Step 5: Session Summary ───
  const renderSummary = () => {
    const totalConcepts = (note.key_concepts || []).length;
    const conceptsReviewed = conceptScore.got + conceptScore.missed;
    const conceptPct = totalConcepts > 0 ? Math.round((conceptScore.got / totalConcepts) * 100) : null;

    return (
      <div className="revision-step">
        <div className="revision-summary">
          <div className="revision-summary-icon">
            <Trophy size={48} style={{ color: '#22c55e' }} />
          </div>
          <h2>Revision Complete!</h2>
          <p>Great work on reviewing {note.subject_detected || note.title || 'this material'}.</p>

          <div className="revision-stats">
            {conceptsReviewed > 0 && (
              <div className="revision-stat-card">
                <div className="revision-stat-value" style={{ color: '#22c55e' }}>
                  {conceptScore.got}/{totalConcepts}
                </div>
                <div className="revision-stat-label">Concepts Recalled</div>
              </div>
            )}

            {conceptPct !== null && (
              <div className="revision-stat-card">
                <div className="revision-stat-value" style={{
                  color: conceptPct >= 70 ? '#22c55e' : conceptPct >= 50 ? '#eab308' : '#ef4444'
                }}>
                  {conceptPct}%
                </div>
                <div className="revision-stat-label">Recall Accuracy</div>
              </div>
            )}

            <div className="revision-stat-card">
              <div className="revision-stat-value" style={{ color: 'var(--accent-color)' }}>
                {availableSteps.length - 1}
              </div>
              <div className="revision-stat-label">Steps Completed</div>
            </div>
          </div>

          <div className="revision-actions">
            <button className="revision-btn revision-btn-primary" onClick={restartSession}>
              <RotateCcw size={16} /> Revise Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ───
  const stepRenderers = {
    recap: renderRecap,
    concepts: renderConceptRecall,
    flashcards: renderFlashcards,
    quiz: renderQuiz,
    summary: renderSummary
  };

  return (
    <div className="revision-wrapper">
      {renderProgress()}
      {stepRenderers[currentStep]?.() || renderSummary()}
    </div>
  );
}
