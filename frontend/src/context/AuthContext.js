import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
const AuthProvider = ({ children, supabaseClient }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState(null);

  // Initialize auth state on component mount
  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get session from Supabase
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user settings
          await fetchUserSettings(session.access_token);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session) {
          await fetchUserSettings(session.access_token);
        } else {
          setUserSettings(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  // Fetch user settings from API
  const fetchUserSettings = async (token) => {
    try {
      const response = await axios.get(
        `${config.api.baseUrl}${config.api.endpoints.userSettings}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setUserSettings(response.data);
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  // Register a new user
  const register = async (email, password, name) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Login a user
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout a user
  const logout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserSettings(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (password) => {
    try {
      setLoading(true);
      
      const { error } = await supabaseClient.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user settings
  const updateSettings = async (settings) => {
    try {
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await axios.put(
        `${config.api.baseUrl}${config.api.endpoints.userSettings}`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      setUserSettings(response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Settings update error:', error);
      return { success: false, error: error.message };
    }
  };

  // Context value
  const value = {
    user,
    session,
    loading,
    userSettings,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    updateSettings,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;