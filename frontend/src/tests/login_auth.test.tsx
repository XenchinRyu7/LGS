import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LoginPage } from '../components/auth/LoginPage';

describe('LoginPage Component', () => {
  it('renders clean login card and credentials inputs', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByText(/Sign In to ELGS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In/i })).toBeInTheDocument();
  });

  it('allows selecting demo persona', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const select = screen.getByLabelText(/Demo Persona/i);
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'LogisticsManager' } });
  });
});
