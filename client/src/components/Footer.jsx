import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand">
          <BookOpenText size={18} className="footer-icon" /> Scriptly
        </Link>
        <p className="footer-copyright">© {new Date().getFullYear()} Scriptly. All rights reserved.</p>
      </div>
    </footer>
  );
}
