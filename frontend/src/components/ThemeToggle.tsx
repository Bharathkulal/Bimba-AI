import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-slate-200/60 dark:border-emerald-900/30 hover:bg-slate-50 dark:hover:bg-emerald-950/20 text-slate-600 dark:text-emerald-500 transition-all duration-300 shadow-sm cursor-pointer flex items-center justify-center shrink-0"
      title={theme === 'light' ? 'Switch to Dark Green Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};
