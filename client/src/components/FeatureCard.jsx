import React from 'react';
import { PlaySquare, Layers, Target, Mic, Headphones } from 'lucide-react';

export default function FeatureCard({ icon, title, description }) {
  // Map string icon names to Lucide components
  const iconMap = {
    "youtube": <PlaySquare size={24} style={{ color: "var(--accent-color)" }} />,
    layers: <Layers size={24} />,
    target: <Target size={24} />,
  };

  const iconComponent = typeof icon === 'string' && iconMap[icon] ? iconMap[icon] : icon;

  return (
    <div className="feature-card">
      <div className="feature-icon">{iconComponent}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
