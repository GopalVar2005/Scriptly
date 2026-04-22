import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = localStorage.getItem('user');

  if (!user) {
    // Save intended destination for post-login redirect (survives page refresh)
    localStorage.setItem('scriptly_redirect', location.pathname);

    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
