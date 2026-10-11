import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { SummaryCard } from '../../src/components/common/SummaryCard';

describe('Frontend Component: SummaryCard', () => {
  it('renders value and label correctly', () => {
    render(
      <SummaryCard
        icon={Activity}
        value="1,420"
        label="Total Consultations"
        theme="teal"
      />
    );

    expect(screen.getByText('1,420')).toBeInTheDocument();
    expect(screen.getByText('Total Consultations')).toBeInTheDocument();
  });

  it('renders trend text when provided', () => {
    render(
      <SummaryCard
        icon={Activity}
        value="$54,200"
        label="Monthly Revenue"
        trendText="+12.5% from last month"
        theme="amber"
      />
    );

    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('from last month')).toBeInTheDocument();
  });

  it('applies blue theme colors properly', () => {
    const { container } = render(
      <SummaryCard
        icon={Activity}
        value="42"
        label="Active Doctors"
        theme="blue"
      />
    );

    const iconWrapper = container.querySelector('.bg-\\[\\#EBF5FE\\]');
    expect(iconWrapper).toBeInTheDocument();
  });
});
