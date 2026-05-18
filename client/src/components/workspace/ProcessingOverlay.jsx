import React from 'react';

export default function ProcessingOverlay({ isVideoUpload, processingMsg }) {
  return (
    <div className="recording-card" style={{ marginTop: '2rem' }}>
      <div className="processing-spinner"></div>
      <h3 className="timer-text">
        {isVideoUpload ? 'Extracting audio from video...' : processingMsg}
      </h3>
    </div>
  );
}
