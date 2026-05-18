import React from 'react';
import { Mic, Upload, PlaySquare } from 'lucide-react';
import RecordMode from './RecordMode';
import UploadMode from './UploadMode';
import YouTubeMode from './YouTubeMode';

export default function UploadSection({ 
  inputMode, setInputMode,
  isRecording, startRecording, stopRecording, recorderError, formatTime, recordingSeconds,
  handleAudioUpload,
  youtubeUrl, setYoutubeUrl, youtubeLoading, youtubeLoadingPreview, isProcessing, youtubeMetadata, youtubeError, handleYouTubeProcess
}) {
  return (
    <div className="step-upload">
      <div className="workspace-header-title">
        <h1>Workspace</h1>
        <p>Record, upload, or paste a YouTube link to get started</p>
      </div>

      <div className="input-mode-tabs">
        <button
          className={inputMode === 'record' ? 'input-tab active' : 'input-tab'}
          onClick={() => setInputMode('record')}
        ><Mic size={15} style={{ marginRight: '4px' }} /> Record</button>
        <button
          className={inputMode === 'upload' ? 'input-tab active' : 'input-tab'}
          onClick={() => setInputMode('upload')}
        ><Upload size={15} style={{ marginRight: '4px' }} /> Upload File</button>
        <button
          className={inputMode === 'youtube' ? 'input-tab active' : 'input-tab'}
          onClick={() => setInputMode('youtube')}
        ><PlaySquare size={15} style={{ marginRight: '4px' }} /> YouTube</button>
      </div>

      {inputMode === 'record' && (
        <RecordMode 
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          recorderError={recorderError}
          formatTime={formatTime}
          recordingSeconds={recordingSeconds}
        />
      )}

      {inputMode === 'upload' && (
        <UploadMode handleAudioUpload={handleAudioUpload} />
      )}

      {inputMode === 'youtube' && (
        <YouTubeMode 
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          youtubeLoading={youtubeLoading}
          youtubeLoadingPreview={youtubeLoadingPreview}
          isProcessing={isProcessing}
          youtubeMetadata={youtubeMetadata}
          youtubeError={youtubeError}
          handleYouTubeProcess={handleYouTubeProcess}
        />
      )}
    </div>
  );
}
