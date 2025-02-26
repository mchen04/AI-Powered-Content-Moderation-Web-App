import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

/**
 * Navbar component
 * Provides navigation links and displays user authentication status
 */
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      navigate('/login');
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Check if the current route matches the given path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and brand */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">Content Moderation</span>
        </Link>

        {/* Mobile menu toggle button */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
        </div>

        {/* Navigation links */}
        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              {/* Links for authenticated users */}
              <li className="nav-item">
                <Link
                  to="/"
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/settings"
                  className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Settings
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-link logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              {/* Links for non-authenticated users */}
              <li className="nav-item">
                <Link
                  to="/login"
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/register"
                  className={`nav-link ${isActive('/register') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </li>
            </>
          )}

          {/* Theme toggle button */}
          <li className="nav-item theme-toggle">
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </li>
        </ul>

        {/* User info (for authenticated users) */}
        {isAuthenticated && user && (
          <div className="user-info">
            <span className="user-name">{user.user_metadata?.name || user.email}</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;