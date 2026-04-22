import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNotes } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/global.css';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const isAuthError = error && (error.toLowerCase().includes('login') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('authentication'));

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotes();
        setNotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note => 
    (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (note.summary && note.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (note.transcription && note.transcription.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (note.keywords && note.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '20px 20px 60px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', margin: '0 0 4px 0' }}>Notes</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              {isLoading ? '...' : `${notes.length} recording${notes.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          <Link to="/workspace" style={{
            background: 'var(--accent-color)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            transition: 'background 0.2s ease'
          }}>
            🎙 New recording
          </Link>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Search notes, tags, or content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color-elevated)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            Loading notes...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            {isAuthError ? (
              <>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '16px' }}>Please login to continue</p>
                <button
                  onClick={() => navigate('/login', { state: { from: '/notes' } })}
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
              </>
            ) : (
              <p style={{ color: '#e63946' }}>Error: {error}</p>
            )}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {notes.length === 0 ? "No recordings yet. Start by creating one!" : "No notes match your search."}
            </p>
            {notes.length === 0 && (
              <Link to="/workspace" style={{ color: 'var(--accent-color)', fontSize: '0.9rem', marginTop: '12px', display: 'inline-block' }}>
                Go to Workspace →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border-color)' }}>
            {filteredNotes.map((note) => (
              <Link to={`/notes/${note._id}`} key={note._id} style={{ 
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: '1px solid var(--border-color)',
                padding: '20px 0',
                display: 'block',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Row 1: Title + Tags + Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent-color)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    
                    {note.keywords && note.keywords.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {note.keywords.slice(0, 2).map((kw, i) => (
                          <span key={i} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '16px', flexShrink: 0 }}>
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                {/* Row 2: Summary preview */}
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  display: '-webkit-box', 
                  WebkitLineClamp: 1, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  margin: '0'
                }}>
                  {note.summary || note.transcription}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
