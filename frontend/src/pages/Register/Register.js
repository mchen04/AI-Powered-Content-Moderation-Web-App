import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

/**
 * Register page component
 * Handles user registration
 */
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Handle countdown and redirect after successful registration
  useEffect(() => {
    let timer;
    if (redirectCountdown !== null) {
      if (redirectCountdown <= 0) {
        // Redirect to login page when countdown reaches 0
        navigate('/login', {
          state: {
            message: 'Registration successful! Please check your email to confirm your account.'
          }
        });
      } else {
        // Decrement countdown every second
        timer = setTimeout(() => {
          setRedirectCountdown(redirectCountdown - 1);
        }, 1000);
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [redirectCountdown, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
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
      
      // Attempt registration
      const { success, error } = await register(email, password, name);
      
      if (success) {
        // Show success message and start countdown
        setSuccess(`Registration successful! Please check your email (${email}) to confirm your account. Redirecting to login in 5 seconds...`);
        setRedirectCountdown(5);
      } else {
        // Display error message
        setError(error || 'Failed to register. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Create an Account</h1>
        
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
        
        {/* Registration form - hidden when success message is shown */}
        {!success && (
          <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your name"
              required
            />
          </div>
          
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
                placeholder="Create a password"
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="form-input password-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={toggleConfirmPasswordVisibility}
                tabIndex="-1"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary register-button"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        )}
        
        {/* Login link - only shown when success message is not displayed */}
        {!success && (
          <div className="login-link">
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;