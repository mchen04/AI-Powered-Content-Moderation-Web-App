import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import config from './config';

// Import pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ResetPassword from './pages/Login/ResetPassword';

// Import components
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ThemeProvider from './context/ThemeContext';
import AuthProvider from './context/AuthContext';

// Initialize Supabase client
const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        setIsLoading(true);
        // Session check will be handled by the AuthProvider
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider supabaseClient={supabaseClient}>
        <Router>
          <div className="app">
            <Navbar />
            <main className="app-content">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="app-footer">
              <p>&copy; {new Date().getFullYear()} AI-Powered Content Moderation</p>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;