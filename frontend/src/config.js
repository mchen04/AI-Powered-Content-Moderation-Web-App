/**
 * Frontend configuration file
 */

// Function to determine the API base URL
const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default port for backend
  const defaultPort = 3003;
  
  // Return a function that will try different ports if needed
  return `http://localhost:${defaultPort}`;
};

// API configuration
const API_CONFIG = {
  // Base URL for API requests
  baseUrl: getApiBaseUrl(),
  
  // API endpoints
  endpoints: {
    // Text moderation endpoints
    textModeration: '/api/moderate-text',
    textModerationHistory: '/api/moderate-text/history',
    
    // Image moderation endpoints
    imageModeration: '/api/moderate-image',
    imageUrlModeration: '/api/moderate-image/url',
    imageModerationHistory: '/api/moderate-image/history',
    
    // User settings endpoints
    userSettings: '/api/settings',
    moderationCategories: '/api/settings/categories',
    apiKey: '/api/settings/api-key',
    apiKeys: '/api/settings/api-keys',
    updateApiKey: '/api/settings/api-key/:keyId',
    deleteApiKey: '/api/settings/api-key/:keyId',
    
    // Authentication endpoints
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refreshToken: '/api/auth/refresh',
    currentUser: '/api/auth/user',
    resetPassword: '/api/auth/reset-password',
  }
};

// Supabase configuration
const SUPABASE_CONFIG = {
  url: process.env.REACT_APP_SUPABASE_URL || 'https://rafmwpnaihougpcdjmss.supabase.co',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZm13cG5haWhvdWdwY2RqbXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDU1MjksImV4cCI6MjA1NjE4MTUyOX0.JH-NnSvijkaq4Os77ZhsEENjW8LM7WxSMO6TMuGE-DI'
};

// Theme configuration
const THEME_CONFIG = {
  light: {
    primary: '#3f51b5',
    secondary: '#f50057',
    background: '#ffffff',
    surface: '#f5f5f5',
    error: '#b00020',
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    }
  },
  dark: {
    primary: '#7986cb',
    secondary: '#ff4081',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#cf6679',
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)'
    }
  }
};

// Export configuration
const config = {
  api: API_CONFIG,
  supabase: SUPABASE_CONFIG,
  theme: THEME_CONFIG
};

export default config;