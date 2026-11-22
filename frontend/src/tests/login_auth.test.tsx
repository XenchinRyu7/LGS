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
    expect(screen.getByTestId('auth-submit-btn')).toBeInTheDocument();
  });

  it('authenticates user on form submission with @elgs.ethereal.co.id domain', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('auth-submit-btn');

    fireEvent.change(emailInput, { target: { value: 'diana.puspita@elgs.ethereal.co.id' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });

  it('toggles to register mode and validates full name and ethereal domain', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const registerTab = screen.getByRole('button', { name: /^Register/i });
    fireEvent.click(registerTab);

    expect(screen.getByText(/Create ELGS Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitBtn = screen.getByTestId('auth-submit-btn');

    fireEvent.change(nameInput, { target: { value: 'Budi Santoso' } });
    fireEvent.change(emailInput, { target: { value: 'budi.santoso@elgs.ethereal.co.id' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });
});
