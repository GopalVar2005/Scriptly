import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNoteById, deleteNote, updateNote } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ConceptPanel from '../components/ConceptPanel';
import Flashcard from '../components/Flashcard';
import Quiz from '../components/Quiz';
import '../styles/workspace.css';
import '../styles/study-tabs.css';

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Study Hub state
  const [activeTab, setActiveTab] = useState("summary"); // summary | flashcards | quiz | notes
  
  // Concept panel states
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0 });
  const [pendingTerm, setPendingTerm] = useState(null);
  const summaryRef = useRef(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editKeywords, setEditKeywords] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const data = await getNoteById(id);
        setNote(data);
        setEditTitle(data.title || '');
        setEditSummary(data.summary || '');
        setEditKeywords(data.keywords ? data.keywords.join(', ') : '');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const isAuthError = error && (error.toLowerCase().includes('login') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('authentication'));

  useEffect(() => {
    const handleScroll = () => {
      if (tooltipState.visible) {
        setTooltipState({ visible: false, x: 0, y: 0 });
        setPendingTerm(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tooltipState.visible]);

  // Prevent background scroll when mobile bottom sheet is open
  useEffect(() => {
    if (selectedTerm && window.innerWidth <= 768) {
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'hidden';
    } else {
      document.body.style.overflowX = 'auto';
      document.body.style.overflowY = 'auto';
    }
  }, [selectedTerm]);

  // Hide concept panel when switching tabs
  useEffect(() => {
    if (activeTab !== "summary") {
      setSelectedTerm(null);
    }
  }, [activeTab]);

  const handleTextSelection = () => {
    if (activeTab !== "summary") return;
    
    const text = window.getSelection().toString().trim();
    if (!text || text.length > 150) {
      if (tooltipState.visible) {
        setTooltipState({ visible: false, x: 0, y: 0 });
        setPendingTerm(null);
      }
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      let tooltipX = rect.left + rect.width / 2;
      tooltipX = Math.max(80, Math.min(tooltipX, window.innerWidth - 80));

      setTooltipState({
        visible: true,
        x: tooltipX,
        y: rect.top + window.scrollY - 44
      });
      setPendingTerm(text);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(id);
      navigate('/notes');
    } catch (err) {
      alert("Failed to delete note: " + err.message);
    }
  };

  const handleExportNote = () => {
    if (!note) return;
    const content = `Title: ${note.title}

Summary:
${note.summary || note.quick_recap || ''}

Key Points:
${note.keywords ? note.keywords.join(', ') : ''}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || 'Note'}_${new Date(note.createdAt).toLocaleDateString().replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        title: editTitle,
        summary: editSummary,
        keywords: editKeywords.split(',').map(k => k.trim()).filter(k => k)
      };
      const updatedNote = await updateNote(id, updatedData);
      setNote(updatedNote);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update note: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(note.title || '');
    setEditSummary(note.summary || '');
    setEditKeywords(note.keywords ? note.keywords.join(', ') : '');
    setIsEditing(false);
  };

  if (isLoading) return (
    <div className="workspace-page">
      <Navbar />
      <div className="workspace-container" style={{ paddingTop: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="workspace-page">
      <Navbar />
      <div className="workspace-container" style={{ paddingTop: '40px' }}>
        {isAuthError ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '16px' }}>Please login to continue</p>
            <button
              onClick={() => navigate('/login', { state: { from: `/notes/${id}` } })}
              style={{
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >Sign in</button>
          </div>
        ) : (
          <p style={{ color: '#e63946' }}>Error: {error}</p>
        )}
      </div>
      <Footer />
    </div>
  );

  if (!note) return (
    <div className="workspace-page">
      <Navbar />
      <div className="workspace-container" style={{ paddingTop: '40px', color: 'var(--text-muted)' }}>Note not found.</div>
      <Footer />
    </div>
  );

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-color-elevated)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-main)',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    marginBottom: '8px',
    fontSize: '0.95rem'
  };

  // Prepare cards for flashcards
  const termCards = note.key_terms ? Object.entries(note.key_terms).map(([front, back]) => ({ front, back })) : [];
  const conceptCards = note.key_concepts ? note.key_concepts.map(kc => ({ front: kc.concept, back: kc.explanation + " — " + kc.why_it_matters })) : [];

  return (
    <div className="workspace-page">
      <style>{`
        .summary-wrapper {
          transition: margin-right 0.3s ease, padding-right 0.3s ease;
        }
        @media (min-width: 769px) {
          .summary-wrapper.panel-open {
            padding-right: 380px;
          }
        }
      `}</style>
      <Navbar />

      <div className={`workspace-container summary-wrapper ${selectedTerm && activeTab === "summary" ? 'panel-open' : ''}`}>
        {/* Top actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingTop: '20px' }}>
          <Link to="/notes" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to Notes
          </Link>
        </div>

        {/* Title */}
        {isEditing ? (
          <input 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ ...inputStyle, fontSize: '2rem', fontWeight: '700', padding: '16px' }}
            placeholder="Note Title"
          />
        ) : (
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1.2', marginBottom: '8px' }}>
            {note.title || 'Untitled Note'}
          </h1>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '40px' }}>
          {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Study Hub Tab Bar */}
        <div className="study-tab-bar">
          <button 
            className={(activeTab === "summary" || !activeTab) ? "tab active" : "tab"}
            onClick={() => setActiveTab("summary")}
          >Summary</button>
          <button 
            className={activeTab === "flashcards" ? "tab active" : "tab"}
            onClick={() => setActiveTab("flashcards")}
          >Flashcards</button>
          <button 
            className={activeTab === "quiz" ? "tab active" : "tab"}
            onClick={() => setActiveTab("quiz")}
          >Quiz 🎯</button>
        </div>

        <div style={{ paddingBottom: '32px' }}>
          {/* TAB CONTENT - SUMMARY */}
          {activeTab === "summary" && (
            <div ref={summaryRef} onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection}>
              
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent, #3B82F6)', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '1rem' }}>
                  <strong>Pro tip:</strong> Highlight any text or tap on terms below to instantly explore them!
                </p>
              </div>

              {note.quick_recap && (
                <div className="content-card highlight" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">QUICK RECAP</div>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {note.quick_recap}
                  </p>
                </div>
              )}

              {/* Legacy summary fallback if no structured data */}
              {!note.quick_recap && note.summary && (
                <div className="content-card highlight" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SUMMARY</span>
                  </div>
                  <div className="summary-text">
                    {isEditing ? (
                      <textarea 
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
                        placeholder="Summary..."
                      />
                    ) : (
                      note.summary.split('\n').map((line, idx) => (
                        <p key={idx} style={{ marginBottom: '8px' }}>{line}</p>
                      ))
                    )}
                  </div>
                </div>
              )}

              {note.key_concepts && note.key_concepts.length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">KEY CONCEPTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {note.key_concepts.map((kc, i) => (
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

              {note.important_to_remember && note.important_to_remember.length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">IMPORTANT TO REMEMBER</div>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {note.important_to_remember.map((item, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                      ))}
                  </ul>
                </div>
              )}

              {note.key_terms && Object.keys(note.key_terms).length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">GLOSSARY</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(note.key_terms).map(([term, def], i) => (
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

              {note.memory_anchors && note.memory_anchors.length > 0 && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-label">MEMORY ANCHORS</div>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {note.memory_anchors.map((item, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>
                      ))}
                  </ul>
                </div>
              )}

              {note.keywords && note.keywords.length > 0 && (
                <div className="content-card">
                  <div className="section-label">KEY POINTS</div>
                  <div className="tags-row">
                    {isEditing ? (
                      <input 
                        value={editKeywords}
                        onChange={(e) => setEditKeywords(e.target.value)}
                        style={inputStyle}
                        placeholder="Comma separated keywords..."
                      />
                    ) : (
                      note.keywords.map((kw, i) => (
                        <span key={i} className="tag-pill" style={{ cursor: 'pointer' }} onClick={() => setSelectedTerm(kw)}>{kw}</span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Transcript (Read Only) */}
              <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <div className="section-label">FULL TRANSCRIPT {isEditing && <span style={{ textTransform: 'none', color: 'var(--text-muted)', marginLeft: '8px' }}>(Read only)</span>}</div>
                <div className="transcript-text">{note.transcription}</div>
              </div>
            </div>
          )}

          {/* TAB CONTENT - FLASHCARDS */}
          {activeTab === "flashcards" && (
            <Flashcard cards={[]} termCards={termCards} conceptCards={conceptCards} />
          )}

          {/* TAB CONTENT - QUIZ */}
          {activeTab === "quiz" && (
            <Quiz 
              noteId={note._id} 
              subject={note.subject_detected || note.title} 
              cachedQuizData={note.quiz_data} 
            />
          )}
        </div>

        {/* Actions - Bottom */}
        {!isEditing && activeTab === "summary" && (
          <div className="action-row">
            <button className="btn-ghost-solid" onClick={handleExportNote}>
              Export as TXT
            </button>
            <button className="btn-ghost-solid" onClick={handleDelete} style={{ color: '#e63946', borderColor: 'rgba(230,57,70,0.3)' }}>
              Delete note
            </button>
          </div>
        )}

        {/* FLOATING TOOLTIP */}
        {tooltipState.visible && (
          <button 
            style={{
              position: 'absolute',
              left: tooltipState.x,
              top: tooltipState.y,
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--accent, #3B82F6)',
              color: 'white',
              borderRadius: '999px',
              fontSize: '13px',
              padding: '6px 14px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 1050
            }}
            onClick={() => {
              setSelectedTerm(pendingTerm);
              setTooltipState({ visible: false, x: 0, y: 0 });
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent clearing selection
          >
            💡 Explain this
          </button>
        )}

        {/* CONCEPT PANEL */}
        {selectedTerm && activeTab === "summary" && (
          <ConceptPanel 
            term={selectedTerm}
            context={note?.subject_detected || note?.title || ""}
            onClose={() => setSelectedTerm(null)}
            onTermChange={(newTerm) => setSelectedTerm(newTerm)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
