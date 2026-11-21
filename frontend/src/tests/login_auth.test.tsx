import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('authenticates user on form submission', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /^Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'diana.puspita@elgs.enterprise.id' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });
});
