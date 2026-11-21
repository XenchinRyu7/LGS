import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LoginPage } from '../components/auth/LoginPage';

describe('LoginPage Component', () => {
  it('renders clean login card, credentials inputs, and quick personas', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByText(/Sign In to ELGS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Quick Persona Access/i)).toBeInTheDocument();
  });

  it('allows 1-click persona sign in for Diana Puspita', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const dianaBtn = screen.getByText('Diana Puspita').closest('button');
    expect(dianaBtn).toBeInTheDocument();
    if (dianaBtn) {
      fireEvent.click(dianaBtn);
    }
  });
});
