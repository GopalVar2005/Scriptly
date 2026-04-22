import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import '../styles/hero.css';
import '../styles/features.css';

export default function HomePage() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <h1 className="title">Turn YouTube videos into <span className="highlight-text">structured notes</span></h1>
        <p className="subtitle">
          Paste a YouTube link and Scriptly generates structured study notes, flashcards, and quizzes — so you can learn faster and retain more.
        </p>

        <div className="hero-buttons">
          <Link to="/workspace" className="btn primary">
            <span style={{ marginRight: '6px' }}>📺</span> Get started
          </Link>
          <a href="#features" className="btn secondary">
            <span style={{ marginRight: '6px' }}>▷</span> See how it works
          </a>
        </div>
      </section>

      <section className="features" id="features">
        <h2 className="section-title" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Everything you need to study smarter</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '50px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Convert any YouTube lecture or tutorial into structured study material — notes, flashcards, and quizzes — all powered by AI.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📺</div>
            <h3>YouTube to structured notes</h3>
            <p>Paste a video link and get AI-generated summaries, key concepts, and glossaries instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🃏</div>
            <h3>Generate flashcards</h3>
            <p>Automatically create flashcards from your notes to reinforce key terms and concepts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Review and learn</h3>
            <p>Take AI-generated quizzes, explore concepts, and track what you've studied.</p>
          </div>
        </div>
      </section>

      <section className="bottom-cta" style={{ textAlign: 'center', padding: '100px 20px', borderTop: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 'bold', marginBottom: '16px' }}>Ready to study smarter?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Turn any YouTube video into structured notes in seconds.</p>
        <Link to="/register" className="btn primary">
          Get started free <span style={{ marginLeft: '6px' }}>→</span>
        </Link>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px' }}>No credit card required</p>
      </section>

      <Footer />
    </>
  );
}
