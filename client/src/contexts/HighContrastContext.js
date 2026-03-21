import React, { createContext, useContext, useState, useEffect } from 'react';

const HighContrastContext = createContext();

export const useHighContrast = () => {
  const context = useContext(HighContrastContext);
  if (!context) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
};

export const HighContrastProvider = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    // Load preference from localStorage
    const stored = localStorage.getItem('highContrastMode');
    return stored === 'true';
  });

  useEffect(() => {
    // Apply high contrast class to document root
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Save preference to localStorage
    localStorage.setItem('highContrastMode', isHighContrast.toString());
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  return (
    <HighContrastContext.Provider value={{ isHighContrast, toggleHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
};
