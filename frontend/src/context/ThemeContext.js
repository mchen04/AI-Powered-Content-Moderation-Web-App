import React, { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

// Create Theme Context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Get theme colors based on current theme
  const colors = theme === 'dark' ? config.theme.dark : config.theme.light;

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Apply theme to document root
  useEffect(() => {
    // Set CSS variables for theme colors
    const root = document.documentElement;
    
    // Set primary colors
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    
    // Set background colors
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    
    // Set text colors
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-disabled', colors.text.disabled);
    
    // Set error color
    root.style.setProperty('--color-error', colors.error);
    
    // Set theme class on body
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme, colors]);

  // Context value
  const value = {
    theme,
    colors,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;