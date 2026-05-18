import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function ExplainTooltip({ tooltipState, handleExplain }) {
  if (!tooltipState.visible) return null;

  return (
    <button 
      className="tooltip-explain-btn"
      onClick={handleExplain}
      style={{
        position: 'absolute',
        left: `${tooltipState.x}px`,
        top: `${tooltipState.y}px`,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent clearing selection
    >
      <Lightbulb size={14} style={{ marginRight: '4px' }} /> Explain this
    </button>
  );
}
