const { createClient } = require('@supabase/supabase-js');
const supabaseService = require('../services/supabaseService');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Controller for authentication functionality
 */
const authController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Register user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Create default user settings
      await supabaseService.updateUserSettings(data.user.id, {
        user_id: data.user.id,
        name: name || email.split('@')[0],
        created_at: new Date().toISOString()
      });
      
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }
  },
  
  /**
   * Login a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Login user with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to login' });
    }
  },
  
  /**
   * Get current user information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCurrentUser: async (req, res) => {
    try {
      const user = req.user;
      
      // Get user settings
      const settings = await supabaseService.getUserSettings(user.id);
      
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || settings.name
        },
        settings
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ error: 'Failed to get user information' });
    }
  },
  
  /**
   * Logout a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(' ')[1];
      
      // Logout user with Supabase
      const { error } = await supabase.auth.admin.signOut(token);
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Failed to logout' });
    }
  },
  
  /**
   * Refresh authentication token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refreshToken: async (req, res) => {
    try {
      const { refresh_token } = req.body;
      
      // Validate input
      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }
      
      // Refresh token with Supabase
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(200).json({
        message: 'Token refreshed successfully',
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({ error: 'Failed to refresh token' });
    }
  },
  
  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validate input
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Request password reset with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({ error: 'Failed to request password reset' });
    }
  },
  
  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const { token } = req.params;
      
      // Validate input
      if (!password) {
        return res.status(400).json({ error: 'New password is required' });
      }
      
      if (!token) {
        return res.status(400).json({ error: 'Reset token is required' });
      }
      
      // Reset password with Supabase
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: 'Failed to reset password' });
    }
  }
};

module.exports = authController;