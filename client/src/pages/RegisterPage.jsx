import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { register } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRegister = async (email, password) => {
    const data = await register(email, password);
    if (!data.error && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));

      // Handle potential redirect intent
      const redirectTo =
        location.state?.from ||
        localStorage.getItem('scriptly_redirect') ||
        '/workspace';

      localStorage.removeItem('scriptly_redirect');

      setTimeout(() => {
        navigate(redirectTo);
      }, 500); // Short delay for visual success feedback
    }
    return data;
  };

  return <AuthForm type="register" onSubmit={handleRegister} />;
}
