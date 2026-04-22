import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import '../styles/features.css';

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      <Navbar />
      
      <section className="features" style={{ flex: 1 }}>
        <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Scriptly Features</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '50px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Everything you need to convert YouTube videos into smart, structured study material.
        </p>

        <div className="features-grid">
          <FeatureCard 
            icon="📺" 
            title="Convert YouTube Videos into Notes" 
            description="Paste any YouTube lecture or tutorial URL and get AI-generated structured notes with summaries, key concepts, and glossaries." 
          />
          <FeatureCard 
            icon="🃏" 
            title="Generate Flashcards from Notes" 
            description="Automatically create study flashcards from your saved notes. Review key terms and concepts with a tap-to-flip interface." 
          />
          <FeatureCard 
            icon="🎯" 
            title="Review and Learn from Notes" 
            description="Take AI-generated quizzes, explore concept explanations, and use memory anchors to deepen your understanding." 
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
