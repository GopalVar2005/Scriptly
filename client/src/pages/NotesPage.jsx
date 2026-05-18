import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { getNotes } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/global.css';
import '../styles/notes-page.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently updated' }
];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  const isAuthError = error?.status === 401 || error?.status === 403;

  // Debounce search input — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notes from backend with pagination
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getNotes({ page, limit: 12, sort: sortBy });
      setNotes(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  // Client-side filter within loaded page (title + keywords only)
  const filteredNotes = debouncedSearch
    ? notes.filter(note =>
        (note.title && note.title.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (note.keywords && note.keywords.some(kw => kw.toLowerCase().includes(debouncedSearch.toLowerCase())))
      )
    : notes;

  const totalPages = pagination?.totalPages || 1;
  const totalNotes = pagination?.total || 0;

  return (
    <div className="notes-page">
      <Navbar />
      <div className="notes-container">
        
        {/* Header */}
        <div className="notes-header">
          <div>
            <h1>Notes</h1>
            <p>
              {isLoading ? '...' : `${totalNotes} note${totalNotes !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          <Link to="/workspace" className="new-recording-btn">
            <Mic size={15} /> New recording
          </Link>
        </div>

        {/* Search + Sort Row */}
        <div className="notes-search-row">
          {/* Search */}
          <div className="notes-search-wrapper">
            <Search size={16} className="notes-search-icon" />
            <input 
              type="text" 
              placeholder="Search by title or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notes-search-input"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="notes-sort-wrapper">
            <ArrowUpDown size={14} className="notes-sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="notes-sort-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="notes-state-msg">
            Loading notes...
          </div>
        ) : error ? (
          <div className="notes-state-msg">
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
              <p style={{ color: '#e63946' }}>Error: {error?.message || String(error)}</p>
            )}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="notes-empty-state">
            <p>
              {totalNotes === 0 ? "No recordings yet. Start by creating one!" : debouncedSearch ? "No notes match your search." : "No notes on this page."}
            </p>
            {totalNotes === 0 && (
              <Link to="/workspace">
                Go to Workspace →
              </Link>
            )}
          </div>
        ) : (
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <Link to={`/notes/${note._id}`} key={note._id} className="notes-item">
                {/* Row 1: Title + Tags + Date */}
                <div className="notes-item-header">
                  <div className="notes-item-title-group">
                    <h3 className="notes-item-title">
                      {note.title || 'Untitled Note'}
                    </h3>
                    
                    {note.keywords && note.keywords.length > 0 && (
                      <div className="notes-item-tags">
                        {note.keywords.slice(0, 2).map((kw, i) => (
                          <span key={i} className="notes-item-tag">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="notes-item-date">
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                {/* Row 2: Quick recap or subject as preview */}
                <p className="notes-item-preview">
                  {note.quick_recap || note.subject_detected || 'No preview available'}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="notes-pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="notes-pagination-btn"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span className="notes-pagination-text">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="notes-pagination-btn"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
