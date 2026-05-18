import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpenText, Menu, X } from 'lucide-react';
import { logout } from '../services/api';
import '../styles/navbar.css';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <header className="navbar">
        <Link to="/" className="logo">
          <BookOpenText size={22} className="logo-icon" /> Scriptly
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle navigation">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu-container ${isMenuOpen ? 'open' : ''}`}>
          <nav>
            <ul className="nav-links">
              <li><Link to="/workspace">Workspace</Link></li>
              <li><Link to="/notes">Notes</Link></li>
            </ul>
          </nav>

          <div className="auth-buttons">
            {user ? (
              <>
                <span className="nav-user-email">
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
        </div>
      </header>
      <div className="navbar-spacer"></div>
    </>
  );
}
