import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Home, LayoutDashboard } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Navbar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: '700', color: 'var(--text-muted)', opacity: 0.2, margin: 0, lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '1rem' }}>Page not found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '2.5rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-color-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <Home size={18} /> Go Home
          </Link>
          
          <Link to="/workspace" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-color)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#0060d4'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-color)'}
          >
            <LayoutDashboard size={18} /> Open Workspace
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
