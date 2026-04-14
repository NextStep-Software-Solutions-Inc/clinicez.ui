'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { ModernUserButton } from '../avatar/ModernUserButton';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 18C8.68 18 6 15.32 6 12C6 8.68 8.68 6 12 6C15.32 6 18 8.68 18 12C18 15.32 15.32 18 12 18ZM12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16ZM12 2C12.55 2 13 1.55 13 1V0C13 0.45 12.55 0 12 0C11.45 0 11 0.45 11 1V2C11 1.55 11.45 2 12 2ZM12 22C11.45 22 11 22.45 11 23V24C11 23.55 11.45 23 12 23C12.55 23 13 23.45 13 24V23C13 22.45 12.55 22 12 22ZM2 12C2 11.45 1.55 11 1 11H0C0.45 11 1 11.45 1 12C1 12.55 1.55 13 2 13H1C1.55 13 2 12.55 2 12ZM22 12C22 12.55 22.45 13 23 13H24C23.55 13 23 12.55 23 12C23 11.45 22.45 11 22 11H23C22.45 11 22 11.45 22 12Z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <ModernUserButton isDark={isDark} />
    </div>
  );
}
