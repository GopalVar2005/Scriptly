import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from './Loader';
import '../styles/auth.css';

export default function AuthForm({ type, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {
      setMessage('Please enter email and password.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await onSubmit(email, password);
      
      if (data.error) {
        setMessage('Error: ' + data.error);
        setIsSuccess(false);
      } else {
        setMessage(type === 'login' ? 'Login successful!' : 'Registration successful! Redirecting to login...');
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage('Error connecting to server.');
      setIsSuccess(false);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1><b>Welcome to Scriptly</b></h1>
        <p><b>“From speech to smart notes — fast, accurate, effortless.”</b></p>
      </header>

      <div className="auth-container">
        <h2><b>{type === 'login' ? 'Login' : 'Register'}</b></h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required={type === 'register'}
          />
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required={type === 'register'}
          />
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? <Loader message="" /> : (type === 'login' ? 'Login' : 'Register')}
          </button>
        </form>
        
        {message && <div className={`message ${isSuccess ? 'success' : ''}`}>{message}</div>}
        
        {type === 'register' ? (
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        ) : (
           <p>Don't have an account? <Link to="/register">Register here</Link></p>
        )}
      </div>
    </div>
  );
}
