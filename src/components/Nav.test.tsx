import React from 'react';
import { render, screen } from '@testing-library/react';
import Nav from './Nav';

describe('Nav', () => {
  it('renders navigation links', () => {
    render(<Nav />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('BillGen')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Receipts')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });
});
