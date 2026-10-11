import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, LoadingSpinner } from '../../src/components/common/EmptyState';

describe('Frontend Component: EmptyState and LoadingSpinner', () => {
  it('renders title and description properly', () => {
    render(
      <EmptyState
        title="No Appointments Found"
        description="You have no upcoming appointments scheduled."
      />
    );

    expect(screen.getByText('No Appointments Found')).toBeInTheDocument();
    expect(screen.getByText('You have no upcoming appointments scheduled.')).toBeInTheDocument();
  });

  it('renders action button and invokes onAction callback', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Prescriptions"
        description="No active prescriptions found."
        actionText="Schedule Visit"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Schedule Visit' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders LoadingSpinner with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading records...')).toBeInTheDocument();
  });

  it('renders LoadingSpinner with custom message', () => {
    render(<LoadingSpinner message="Retrieving laboratory results..." />);
    expect(screen.getByText('Retrieving laboratory results...')).toBeInTheDocument();
  });
});
