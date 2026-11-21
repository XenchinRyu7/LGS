import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

describe('ThemeSwitcher Component', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-color-theme');
    localStorage.clear();
  });

  it('renders theme selector and dark mode toggle', () => {
    render(<ThemeSwitcher />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    const toggleBtn = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('switches data-color-theme attribute on documentElement', () => {
    render(<ThemeSwitcher />);
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'cyberpunk' } });
    expect(document.documentElement.getAttribute('data-color-theme')).toBe('cyberpunk');
    expect(localStorage.getItem('lms_color_theme')).toBe('cyberpunk');

    fireEvent.change(select, { target: { value: 'light-green' } });
    expect(document.documentElement.getAttribute('data-color-theme')).toBe('light-green');
  });

  it('toggles dark mode class on documentElement', () => {
    render(<ThemeSwitcher />);
    const toggleBtn = screen.getByRole('button', { name: /toggle dark mode/i });

    // Initially dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle to light
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('lms_color_mode')).toBe('light');

    // Toggle back to dark
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('lms_color_mode')).toBe('dark');
  });
});
