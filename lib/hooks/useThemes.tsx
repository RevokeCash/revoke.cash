import { StateSetter } from 'lib/interfaces';
import React, { ReactNode, useContext, useEffect } from 'react';
import useLocalStorage from 'use-local-storage';

interface SiteTheme {
  darkMode?: boolean;
  setDarkMode?: StateSetter<boolean>;
}

const SiteThemeContext = React.createContext<SiteTheme>({});

interface Props {
  children: ReactNode;
}

export const SiteThemeContextProvider = ({ children }: Props) => {
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    'dark-mode',
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const root = document.querySelectorAll(':root')[0];
    if (!root) return;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <SiteThemeContext.Provider
      value={{
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </SiteThemeContext.Provider>
  );
};

export const useSiteTheme = () => useContext(SiteThemeContext);
