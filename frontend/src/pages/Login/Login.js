import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

/**
 * Login page component
 * Handles user authentication
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Check for success message in location state (e.g., from registration)
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the location state to prevent showing the message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Attempt login
      const { success, error } = await login(email, password);
      
      if (success) {
        // Redirect to home page on successful login
        navigate('/');
      } else {
        // Display error message
        setError(error || 'Failed to login. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        
        {/* Success message */}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          
          <div className="form-group forgot-password">
            <Link to="/reset-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Register link */}
        <div className="register-link">
          Don't have an account?{' '}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;