import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import '../styles/navbar.css';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header className="navbar">
        <Link to="/" className="logo">
          <span className="logo-icon">🎙</span> Scriptly
        </Link>

        <nav>
          <ul className="nav-links">
            <li><Link to="/workspace">Workspace</Link></li>
            <li><Link to="/notes">Notes</Link></li>
          </ul>
        </nav>

        <div className="auth-buttons">
          {user ? (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '8px' }}>
                {user.email}
              </span>
              <button onClick={handleLogout} className="sign-in-link">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="sign-in-link">Sign in</Link>
              <Link to="/register" className="get-started-btn">Get started</Link>
            </>
          )}
        </div>
      </header>
      <div className="navbar-spacer"></div>
    </>
  );
}
