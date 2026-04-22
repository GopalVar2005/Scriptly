import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { login } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (email, password) => {
    const data = await login(email, password);
    if (!data.error && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect-back flow: check React Router state first, then localStorage fallback
      const redirectTo =
        location.state?.from ||
        localStorage.getItem('scriptly_redirect') ||
        '/workspace';

      // Clean up stored redirect
      localStorage.removeItem('scriptly_redirect');

      setTimeout(() => {
        navigate(redirectTo);
      }, 500);
    }
    return data;
  };

  return <AuthForm type="login" onSubmit={handleLogin} />;
}
