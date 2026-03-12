import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  targetRole: string;
  setTargetRole: (role: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [targetRole, setTargetRoleState] = useState(() => {
    return localStorage.getItem('targetRole') || 'Backend Developer';
  });

  const setTargetRole = (role: string) => {
    setTargetRoleState(role);
    localStorage.setItem('targetRole', role);
    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ target_role: role })
    });
  };
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || '#136dec';
  });

  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('fontSize') || '16');
  });

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return localStorage.getItem('sidebarExpanded') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
    document.documentElement.style.setProperty('--color-primary-val', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', sidebarExpanded.toString());
  }, [sidebarExpanded]);

  return (
    <ThemeContext.Provider value={{
      themeMode, setThemeMode,
      accentColor, setAccentColor,
      fontSize, setFontSize,
      sidebarExpanded, setSidebarExpanded,
      targetRole, setTargetRole
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
