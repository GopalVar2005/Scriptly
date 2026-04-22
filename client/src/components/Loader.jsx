import React from 'react';

export default function Loader({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: '#00c9ff' }}>
      <span style={{ marginRight: '10px' }}>⏳</span>
      <span>{message}</span>
    </div>
  );
}
