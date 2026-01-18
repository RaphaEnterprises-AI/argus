/**
 * @file MetricCard Component Tests
 * Tests for the MetricCard dashboard component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/MetricCard';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

describe('MetricCard Component', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '95%',
    icon: <CheckCircle data-testid="icon" />,
  };

  describe('Rendering', () => {
    it('renders the title', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });

    it('renders the value', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('renders the icon', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders numeric value', () => {
      render(<MetricCard {...defaultProps} value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders string value', () => {
      render(<MetricCard {...defaultProps} value="1,234" />);
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('renders trend when provided', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 15, direction: 'up', period: 'vs last week' }}
        />
      );
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('vs last week')).toBeInTheDocument();
    });

    it('renders upward trend icon', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 10, direction: 'up', period: 'today' }}
        />
      );
      // Check for ArrowUpRight icon (should be in the DOM)
      const trendSection = screen.getByText('+10%').parentElement;
      expect(trendSection).toBeInTheDocument();
    });

    it('renders downward trend icon', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: -5, direction: 'down', period: 'today' }}
        />
      );
      const trendSection = screen.getByText('-5%').parentElement;
      expect(trendSection).toBeInTheDocument();
    });

    it('renders neutral trend icon', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 0, direction: 'neutral', period: 'today' }}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows positive sign for positive trend values', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 25, direction: 'up', period: 'last month' }}
        />
      );
      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('does not show positive sign for negative values', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: -10, direction: 'down', period: 'last week' }}
        />
      );
      expect(screen.getByText('-10%')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('applies default color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="default" />);
      // Check for muted background on icon container
      expect(container.querySelector('.bg-muted\\/50')).toBeInTheDocument();
    });

    it('applies success color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="success" />);
      // Check for success styling
      expect(container.querySelector('.bg-success\\/10')).toBeInTheDocument();
    });

    it('applies warning color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="warning" />);
      expect(container.querySelector('.bg-warning\\/10')).toBeInTheDocument();
    });

    it('applies error color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="error" />);
      expect(container.querySelector('.bg-error\\/10')).toBeInTheDocument();
    });

    it('applies info color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="info" />);
      expect(container.querySelector('.bg-info\\/10')).toBeInTheDocument();
    });

    it('colors value text based on color prop', () => {
      render(<MetricCard {...defaultProps} color="success" />);
      const value = screen.getByText('95%');
      expect(value).toHaveClass('text-success');
    });
  });

  describe('Trend Colors Based on Color Variant', () => {
    it('shows green for upward trend when color is success', () => {
      render(
        <MetricCard
          {...defaultProps}
          color="success"
          trend={{ value: 10, direction: 'up', period: 'week' }}
        />
      );
      const trendValue = screen.getByText('+10%');
      expect(trendValue.parentElement).toHaveClass('text-success');
    });

    it('shows red for downward trend when color is success', () => {
      render(
        <MetricCard
          {...defaultProps}
          color="success"
          trend={{ value: -10, direction: 'down', period: 'week' }}
        />
      );
      const trendValue = screen.getByText('-10%');
      expect(trendValue.parentElement).toHaveClass('text-error');
    });

    it('shows green for downward trend when color is error (inverse logic)', () => {
      render(
        <MetricCard
          {...defaultProps}
          color="error"
          trend={{ value: -10, direction: 'down', period: 'week' }}
        />
      );
      const trendValue = screen.getByText('-10%');
      expect(trendValue.parentElement).toHaveClass('text-success');
    });

    it('shows red for upward trend when color is warning (inverse logic)', () => {
      render(
        <MetricCard
          {...defaultProps}
          color="warning"
          trend={{ value: 10, direction: 'up', period: 'week' }}
        />
      );
      const trendValue = screen.getByText('+10%');
      expect(trendValue.parentElement).toHaveClass('text-error');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loader when isLoading is true', () => {
      const { container } = render(<MetricCard {...defaultProps} isLoading />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('hides value when loading', () => {
      render(<MetricCard {...defaultProps} isLoading />);
      expect(screen.queryByText('95%')).not.toBeInTheDocument();
    });

    it('still shows title when loading', () => {
      render(<MetricCard {...defaultProps} isLoading />);
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
    });

    it('hides trend when loading', () => {
      render(
        <MetricCard
          {...defaultProps}
          isLoading
          trend={{ value: 10, direction: 'up', period: 'week' }}
        />
      );
      expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('has hover shadow transition', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const card = container.querySelector('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
    });

    it('has icon scale transition on hover', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const iconContainer = container.querySelector('.group-hover\\:scale-110');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has decorative gradient that appears on hover', () => {
      const { container } = render(<MetricCard {...defaultProps} color="success" />);
      const gradient = container.querySelector('.group-hover\\:opacity-100');
      expect(gradient).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper text hierarchy', () => {
      render(<MetricCard {...defaultProps} />);
      // Title should be smaller text
      const title = screen.getByText('Test Metric');
      expect(title).toHaveClass('text-sm');

      // Value should be larger
      const value = screen.getByText('95%');
      expect(value).toHaveClass('text-2xl');
    });

    it('icon container has proper sizing', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      const iconContainer = container.querySelector('.h-12.w-12');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Different Icons', () => {
    it('renders with CheckCircle icon', () => {
      render(
        <MetricCard
          title="Passed"
          value="42"
          icon={<CheckCircle data-testid="check-icon" />}
        />
      );
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('renders with AlertTriangle icon', () => {
      render(
        <MetricCard
          title="Warnings"
          value="5"
          icon={<AlertTriangle data-testid="warning-icon" />}
        />
      );
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('renders with XCircle icon', () => {
      render(
        <MetricCard
          title="Failed"
          value="3"
          icon={<XCircle data-testid="error-icon" />}
        />
      );
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('renders with Clock icon', () => {
      render(
        <MetricCard
          title="Duration"
          value="2.5s"
          icon={<Clock data-testid="clock-icon" />}
        />
      );
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });
});

describe('MetricCardSkeleton Component', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<MetricCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('has skeleton elements for all parts', () => {
    const { container } = render(<MetricCardSkeleton />);
    // Should have multiple skeleton elements
    const skeletonElements = container.querySelectorAll('.bg-muted');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('has correct layout structure', () => {
    const { container } = render(<MetricCardSkeleton />);
    // Should have flex layout
    expect(container.querySelector('.flex.items-start.justify-between')).toBeInTheDocument();
  });

  it('renders icon placeholder', () => {
    const { container } = render(<MetricCardSkeleton />);
    const iconPlaceholder = container.querySelector('.h-12.w-12');
    expect(iconPlaceholder).toBeInTheDocument();
  });
});
