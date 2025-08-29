import React, { type ReactNode, useContext, useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

interface ColorThemeContext {
  darkMode: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface Props {
  children: ReactNode;
}

const ColorThemeContext = React.createContext<ColorThemeContext | undefined>(undefined);

export const ColorThemeProvider = ({ children }: Props) => {
  // Start with light mode preference
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('mini-app-theme');
    return (stored as Theme) || 'light';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  // Update dark mode when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setDarkMode(theme === 'dark');
    }
  }, [theme]);

  // Apply dark class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('mini-app-theme', theme);
  }, [theme]);

  return (
    <ColorThemeContext.Provider value={{ darkMode, theme, setTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};