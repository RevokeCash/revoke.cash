'use client';

import React, { type ReactNode, useContext, useEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';

type Theme = 'system' | 'light' | 'dark';

interface ColorThemeContext {
  darkMode: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface Props {
  children: ReactNode;
}

// We pass in undefined as the default value, since there should always be a provider for this context
const ColorThemeContext = React.createContext<ColorThemeContext>(undefined as any);

export const ColorThemeProvider = ({ children }: Props) => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (theme === 'system') {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setDarkMode(theme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <ColorThemeContext.Provider value={{ darkMode, theme, setTheme }}>{children}</ColorThemeContext.Provider>;
};

export const useColorTheme = () => useContext(ColorThemeContext);
