import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribe, summarize, saveNote, processYouTubeUrl, fetchYouTubeMetadata } from '../services/api';
import ConceptPanel from '../components/ConceptPanel';
import '../styles/workspace.css';
import '../styles/YouTubeInput.css';

// Import newly extracted sub-components
import WorkspaceToast from '../components/workspace/WorkspaceToast';
import UploadSection from '../components/workspace/UploadSection';
import ProcessingOverlay from '../components/workspace/ProcessingOverlay';
import TranscriptEditor from '../components/workspace/TranscriptEditor';
import SummaryViewer from '../components/workspace/SummaryViewer';
import ExplainTooltip from '../components/workspace/ExplainTooltip';

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

  // Pending note restore state (replaces window.confirm)
  const [pendingRestore, setPendingRestore] = useState(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  // Helper: show inline error banner
  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 8000);
  };

  // Helper: show inline success banner
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
      try {
        setPendingRestore(JSON.parse(pendingNote));
      } catch {
        localStorage.removeItem('pending_scriptly_note');
      }
    }
  }, []);

  const handleRestore = async () => {
    if (!pendingRestore) return;
    setVoiceText(pendingRestore.transcription);
    setSummaryData(pendingRestore._parsedSummaryData || null);
    setStep('summary');

    try {
      await saveNote(pendingRestore);
      setNoteSaved(true);
      showSuccess("Note restored and saved successfully!");
    } catch (err) {
      showError("Failed to save restored note: " + err.message);
    }
    localStorage.removeItem('pending_scriptly_note');
    setPendingRestore(null);
  };

  const handleDiscardRestore = () => {
    localStorage.removeItem('pending_scriptly_note');
    setPendingRestore(null);
  };

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

    try {
      const result = await processYouTubeUrl(youtubeUrl);
      setYoutubeSource(result.source);
      setVoiceText(result.transcript);
      setStep('transcript');
    } catch (err) {
      if (err.code === "CAPTIONS_UNAVAILABLE") {
        setYoutubeError({
          message: err.message,
          suggestions: err.suggestions
        });
      } else {
        setYoutubeError(err.message || 'Failed to process YouTube URL.');
      }
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
        if (err.status === 401 || err.status === 403) {
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
      <Navbar />

      <div className={`workspace-container summary-wrapper ${selectedTerm ? 'panel-open' : ''}`} style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        <WorkspaceToast 
          errorMsg={errorMsg} successMsg={successMsg} 
          setErrorMsg={setErrorMsg} setSuccessMsg={setSuccessMsg} 
        />

        {/* Inline restore banner — replaces window.confirm */}
        {pendingRestore && step === 'upload' && !isProcessing && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(56, 189, 248, 0.06))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              We found unsaved progress from a previous session.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleRestore} style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: 'var(--accent-color)', color: '#fff',
                fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer'
              }}>Restore</button>
              <button onClick={handleDiscardRestore} style={{
                padding: '8px 16px', borderRadius: '6px',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer'
              }}>Discard</button>
            </div>
          </div>
        )}
        
        {step === 'upload' && !isProcessing && (
          <UploadSection 
            inputMode={inputMode} setInputMode={setInputMode}
            isRecording={isRecording} startRecording={handleStartRecording} stopRecording={handleStopRecording} 
            recorderError={recorderError} formatTime={formatTime} recordingSeconds={recordingSeconds}
            handleAudioUpload={handleAudioUpload}
            youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl} 
            youtubeLoading={youtubeLoading} youtubeLoadingPreview={youtubeLoadingPreview} 
            isProcessing={isProcessing} youtubeMetadata={youtubeMetadata} 
            youtubeError={youtubeError} handleYouTubeProcess={handleYouTubeProcess}
          />
        )}

        {isProcessing && (
          <ProcessingOverlay isVideoUpload={isVideoUpload} processingMsg={processingMsg} />
        )}

        {step === 'transcript' && !isProcessing && (
          <TranscriptEditor 
            voiceText={voiceText} setVoiceText={setVoiceText} 
            wordCount={wordCount} youtubeSource={youtubeSource} 
            mode={mode} setMode={setMode} 
            handleStartOver={handleStartOver} handleSummarize={handleSummarize} 
          />
        )}

        {step === 'summary' && !isProcessing && summaryData && (
          <SummaryViewer 
            summaryData={summaryData} summaryRef={summaryRef} 
            handleTextSelection={handleTextSelection} handleSaveNote={handleSaveNote} 
            noteSaved={noteSaved} handleStartOver={handleStartOver} setSelectedTerm={setSelectedTerm} 
          />
        )}

        <ExplainTooltip 
          tooltipState={tooltipState} 
          handleExplain={() => {
            setSelectedTerm(pendingTerm);
            setTooltipState({ visible: false, x: 0, y: 0 });
            setPendingTerm(null);
          }} 
        />

      </div>

      {selectedTerm && (
        <ConceptPanel
          term={selectedTerm}
          context={summaryData?.quick_recap || voiceText}
          onClose={() => setSelectedTerm(null)}
          onTermChange={(newTerm) => setSelectedTerm(newTerm)}
        />
      )}

      <Footer />
    </div>
  );
}
