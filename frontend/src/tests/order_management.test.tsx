import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { OrderManagement } from '../components/modules/OrderManagement';

describe('OrderManagement Module', () => {
  it('renders order management header and search input', async () => {
    render(<OrderManagement />);
    expect(screen.getByPlaceholderText(/search order number/i)).toBeInTheDocument();
    expect(screen.getByText(/new sales order/i)).toBeInTheDocument();
  });

  it('renders seed orders in data table', async () => {
    render(<OrderManagement />);
    await waitFor(() => {
      expect(screen.getByText('ORD-20261122-ALPHA01')).toBeInTheDocument();
      expect(screen.getByText('PT Kimia Farma Diagnostics')).toBeInTheDocument();
    });
  });
});
