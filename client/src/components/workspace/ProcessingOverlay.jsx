import React, { useState, useEffect } from 'react';

const AI_MESSAGES = [
  'Connecting to AI services...',
  'Analyzing transcript...',
  'Extracting key concepts...',
  'Structuring study material...',
  'Applying educational formatting...'
];

export default function ProcessingOverlay({ processingMsg }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Only cycle messages during the long AI generation phase
    if (processingMsg === 'Generating structured summary...') {
      setMsgIndex(0); // reset when it starts
      const interval = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % AI_MESSAGES.length);
      }, 3500); // cycle every 3.5 seconds
      return () => clearInterval(interval);
    }
  }, [processingMsg]);

  // Determine what message to show
  let displayMsg = processingMsg;
  if (processingMsg === 'Generating structured summary...') {
    displayMsg = AI_MESSAGES[msgIndex];
  }

  return (
    <div className="recording-card" style={{ marginTop: '2rem' }}>
      <div className="processing-spinner"></div>
      <h3 className="timer-text">
        {displayMsg}
      </h3>
    </div>
  );
}
