import React from 'react';
import { CheckCircle, AudioLines } from 'lucide-react';

const MODES = [
  { id: 'first_pass', title: 'First Pass', desc: 'Just tell me what this was about' },
  { id: 'deep_study', title: 'Deep Study', desc: 'Full breakdown with concept explanations' },
  { id: 'exam_prep', title: 'Exam Prep', desc: 'Focus on what could be tested' },
  { id: 'quick_refresh', title: 'Quick Refresh', desc: 'Essentials only, keep it short' }
];

export default function TranscriptEditor({ 
  voiceText, setVoiceText, wordCount, 
  youtubeSource, mode, setMode, 
  handleStartOver, handleSummarize 
}) {
  return (
    <div className="step-transcript">
      <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Review Transcript</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        You may edit the transcript below before generating study material.
      </p>

      {youtubeSource && (
        <p className="youtube-source-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
          {youtubeSource === 'captions'
            ? <><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Using video captions</>
            : <><AudioLines size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Captions unavailable — transcribed from audio</>}
        </p>
      )}

      <textarea 
        value={voiceText}
        onChange={(e) => setVoiceText(e.target.value)}
        style={{
          width: '100%',
          height: '250px',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-main)',
          fontSize: '1rem',
          fontFamily: 'inherit',
          lineHeight: '1.6',
          resize: 'vertical',
          marginBottom: '0.5rem'
        }}
      />
      <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Word count: {wordCount} {wordCount < 20 && <span style={{color: '#e63946'}}>(Need at least 20 words)</span>}
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Select Summarization Mode</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {MODES.map(m => (
          <div 
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: mode === m.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
              backgroundColor: mode === m.id ? 'rgba(58, 134, 255, 0.05)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <h4 style={{ marginBottom: '0.5rem', color: mode === m.id ? 'var(--accent)' : 'var(--text-main)' }}>{m.title}</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button className="btn-ghost-solid" onClick={handleStartOver}>
          Start Over
        </button>
        <button 
          className="btn-primary-solid" 
          onClick={handleSummarize}
          disabled={wordCount < 20}
          style={{ opacity: wordCount < 20 ? 0.5 : 1, cursor: wordCount < 20 ? 'not-allowed' : 'pointer' }}
        >
          Summarize &rarr;
        </button>
      </div>
    </div>
  );
}
