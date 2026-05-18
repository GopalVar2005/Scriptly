import React from 'react';
import { Check, Save, Lightbulb } from 'lucide-react';

export default function SummaryViewer({ 
  summaryData, summaryRef, handleTextSelection, 
  handleSaveNote, noteSaved, handleStartOver, setSelectedTerm 
}) {
  return (
    <div 
      className="step-summary" 
      ref={summaryRef} 
      onMouseUp={handleTextSelection} 
      onTouchEnd={handleTextSelection}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
           <span style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
           }}>
             {summaryData.subject_detected || "Study Guide"}
           </span>
           <h2 style={{ color: 'var(--text-main)', marginTop: '0.5rem' }}>Your Study Guide</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary-solid" onClick={handleSaveNote} disabled={noteSaved}>
              {noteSaved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Note</>}
            </button>
            <button className="btn-ghost-solid" onClick={handleStartOver}>Start Over</button>
          </div>
          {!noteSaved && (
            <p className="quiz-unlock-hint"><Save size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Save this note to unlock Flashcards & Quiz</p>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent, #3B82F6)', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Lightbulb size={22} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
        <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '1rem' }}>
          <strong>Pro tip:</strong> Highlight any text or tap on terms below to instantly explore them!
        </p>
      </div>

      <div className="content-card highlight" style={{ marginBottom: '1.5rem' }}>
        <div className="section-label">QUICK RECAP</div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
           {summaryData.quick_recap}
        </p>
      </div>

      {summaryData.key_concepts && summaryData.key_concepts.length > 0 && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
           <div className="section-label">KEY CONCEPTS</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summaryData.key_concepts.map((kc, i) => (
                <details key={i} style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)'
                }}>
                  <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-main)', outline: 'none' }}>
                     {kc.concept}
                  </summary>
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--accent)' }}>
                     <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><strong>Explanation:</strong> {kc.explanation}</p>
                     <p style={{ color: 'var(--text-secondary)' }}><strong>Why it matters:</strong> {kc.why_it_matters}</p>
                  </div>
                </details>
              ))}
           </div>
        </div>
      )}

      {summaryData.important_to_remember && summaryData.important_to_remember.length > 0 && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
           <div className="section-label">IMPORTANT TO REMEMBER</div>
           <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {summaryData.important_to_remember.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
              ))}
           </ul>
        </div>
      )}

      {summaryData.key_terms && Object.keys(summaryData.key_terms).length > 0 && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
           <div className="section-label">GLOSSARY</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(summaryData.key_terms).map(([term, def], i) => (
                <div key={i}>
                  <strong 
                    style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setSelectedTerm(term)}
                  >
                    {term}
                  </strong>: <span style={{ color: 'var(--text-secondary)' }}>{def}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {summaryData.potential_exam_questions && summaryData.potential_exam_questions.length > 0 && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
           <div className="section-label">POTENTIAL EXAM QUESTIONS</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summaryData.potential_exam_questions.map((pq, i) => (
                <details key={i} style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)'
                }}>
                  <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-main)', outline: 'none' }}>
                     Q: {pq.question}
                  </summary>
                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                     <em>Hint: {pq.hint}</em>
                  </div>
                </details>
              ))}
           </div>
        </div>
      )}

      {summaryData.memory_anchors && summaryData.memory_anchors.length > 0 && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
           <div className="section-label">MEMORY ANCHORS</div>
           <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {summaryData.memory_anchors.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
              ))}
           </ul>
        </div>
      )}

      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <div className="section-label">KEYWORDS</div>
        <div className="tags-row">
          {summaryData.keywords && summaryData.keywords.map((kw, i) => (
            <span key={i} className="tag-pill">{kw}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
