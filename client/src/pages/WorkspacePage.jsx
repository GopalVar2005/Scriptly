import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribe, summarize, saveNote, processYouTubeUrl, fetchYouTubeMetadata } from '../services/api';
import ConceptPanel from '../components/ConceptPanel';
import '../styles/workspace.css';
import '../styles/YouTubeInput.css';

const MODES = [
  { id: 'first_pass', title: 'First Pass', desc: 'Just tell me what this was about' },
  { id: 'deep_study', title: 'Deep Study', desc: 'Full breakdown with concept explanations' },
  { id: 'exam_prep', title: 'Exam Prep', desc: 'Focus on what could be tested' },
  { id: 'quick_refresh', title: 'Quick Refresh', desc: 'Essentials only, keep it short' }
];

// Clean and structure raw transcript text before sending to AI
function cleanTranscript(text) {
  if (!text) return text;
  return text
    .replace(/\s+/g, ' ')       // Normalize all whitespace to single spaces
    .replace(/\.\s+/g, '.\n\n') // Add paragraph breaks after sentences
    .replace(/\?\s+/g, '?\n\n') // Add paragraph breaks after questions
    .replace(/!\s+/g, '!\n\n')  // Add paragraph breaks after exclamations
    .trim();
}

export default function WorkspacePage() {
  const [step, setStep] = useState('upload'); // 'upload', 'transcript', 'summary'
  const [voiceText, setVoiceText] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [mode, setMode] = useState('first_pass');
  const [noteSaved, setNoteSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const navigate = useNavigate();

  // Input mode tabs
  const [inputMode, setInputMode] = useState('record');

  // Video upload state
  const [isVideoUpload, setIsVideoUpload] = useState(false);

  // YouTube states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState(null);
  const [youtubeSource, setYoutubeSource] = useState(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [youtubeLoadingPreview, setYoutubeLoadingPreview] = useState(false);
  const [lastFetchedUrl, setLastFetchedUrl] = useState('');

  // Concept panel states
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0 });
  const [pendingTerm, setPendingTerm] = useState(null);
  const summaryRef = useRef(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  // Helper: show inline error banner (replaces alert())
  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 8000);
  };

  // Helper: show inline success banner (replaces alert())
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  // Reset YouTube/error states when switching input tabs
  useEffect(() => {
    setYoutubeError(null);
    setYoutubeSource(null);
    setYoutubeLoading(false);
    setYoutubeMetadata(null);
    setLastFetchedUrl('');
  }, [inputMode]);

  // Debounced metadata fetch
  useEffect(() => {
    if (!youtubeUrl.trim()) {
      setYoutubeMetadata(null);
      setLastFetchedUrl('');
      return;
    }
    
    if (youtubeUrl.trim() === lastFetchedUrl) return;

    setYoutubeLoadingPreview(true);
    setYoutubeMetadata(null);

    const abortController = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchYouTubeMetadata(youtubeUrl, abortController.signal);
        setYoutubeMetadata(data);
        setLastFetchedUrl(youtubeUrl.trim());
      } catch (err) {
        if (err.name !== 'AbortError') {
          setYoutubeMetadata(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setYoutubeLoadingPreview(false);
        }
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [youtubeUrl, lastFetchedUrl]);

  // Check for pending notes to restore
  useEffect(() => {
    const pendingNote = localStorage.getItem('pending_scriptly_note');
    if (pendingNote) {
      if (window.confirm("Restore your previous notes?\nClick OK to save them, Cancel to discard.")) {
        const parsedNode = JSON.parse(pendingNote);
        setVoiceText(parsedNode.transcription);
        setSummaryData(parsedNode._parsedSummaryData || null);
        setStep('summary');
        
        // Auto-save logic if restoring
        saveNote(parsedNode)
          .then(() => {
            setNoteSaved(true);
            showSuccess("Note restored and saved successfully!");
            localStorage.removeItem('pending_scriptly_note');
          })
          .catch(err => {
            showError("Failed to save restored note: " + err.message);
          });
      } else {
        localStorage.removeItem('pending_scriptly_note');
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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

  const handleTextSelection = () => {
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartRecording = () => {
    setVoiceText('');
    setSummaryData(null);
    setRecordingSeconds(0);
    startRecording();
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    setProcessingMsg('Transcribing audio...');
    try {
      const audioBlob = await stopRecording();
      if (!audioBlob) { setIsProcessing(false); return; }
      const data = await transcribe(audioBlob);
      const transcription = data.transcription || "";
      setVoiceText(transcription);
      setStep('transcript');
    } catch (err) {
      showError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const videoUpload = file.type.startsWith('video/');
    setIsVideoUpload(videoUpload);

    setIsProcessing(true);
    setProcessingMsg(videoUpload ? 'Extracting audio from video...' : 'Transcribing audio...');
    setVoiceText('');
    setSummaryData(null);
    try {
      const data = await transcribe(file);
      const transcription = data.transcription || "";
      setVoiceText(transcription);
      setStep('transcript');
    } catch (err) {
      showError(err.message);
    } finally {
      setIsProcessing(false);
      setIsVideoUpload(false);
      e.target.value = null;
    }
  };

  const handleYouTubeProcess = async () => {
    if (!youtubeUrl.trim()) return;
    setYoutubeLoading(true);
    setYoutubeError(null);
    setYoutubeSource(null);
    setIsProcessing(true);
    setProcessingMsg("Checking for captions...");

    const slowWarningTimeout = setTimeout(() => {
      setProcessingMsg("No captions found — downloading audio. This may take up to a minute...");
    }, 6000);

    try {
      const result = await processYouTubeUrl(youtubeUrl);
      clearTimeout(slowWarningTimeout);
      setYoutubeSource(result.source);
      setVoiceText(result.transcript);
      setStep('transcript');
    } catch (err) {
      clearTimeout(slowWarningTimeout);
      setYoutubeError(err.message || 'Failed to process YouTube URL.');
    } finally {
      setYoutubeLoading(false);
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    if (!voiceText.trim()) return;
    
    setIsProcessing(true);
    setProcessingMsg('Generating structured summary...');
    try {
      const cleanedText = cleanTranscript(voiceText);
      const data = await summarize(cleanedText, mode);
      setSummaryData(data);
      setStep('summary');
    } catch (err) {
      showError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!voiceText) return;
    try {
      setIsProcessing(true);
      setProcessingMsg('Saving to notes...');
      
      let generatedTitle = "Untitled Note";
      if (summaryData?.subject_detected) {
        generatedTitle = summaryData.subject_detected;
      } else if (summaryData?.quick_recap) {
        generatedTitle = summaryData.quick_recap.split(' ').slice(0, 5).join(' ') + '...';
      }

      const notePayload = {
        title: generatedTitle,
        transcription: voiceText,
        summary: summaryData ? JSON.stringify(summaryData, null, 2) : '',
        keywords: summaryData?.keywords || [],
        subject_detected: summaryData?.subject_detected || '',
        quick_recap: summaryData?.quick_recap || '',
        key_concepts: summaryData?.key_concepts || [],
        important_to_remember: summaryData?.important_to_remember || [],
        potential_exam_questions: summaryData?.potential_exam_questions || [],
        key_terms: summaryData?.key_terms || {},
        memory_anchors: summaryData?.memory_anchors || [],
      };

      try {
        await saveNote(notePayload);
        setNoteSaved(true);
        showSuccess("Note saved! Open it in Notes to access Flashcards & Quiz.");
      } catch (err) {
        if (err.message.includes("logged in") || err.message.toLowerCase().includes("unauthorized") || err.message.includes("Authentication required")) {
          localStorage.setItem('pending_scriptly_note', JSON.stringify({ ...notePayload, _parsedSummaryData: summaryData }));
          showError("Login to save and view your notes. We've saved your progress temporarily.");

          navigate('/login');
        } else {
          throw err;
        }
      }
    } catch (err) {
      showError("Failed to save note: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setVoiceText('');
    setSummaryData(null);
    setRecordingSeconds(0);
    setSelectedTerm(null);
    setNoteSaved(false);
  };

  const wordCount = voiceText.trim().split(/\s+/).filter(Boolean).length;

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
        .scriptly-toast {
          padding: 12px 16px;
          margin-bottom: 1rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideDown 0.3s ease;
        }
        .scriptly-toast-error {
          background-color: rgba(230, 57, 70, 0.1);
          border: 1px solid #e63946;
          color: #e63946;
        }
        .scriptly-toast-success {
          background-color: rgba(46, 196, 134, 0.1);
          border: 1px solid #2ec486;
          color: #2ec486;
        }
        .scriptly-toast button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0 0 0 12px;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar />

      <div className={`workspace-container summary-wrapper ${selectedTerm ? 'panel-open' : ''}`} style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* INLINE ERROR/SUCCESS BANNERS */}
        {errorMsg && (
          <div className="scriptly-toast scriptly-toast-error">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')}>✕</button>
          </div>
        )}
        {successMsg && (
          <div className="scriptly-toast scriptly-toast-success">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')}>✕</button>
          </div>
        )}
        
        {/* STEP 1: UPLOAD / RECORD */}
        {step === 'upload' && !isProcessing && (
          <div className="step-upload">
            <div className="workspace-header-title">
              <h1>Workspace</h1>
              <p>Record, upload, or paste a YouTube link to get started</p>
            </div>

            {/* Input mode tabs */}
            <div className="input-mode-tabs">
              <button
                className={inputMode === 'record' ? 'input-tab active' : 'input-tab'}
                onClick={() => setInputMode('record')}
              >🎙️ Record</button>
              <button
                className={inputMode === 'upload' ? 'input-tab active' : 'input-tab'}
                onClick={() => setInputMode('upload')}
              >📁 Upload File</button>
              <button
                className={inputMode === 'youtube' ? 'input-tab active' : 'input-tab'}
                onClick={() => setInputMode('youtube')}
              >📺 YouTube</button>
            </div>

            {/* RECORD MODE */}
            {inputMode === 'record' && (
              <>
                {!isRecording ? (
                  <div className="recording-card">
                    <button className="mic-button" onClick={handleStartRecording}>🎙</button>
                    <p className="status-text" style={{ marginBottom: '0' }}>Click to start recording</p>
                    {recorderError && <p style={{ color: '#e63946', marginTop: '16px', fontSize: '0.9rem' }}>❌ {recorderError}</p>}
                  </div>
                ) : (
                  <div className="recording-card recording-active">
                    <div className="recording-indicator">
                      <div className="recording-dot"></div>
                    </div>
                    <h3 className="timer-text">{formatTime(recordingSeconds)}</h3>
                    <p className="status-text">Recording...</p>
                    
                    <button className="stop-button" onClick={handleStopRecording}>
                      <span className="stop-icon"></span> Stop recording
                    </button>
                  </div>
                )}
              </>
            )}

            {/* UPLOAD MODE */}
            {inputMode === 'upload' && (
              <div className="recording-card">
                <div className="upload-button-wrapper">
                  <label className="upload-button">
                    <span style={{ marginRight: '8px' }}>↑</span> Upload audio or video file
                    <input
                      type="file"
                      accept="audio/*,video/mp4,video/webm,video/quicktime,video/x-matroska"
                      onChange={handleAudioUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <p className="status-text" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                  Supports audio (mp3, wav, m4a, webm) and video (mp4, webm, mov, mkv)
                </p>
              </div>
            )}

            {/* YOUTUBE MODE */}
            {inputMode === 'youtube' && (
              <div className="youtube-input-section">
                <p className="youtube-description">
                  Paste a YouTube lecture or tutorial URL to generate a study summary.
                  Works best with videos that have captions.
                </p>

                <div className="youtube-url-row">
                  <input
                    type="text"
                    className="youtube-url-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    disabled={youtubeLoading}
                  />
                  <button
                    className="youtube-process-btn"
                    onClick={handleYouTubeProcess}
                    disabled={youtubeLoading || !youtubeUrl.trim() || youtubeMetadata?.tooLong || youtubeLoadingPreview || isProcessing}
                  >
                    {youtubeLoading ? 'Processing...' : 'Process'}
                  </button>
                </div>

                {youtubeLoadingPreview && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading preview...</p>
                )}

                {youtubeMetadata && !youtubeLoadingPreview && (
                  <div className="youtube-preview-card" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                    {youtubeMetadata.thumbnail && (
                      <img src={youtubeMetadata.thumbnail} alt="Thumbnail" style={{ maxHeight: '80px', borderRadius: '4px' }} />
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{youtubeMetadata.title?.length > 60 ? youtubeMetadata.title.substring(0, 60) + '...' : youtubeMetadata.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {youtubeMetadata.channelName} • {youtubeMetadata.durationFormatted}
                      </p>
                      {youtubeMetadata.tooLong && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#e63946', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          ⚠️ Video exceeds maximum length of 45 minutes and cannot be processed.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {youtubeError && (
                  <p className="youtube-error">{youtubeError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROCESSING OVERLAY */}
        {isProcessing && (
          <div className="recording-card" style={{ marginTop: '2rem' }}>
            <div className="processing-spinner"></div>
            <h3 className="timer-text">
              {isVideoUpload ? 'Extracting audio from video...' : processingMsg}
            </h3>
          </div>
        )}

        {/* STEP 2: TRANSCRIPT VALIDATION & MODE SELECTION */}
        {step === 'transcript' && !isProcessing && (
          <div className="step-transcript">
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Review Transcript</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              You may edit the transcript below before generating study material.
            </p>

            {youtubeSource && (
              <p className="youtube-source-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                {youtubeSource === 'captions'
                  ? '✅ Using video captions'
                  : '🎵 Captions unavailable — transcribed from audio'}
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
        )}

        {/* STEP 3: SUMMARY RESULT */}
        {step === 'summary' && !isProcessing && summaryData && (
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
                    {noteSaved ? '✓ Saved' : '💾 Save Note'}
                  </button>
                  <button className="btn-ghost-solid" onClick={handleStartOver}>Start Over</button>
                </div>
                {!noteSaved && (
                  <p className="quiz-unlock-hint">💾 Save this note to unlock Flashcards &amp; Quiz</p>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent, #3B82F6)', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
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
                  <span 
                    key={i} 
                    className="tag-pill"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedTerm(kw)}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
               <button className="btn-ghost-solid" onClick={() => setStep('transcript')}>
                 &larr; Back to Transcript
               </button>
            </div>

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
        {selectedTerm && (
          <ConceptPanel 
            term={selectedTerm}
            context={summaryData?.subject_detected || ""}
            onClose={() => setSelectedTerm(null)}
            onTermChange={(newTerm) => setSelectedTerm(newTerm)}
          />
        )}

      </div>
      <Footer />
    </div>
  );
}
