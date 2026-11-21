import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AuditTrailConsole } from '../components/modules/AuditTrailConsole';

describe('AuditTrailConsole Module', () => {
  it('renders SOC-2 compliance console header and badge', async () => {
    render(<AuditTrailConsole />);
    expect(screen.getByText(/SOC-2 & SoD Tamper-Evident Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/NON-REPUDIATION HASHED/i)).toBeInTheDocument();
  });

  it('renders seed audit logs and audit actions filter', async () => {
    render(<AuditTrailConsole />);
    await waitFor(() => {
      expect(screen.getAllByText(/Alexander Hartono/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/ORDER_CREATED/i)).toBeInTheDocument();
      expect(screen.getByText(/Diana Puspita/i)).toBeInTheDocument();
    });
  });
});
