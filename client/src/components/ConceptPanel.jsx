import React, { useState, useEffect } from 'react';
import { explainConcept } from '../services/api';
import '../styles/ConceptPanel.css';

export default function ConceptPanel({ term, context, onClose, onTermChange }) {
  const [level, setLevel] = useState("simple");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger animation open on mount
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!term) return;
    let isMounted = true;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await explainConcept(term, context, level);
        if (isMounted) setData(response);
      } catch (err) {
        console.error("Concept explanation error:", err);
        if (isMounted) setError(err.message || "Failed to fetch explanation. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExplanation();

    return () => { isMounted = false; };
  }, [term, context, level]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for slide out animation before unmounting
  };

  return (
    <div className={`concept-panel ${isOpen ? 'open' : ''}`}>
      <div className="cp-header">
        <h2 className="cp-title" style={{ maxWidth: '80%', overflowWrap: 'break-word' }}>{term}</h2>
        <button className="cp-close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="cp-toggle-group">
        <button 
          className={`cp-toggle-btn ${level === 'simple' ? 'active' : ''}`}
          onClick={() => setLevel('simple')}
        >
          Simple
        </button>
        <button 
          className={`cp-toggle-btn ${level === 'technical' ? 'active' : ''}`}
          onClick={() => setLevel('technical')}
        >
          Technical
        </button>
      </div>

      <div style={{ flex: 1, marginTop: '24px', position: 'relative' }}>
        {loading && (
          <div className="cp-loader">
            <div className="cp-spinner"></div>
            <span>Analyzing concept...</span>
          </div>
        )}

        {error && (
          <div className="cp-error">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="cp-content">
            {data.one_liner && (
              <div className="cp-one-liner">{data.one_liner}</div>
            )}
            
            {data.full_explanation && (
              <div className="cp-explanation">
                {data.full_explanation.split('\n').map((paragraph, index) => (
                   paragraph.trim() ? <p key={index} style={{ marginBottom: '12px' }}>{paragraph}</p> : null
                ))}
              </div>
            )}

            {data.real_world_example && (
              <div className="cp-box">
                <div className="cp-box-title">Real World Example</div>
                <div className="cp-box-content">{data.real_world_example}</div>
              </div>
            )}

            {data.common_misconception && (
              <div className="cp-box misconception">
                <div className="cp-box-title">Common Misconception</div>
                <div className="cp-box-content">{data.common_misconception}</div>
              </div>
            )}

            {data.connects_to && data.connects_to.length > 0 && (
              <div className="cp-tags-section">
                <div className="cp-tags-title">Explore Next</div>
                <div className="cp-tags-container">
                  {data.connects_to.map((connectsTerm, i) => (
                    <span 
                      key={i} 
                      className="cp-tag" 
                      onClick={() => onTermChange(connectsTerm)}
                    >
                      {connectsTerm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
