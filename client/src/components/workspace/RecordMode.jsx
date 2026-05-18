import React from 'react';
import { Mic, XCircle } from 'lucide-react';

export default function RecordMode({ isRecording, startRecording, stopRecording, recorderError, formatTime, recordingSeconds }) {
  return (
    <>
      {!isRecording ? (
        <div className="recording-card">
          <button className="mic-button" onClick={startRecording}><Mic size={32} /></button>
          <p className="status-text" style={{ marginBottom: '0' }}>Click to start recording</p>
          {recorderError && <p style={{ color: '#e63946', marginTop: '16px', fontSize: '0.9rem' }}><XCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{recorderError}</p>}
        </div>
      ) : (
        <div className="recording-card recording-active">
          <div className="recording-indicator">
            <div className="recording-dot"></div>
          </div>
          <h3 className="timer-text">{formatTime(recordingSeconds)}</h3>
          <p className="status-text">Recording...</p>
          
          <button className="stop-button" onClick={stopRecording}>
            <span className="stop-icon"></span> Stop recording
          </button>
        </div>
      )}
    </>
  );
}
