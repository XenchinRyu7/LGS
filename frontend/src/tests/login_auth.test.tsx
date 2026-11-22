import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginPage } from '../components/auth/LoginPage';
import { LogisticsApi } from '../lib/api';

describe('LoginPage Component', () => {
  it('renders clean corporate login card and credentials inputs without public register', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByText(/Sign In to ELGS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toBeInTheDocument();
    // Public register must not exist
    expect(screen.queryByRole('button', { name: /^Register/i })).not.toBeInTheDocument();
  });

  it('authenticates Project Manager on corporate form submission', async () => {
    const onLoginSuccess = vi.fn();
    vi.spyOn(LogisticsApi, 'login').mockResolvedValueOnce({
      user: {
        user_id: '00000000-0000-4000-8000-000000000006',
        full_name: 'Hendra Wijaya',
        email: 'hendra.wijaya@elgs.ethereal.co.id',
        role: 'ProjectManager',
        department: 'Supply Chain & Project Delivery',
      },
      permissions: ['*'],
      token: 'elgs_session_test',
    });

    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('auth-submit-btn');

    fireEvent.change(emailInput, { target: { value: 'hendra.wijaya@elgs.ethereal.co.id' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ProjectManager',
          email: 'hendra.wijaya@elgs.ethereal.co.id',
        })
      );
    });
  });

  it('rejects login with non-ethereal corporate email domain', async () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('auth-submit-btn');

    fireEvent.change(emailInput, { target: { value: 'user@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Corporate access restricted: Email domain must be @elgs.ethereal.co.id/i)
    ).toBeInTheDocument();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });
});
