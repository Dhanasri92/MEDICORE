import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../src/components/common/StatusBadge';

describe('Frontend Component: StatusBadge', () => {
  it('renders CONFIRMED status with appropriate styling', () => {
    render(<StatusBadge status="CONFIRMED" />);
    const badge = screen.getByText('CONFIRMED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-700');
  });

  it('renders CANCELLED status with danger styling', () => {
    render(<StatusBadge status="CANCELLED" />);
    const badge = screen.getByText('CANCELLED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-rose-700');
  });

  it('renders PAID status with emerald styling', () => {
    render(<StatusBadge status="PAID" />);
    const badge = screen.getByText('PAID');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-700');
  });

  it('renders PARTIALLY_PAID status with formatted label', () => {
    render(<StatusBadge status="PARTIALLY_PAID" />);
    expect(screen.getByText('PARTIALLY PAID')).toBeInTheDocument();
  });

  it('handles unknown status gracefully with default fallback', () => {
    render(<StatusBadge status="SOME_CUSTOM_STATUS" />);
    const badge = screen.getByText('SOME CUSTOM STATUS');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-gray-700');
  });

  it('renders small size when size="sm" is passed', () => {
    render(<StatusBadge status="PENDING" size="sm" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toHaveClass('px-2 py-0.5');
  });
});
