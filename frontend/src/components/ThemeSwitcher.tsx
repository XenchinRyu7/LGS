import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun } from 'lucide-react';

export const THEME_OPTIONS = [
  { id: 'default', label: 'Default Blue & Zinc', color: '#3b82f6' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', color: '#ec4899' },
  { id: 'light-green', label: 'Light Green Mint', color: '#10b981' },
  { id: 'zen-inspired-theme', label: 'Zen Inspired Slate', color: '#6366f1' },
];

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState('default');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Read persisted theme from localStorage
    const savedTheme = localStorage.getItem('lms_color_theme') || 'default';
    const savedMode = localStorage.getItem('lms_color_mode') !== 'light';
    setActiveTheme(savedTheme);
    setIsDarkMode(savedMode);
    applyTheme(savedTheme, savedMode);
  }, []);

  const applyTheme = (themeName: string, dark: boolean) => {
    // 1. Root data-color-theme attribute as prescribed in theming.mdx
    document.documentElement.setAttribute('data-color-theme', themeName);

    // 2. Mode class
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Dynamic stylesheet injection
    if (themeName === 'default') {
      const activeLink = document.getElementById('ethereal-active-theme');
      if (activeLink) activeLink.remove();
    } else {
      let link = document.getElementById('ethereal-active-theme') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = 'ethereal-active-theme';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `/themes/${themeName}.css`;
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem('lms_color_theme', newTheme);
    applyTheme(newTheme, isDarkMode);
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('lms_color_mode', nextMode ? 'dark' : 'light');
    applyTheme(activeTheme, nextMode);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-card-foreground shadow-sm">
        <Palette className="h-3.5 w-3.5 text-primary" />
        <label htmlFor="theme-select" className="sr-only">Select Theme</label>
        <select
          id="theme-select"
          value={activeTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
        >
          {THEME_OPTIONS.map((theme) => (
            <option key={theme.id} value={theme.id} className="bg-card text-card-foreground">
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label="Toggle dark mode"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-card-foreground hover:bg-muted transition-colors"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4 text-primary" />
        ) : (
          <Moon className="h-4 w-4 text-foreground" />
        )}
      </button>
    </div>
  );
}
