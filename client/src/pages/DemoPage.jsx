import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SmartCTA from '../components/SmartCTA';
import { ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Flashcard from '../components/Flashcard';
import Quiz from '../components/Quiz';
import { DEMO_SUMMARY, DEMO_FLASHCARD_TERMS, DEMO_FLASHCARD_CONCEPTS, DEMO_QUIZ_DATA } from '../data/demoData';
import '../styles/workspace.css';
import '../styles/study-tabs.css';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('summary');

  const summaryData = DEMO_SUMMARY;

  return (
    <div className="workspace-page">
      <Navbar />

      <div className="workspace-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Demo Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 112, 243, 0.1), rgba(56, 189, 248, 0.05))',
          border: '1px solid rgba(0, 112, 243, 0.25)',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-color)' }} />
            <span style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              <strong>Demo Preview</strong> — This is a sample study guide generated from a CS lecture.
            </span>
          </div>
          <SmartCTA style={{
            background: 'var(--accent-color)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
          }}>
            Create your own <ArrowRight size={14} />
          </SmartCTA>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {summaryData.subject_detected}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
            Sample Study Guide
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Generated from a YouTube lecture on how the internet works
          </p>
        </div>

        {/* Tab Bar */}
        <div className="study-tab-bar">
          <button
            className={activeTab === 'summary' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('summary')}
          >Summary</button>
          <button
            className={activeTab === 'flashcards' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('flashcards')}
          >Flashcards</button>
          <button
            className={activeTab === 'quiz' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('quiz')}
          >Quiz</button>
        </div>

        {/* Tab Content */}
        <div style={{ paddingBottom: '32px' }}>

          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent, #3B82F6)', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Lightbulb size={22} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '1rem' }}>
                  <strong>Pro tip:</strong> In the real app, you can highlight any text to get instant AI explanations!
                </p>
              </div>

              {/* Quick Recap */}
              <div className="content-card highlight" style={{ marginBottom: '1.5rem' }}>
                <div className="section-label">QUICK RECAP</div>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {summaryData.quick_recap}
                </p>
              </div>

              {/* Key Concepts */}
              {summaryData.key_concepts.length > 0 && (
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

              {/* Important to Remember */}
              {summaryData.important_to_remember.length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">IMPORTANT TO REMEMBER</div>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {summaryData.important_to_remember.map((item, i) => (
                      <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Glossary */}
              {Object.keys(summaryData.key_terms).length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">GLOSSARY</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(summaryData.key_terms).map(([term, def], i) => (
                      <div key={i}>
                        <strong style={{ color: 'var(--accent)' }}>{term}</strong>: <span style={{ color: 'var(--text-secondary)' }}>{def}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Questions */}
              {summaryData.potential_exam_questions.length > 0 && (
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

              {/* Memory Anchors */}
              {summaryData.memory_anchors.length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">MEMORY ANCHORS</div>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {summaryData.memory_anchors.map((item, i) => (
                      <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keywords */}
              <div className="content-card">
                <div className="section-label">KEYWORDS</div>
                <div className="tags-row">
                  {summaryData.keywords.map((kw, i) => (
                    <span key={i} className="tag-pill">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <Flashcard termCards={DEMO_FLASHCARD_TERMS} conceptCards={DEMO_FLASHCARD_CONCEPTS} />
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <Quiz noteId="demo" subject={summaryData.subject_detected} cachedQuizData={DEMO_QUIZ_DATA} />
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          borderTop: '1px solid var(--border-color)',
          marginTop: '1rem'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.4rem' }}>Like what you see?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
            Create your own study guides from any lecture or video.
          </p>
          <SmartCTA className="btn primary" style={{ textDecoration: 'none' }}>
            Get started free <ArrowRight size={16} style={{ marginLeft: '4px' }} />
          </SmartCTA>
        </div>
      </div>

      <Footer />
    </div>
  );
}
