import { useState, useEffect, useCallback } from 'react';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'infiltrado_app_theme';
const SUGGESTION_DISMISSED_KEY = 'infiltrado_dark_suggestion_dismissed';

export function useTheme() {
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {}
    // Default to 'light' as the game's recommended presentation
    return 'light';
  });

  const [hasUserChosen, setHasUserChosen] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SUGGESTION_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Listen to system preference changes (e.g. user toggles dark mode in OS settings)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsSystemDark(e.matches);
    };

    setIsSystemDark(mediaQuery.matches);
    try {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      try {
        mediaQuery.addListener(handler as any);
        return () => mediaQuery.removeListener(handler as any);
      } catch {}
    }
  }, []);

  // Synchronize with documentElement and color-scheme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    setHasUserChosen(true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      setHasUserChosen(true);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const dismissSuggestion = useCallback(() => {
    setIsSuggestionDismissed(true);
    try {
      localStorage.setItem(SUGGESTION_DISMISSED_KEY, 'true');
    } catch {}
  }, []);

  // Show suggestion if user's device is in dark mode and they haven't explicitly dismissed the tip
  const showDarkSuggestion = isSystemDark && !isSuggestionDismissed;

  return {
    theme,
    isSystemDark,
    showDarkSuggestion,
    hasUserChosen,
    setTheme,
    toggleTheme,
    dismissSuggestion,
  };
}
