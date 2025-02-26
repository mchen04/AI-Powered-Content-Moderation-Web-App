import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

/**
 * ResetPassword component
 * Handles password reset functionality
 */
const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for reset token in URL
  useEffect(() => {
    // Extract token from URL if present
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (token) {
      setResetToken(token);
    }
  }, [location]);

  // Handle request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Request password reset
      const { success, error } = await requestPasswordReset(email);
      
      if (success) {
        setResetRequested(true);
        setSuccess('Password reset instructions have been sent to your email.');
      } else {
        setError(error || 'Failed to request password reset. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Reset password
      const { success, error } = await resetPassword(password);
      
      if (success) {
        setSuccess('Your password has been reset successfully.');
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Your password has been reset. Please login with your new password.' } 
          });
        }, 2000);
      } else {
        setError(error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Reset Password</h1>
        
        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}
        
        {resetToken ? (
          // Reset password form (when token is present)
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">New Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Confirm new password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          // Request reset form (when no token is present)
          <form onSubmit={handleRequestReset} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || resetRequested}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary login-button"
              disabled={isLoading || resetRequested}
            >
              {isLoading ? 'Sending...' : resetRequested ? 'Email Sent' : 'Send Reset Link'}
            </button>
          </form>
        )}
        
        {/* Back to login link */}
        <div className="register-link">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;