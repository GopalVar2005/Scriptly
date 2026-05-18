import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { pingBackend } from './services/api';

import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import NotesPage from './pages/NotesPage';
import NoteDetailPage from './pages/NoteDetailPage';
import DemoPage from './pages/DemoPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import './styles/global.css';

function App() {
  useEffect(() => {
    // Lightweight warmup ping to wake up free-tier backend
    pingBackend();
  }, []);

  return (
    <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><NoteDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
