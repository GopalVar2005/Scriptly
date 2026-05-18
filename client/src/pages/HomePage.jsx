import React from 'react';
import { Link } from 'react-router-dom';
import SmartCTA from '../components/SmartCTA';
import { PlaySquare, Upload, Mic, Layers, Target, Lightbulb, Sparkles, Zap, Brain, ArrowRight, Play, Bot, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import '../styles/homepage.css';
import '../styles/hero.css';

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="home-hero">
        <div className="home-badge">
          <span className="badge-dot"></span>
          AI-powered study acceleration
        </div>

        <h1 className="home-title">
          Turn lectures into <span className="accent">exam-ready study material</span> — in minutes
        </h1>

        <p className="home-subtitle">
          Paste a YouTube lecture, upload audio, or record live — Scriptly generates 
          structured notes, flashcards, and quizzes so you can study smarter, not harder.
        </p>

        <div className="home-cta-group">
          <Link to="/workspace" className="btn primary">
            Get started free <ArrowRight size={16} style={{ marginLeft: '4px' }} />
          </Link>
          <Link to="/demo" className="btn secondary">
            <Play size={15} style={{ marginRight: '4px' }} /> Try demo instantly
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-how-it-works">
        <div className="home-section-header">
          <h2>How it works</h2>
          <p>Three steps from lecture to exam-ready material. No manual note-taking required.</p>
        </div>

        <div className="how-steps">
          <div className="how-step">
            <div className="step-num">1</div>
            <div className="step-icon-wrap"><Upload size={22} /></div>
            <h3>Upload or paste a link</h3>
            <p>Record audio, upload a file, or paste any YouTube lecture URL.</p>
          </div>
          <div className="how-step">
            <div className="step-num">2</div>
            <div className="step-icon-wrap"><Bot size={22} /></div>
            <h3>AI processes everything</h3>
            <p>Whisper transcribes, Gemini structures — notes, concepts, glossary generated.</p>
          </div>
          <div className="how-step">
            <div className="step-num">3</div>
            <div className="step-icon-wrap"><Brain size={22} /></div>
            <h3>Study and revise</h3>
            <p>Review flashcards, take quizzes, explore concepts — all from one guide.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-features" id="features">
        <div className="home-section-header">
          <h2>Everything you need to study smarter</h2>
          <p>One platform that handles the entire pipeline from lecture to revision.</p>
        </div>

        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon"><PlaySquare size={22} /></div>
            <h3>YouTube lecture processing</h3>
            <p>Paste any lecture URL. Captions extracted or audio transcribed automatically.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"><Mic size={22} /></div>
            <h3>Audio & video transcription</h3>
            <p>Upload recordings or record live in-browser. Whisper-powered transcription.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"><Sparkles size={22} /></div>
            <h3>Structured study guides</h3>
            <p>AI generates key concepts, glossary, memory anchors, and exam questions.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"><Layers size={22} /></div>
            <h3>Flashcard generation</h3>
            <p>Auto-generated flashcards from key terms and concepts. Track what you know.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"><Target size={22} /></div>
            <h3>AI-powered quizzes</h3>
            <p>Test yourself with generated MCQs. See results, retake, and improve.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon"><Lightbulb size={22} /></div>
            <h3>Concept explanations</h3>
            <p>Highlight any term for an instant AI explanation — simple or technical.</p>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="home-trust">
        <div className="trust-inner">
          <div className="trust-item">
            <span className="trust-icon"><Zap size={16} /></span>
            Powered by Gemini 2.5 Flash
          </div>
          <div className="trust-item">
            <span className="trust-icon"><ShieldCheck size={16} /></span>
            Whisper transcription
          </div>
          <div className="trust-item">
            <span className="trust-icon"><Sparkles size={16} /></span>
            Results in under 30 seconds
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="home-bottom-cta">
        <h2>Ready to study smarter?</h2>
        <p>Turn any lecture into structured study material — free to start.</p>
        <div className="home-cta-group">
          <SmartCTA className="btn primary">
            Get started free <ArrowRight size={16} style={{ marginLeft: '4px' }} />
          </SmartCTA>
          <Link to="/demo" className="btn secondary">
            <Play size={15} style={{ marginRight: '4px' }} /> See a demo
          </Link>
        </div>
        <p className="subtle-text">No credit card required</p>
      </section>

      <Footer />
    </>
  );
}
