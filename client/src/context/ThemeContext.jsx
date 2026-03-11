import { useEffect, useMemo, useState } from 'react';
import ThemeContext from './themeStateContext';

const THEME_STORAGE_KEY = 'noteplace_theme';
const VALID_THEMES = new Set(['light', 'dark']);

function getDefaultTheme() {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (VALID_THEMES.has(storedTheme)) return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getDefaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
