import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SmartCTA — A CTA link that routes based on auth state.
 * Logged in → /workspace, Logged out → /register.
 * All props are passed through to the underlying <Link>.
 */
export default function SmartCTA({ children, className, style }) {
  const isLoggedIn = !!localStorage.getItem('user');
  const target = isLoggedIn ? '/workspace' : '/register';
  return (
    <Link to={target} className={className} style={style}>
      {children}
    </Link>
  );
}
