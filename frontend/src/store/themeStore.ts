import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Force light mode on initialization
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  }
  return {
    theme: 'light',
    toggleTheme: () => {},
    setTheme: () => {},
  };
});

