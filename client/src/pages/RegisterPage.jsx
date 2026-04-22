import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { register } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = async (email, password) => {
    const data = await register(email, password);
    if (!data.error) {
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
    return data;
  };

  return <AuthForm type="register" onSubmit={handleRegister} />;
}
