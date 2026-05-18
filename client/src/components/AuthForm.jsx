import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from './Loader';
import Navbar from './Navbar';
import Footer from './Footer';
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
        setMessage(type === 'login' ? 'Login successful!' : 'Registration successful! Redirecting...');
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage(err.message || 'Something went wrong. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-content-wrapper">
        <header className="auth-header">
          <h1 style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome to Scriptly</h1>
          <p>Turn lectures into exam-ready study material.</p>
        </header>

        <div className="auth-container">
          <h2 style={{ fontWeight: 600 }}>{type === 'login' ? 'Sign in' : 'Create an account'}</h2>
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
            {type === 'register' && (
              <p className="password-hint">Minimum 6 characters</p>
            )}
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? <Loader message="" /> : (type === 'login' ? 'Sign in' : 'Sign up')}
            </button>
          </form>
          
          {message && <div className={`message ${isSuccess ? 'success' : ''}`}>{message}</div>}
          
          {type === 'register' ? (
            <p className="auth-switch-text">Already have an account? <Link to="/login">Sign in</Link></p>
          ) : (
             <p className="auth-switch-text">Don't have an account? <Link to="/register">Sign up</Link></p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
