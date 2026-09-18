import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrimaryColor = 'sky' | 'blue' | 'emerald' | 'rose' | 'violet' | 'amber' | 'slate';

export interface ColorThemeOption {
  id: PrimaryColor;
  name: string;
  tagline: string;
  hex: string;
  badgeClass: string;
}

export const COLOR_THEME_OPTIONS: ColorThemeOption[] = [
  { id: 'sky', name: 'Azzurro Cynthia', tagline: 'Sociale Cynthia 1920 (Predefinito)', hex: '#0284c7', badgeClass: 'bg-sky-500' },
  { id: 'blue', name: 'Blu Reale', tagline: 'Profondo ed elegante', hex: '#2563eb', badgeClass: 'bg-blue-600' },
  { id: 'emerald', name: 'Verde Campo', tagline: 'Sportivo, manto erboso', hex: '#059669', badgeClass: 'bg-emerald-600' },
  { id: 'rose', name: 'Rosso Rubino', tagline: 'Caldo, vivace e dinamico', hex: '#e11d48', badgeClass: 'bg-rose-600' },
  { id: 'violet', name: 'Viola Nobile', tagline: 'Moderno ed equilibrato', hex: '#7c3aed', badgeClass: 'bg-violet-600' },
  { id: 'amber', name: 'Ambra / Oro', tagline: 'Luminoso e ad alta energia', hex: '#d97706', badgeClass: 'bg-amber-600' },
  { id: 'slate', name: 'Ardesia Neutro', tagline: 'Minimale high-contrast', hex: '#475569', badgeClass: 'bg-slate-600' },
];

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  primaryColor: PrimaryColor;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setPrimaryColor: (color: PrimaryColor) => void;
}

const THEME_STORAGE_KEY = 'cynthia_app_theme';
const PRIMARY_COLOR_STORAGE_KEY = 'cynthia_app_primary_color';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignora
    }
    return 'system';
  });

  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(() => {
    try {
      const stored = localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
      if (stored && ['sky', 'blue', 'emerald', 'rose', 'violet', 'amber', 'slate'].includes(stored)) {
        return stored as PrimaryColor;
      }
    } catch {
      // Ignora
    }
    return 'sky';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolved = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      setResolvedTheme(isDark ? 'dark' : 'light');

      // Aggiungi o rimuovi classe 'dark' dal root html / body
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateResolved();

    const listener = () => {
      if (theme === 'system') {
        updateResolved();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Gestione attributo data-color-theme sul root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', primaryColor);
    try {
      localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColor);
    } catch {
      // Ignora
    }

    // Sincronizza il meta tag theme-color per la barra del browser dello smartphone
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const option = COLOR_THEME_OPTIONS.find((o) => o.id === primaryColor);
      if (option) {
        metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : option.hex);
      }
    }
  }, [primaryColor, resolvedTheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignora
    }
  };

  const setPrimaryColor = (color: PrimaryColor) => {
    setPrimaryColorState(color);
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        primaryColor,
        setTheme,
        toggleTheme,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
