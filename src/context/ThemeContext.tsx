import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

export const THEME_STORAGE_KEY = 'cynthia_app_theme';
export const PRIMARY_COLOR_STORAGE_KEY = 'cynthia_app_primary_color';

export const getStoredTheme = (): ThemeMode => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored as ThemeMode;
      }
    }
  } catch {
    // fallback
  }
  return 'system';
};

export const getSystemPrefersDark = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const resolveTheme = (mode: ThemeMode, systemDark?: boolean): 'light' | 'dark' => {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  const sys = systemDark !== undefined ? systemDark : getSystemPrefersDark();
  return sys ? 'dark' : 'light';
};

export const applyThemeToDom = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (document.body) {
      document.body.classList.add('dark');
    }
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (document.body) {
      document.body.classList.remove('dark');
    }
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
        if (stored && ['sky', 'blue', 'emerald', 'rose', 'violet', 'amber', 'slate'].includes(stored)) {
          return stored as PrimaryColor;
        }
      }
    } catch {
      // Ignora
    }
    return 'sky';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
    }
    return resolveTheme(getStoredTheme());
  });

  // Funzione unificata per impostare il tema con persistenza garantita
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Errore salvataggio tema in localStorage:', err);
    }
    const isDark = resolveTheme(mode) === 'dark';
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDom(isDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const setPrimaryColor = useCallback((color: PrimaryColor) => {
    setPrimaryColorState(color);
  }, []);

  // Sincronizzazione al montaggio e reazione ai cambi OS (quando tema è 'system')
  useEffect(() => {
    const isDark = resolveTheme(theme) === 'dark';
    setResolvedTheme(isDark ? 'dark' : 'light');
    applyThemeToDom(isDark);

    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = (e: MediaQueryListEvent) => {
      const currentStored = getStoredTheme();
      if (currentStored === 'system') {
        const dark = e.matches;
        setResolvedTheme(dark ? 'dark' : 'light');
        applyThemeToDom(dark);
      }
    };

    // Sincronizzazione multi-scheda via StorageEvent
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = (e.newValue as ThemeMode) || 'system';
        setThemeState(newTheme);
        const dark = resolveTheme(newTheme) === 'dark';
        setResolvedTheme(dark ? 'dark' : 'light');
        applyThemeToDom(dark);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme]);

  // Gestione attributo data-color-theme sul root e meta tag theme-color
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', primaryColor);
    try {
      localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColor);
    } catch {
      // Ignora
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const option = COLOR_THEME_OPTIONS.find((o) => o.id === primaryColor);
      if (option) {
        metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : option.hex);
      }
    }
  }, [primaryColor, resolvedTheme]);

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
