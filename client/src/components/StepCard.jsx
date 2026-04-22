import React from 'react';

export default function StepCard({ icon, number, title, description, stepClass }) {
  return (
    <>
      <div className={`step-card ${stepClass}`}>
        <span className="step-icon">{icon}</span>
        <span className="step-number">{number}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {number !== '3' && <div className="arrow">⬇</div>}
    </>
  );
}
