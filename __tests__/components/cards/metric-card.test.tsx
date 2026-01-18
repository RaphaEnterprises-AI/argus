/**
 * Tests for MetricCard Component
 * @module __tests__/components/cards/metric-card.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/MetricCard';
import { TestTube, Activity, TrendingUp } from 'lucide-react';

describe('MetricCard Component', () => {
  const defaultProps = {
    title: 'Total Tests',
    value: 150,
    icon: <TestTube data-testid="metric-icon" />,
  };

  describe('Rendering', () => {
    it('renders title correctly', () => {
      render(<MetricCard {...defaultProps} />);

      expect(screen.getByText('Total Tests')).toBeInTheDocument();
    });

    it('renders numeric value correctly', () => {
      render(<MetricCard {...defaultProps} />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders string value correctly', () => {
      render(<MetricCard {...defaultProps} value="95%" />);

      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('renders icon correctly', () => {
      render(<MetricCard {...defaultProps} />);

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
    });

    it('renders within a card element', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const card = container.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<MetricCard {...defaultProps} isLoading={true} />);

      // Value should be replaced with skeleton
      expect(screen.queryByText('150')).not.toBeInTheDocument();
    });

    it('hides trend when isLoading', () => {
      render(
        <MetricCard
          {...defaultProps}
          isLoading={true}
          trend={{ value: 10, direction: 'up', period: 'vs last week' }}
        />
      );

      expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    });

    it('shows title even when loading', () => {
      render(<MetricCard {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Total Tests')).toBeInTheDocument();
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

    it('renders upward trend icon for direction up', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 10, direction: 'up', period: 'today' }}
        />
      );

      // The ArrowUpRight icon should be present
      const svg = container.querySelector('svg.h-3\\.5.w-3\\.5');
      expect(svg).toBeInTheDocument();
    });

    it('renders downward trend icon for direction down', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: -5, direction: 'down', period: 'today' }}
        />
      );

      // The ArrowDownRight icon should be present
      const svg = container.querySelector('svg.h-3\\.5.w-3\\.5');
      expect(svg).toBeInTheDocument();
    });

    it('renders neutral trend icon for direction neutral', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 0, direction: 'neutral', period: 'today' }}
        />
      );

      // The Minus icon should be present
      const svg = container.querySelector('svg.h-3\\.5.w-3\\.5');
      expect(svg).toBeInTheDocument();
    });

    it('formats positive trend values with plus sign', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: 25, direction: 'up', period: 'monthly' }}
        />
      );

      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('formats negative trend values without plus sign', () => {
      render(
        <MetricCard
          {...defaultProps}
          trend={{ value: -10, direction: 'down', period: 'daily' }}
        />
      );

      expect(screen.getByText('-10%')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('applies default color variant', () => {
      const { container } = render(<MetricCard {...defaultProps} color="default" />);

      const iconContainer = container.querySelector('.bg-muted\\/50');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies success color variant', () => {
      render(<MetricCard {...defaultProps} color="success" />);

      const value = screen.getByText('150');
      expect(value).toHaveClass('text-success');
    });

    it('applies warning color variant', () => {
      render(<MetricCard {...defaultProps} color="warning" />);

      const value = screen.getByText('150');
      expect(value).toHaveClass('text-warning');
    });

    it('applies error color variant', () => {
      render(<MetricCard {...defaultProps} color="error" />);

      const value = screen.getByText('150');
      expect(value).toHaveClass('text-error');
    });

    it('applies info color variant', () => {
      render(<MetricCard {...defaultProps} color="info" />);

      const value = screen.getByText('150');
      expect(value).toHaveClass('text-info');
    });
  });

  describe('Trend Color Logic', () => {
    it('shows green for upward trend with success color', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          color="success"
          trend={{ value: 10, direction: 'up', period: 'today' }}
        />
      );

      const trendElement = container.querySelector('.text-success');
      expect(trendElement).toBeInTheDocument();
    });

    it('shows red for downward trend with success color', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          color="success"
          trend={{ value: -5, direction: 'down', period: 'today' }}
        />
      );

      const trendElement = container.querySelector('.text-error');
      expect(trendElement).toBeInTheDocument();
    });

    it('shows green for downward trend with error color (less failures is good)', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          color="error"
          trend={{ value: -20, direction: 'down', period: 'today' }}
        />
      );

      const trendContainer = screen.getByText('-20%').closest('div');
      expect(trendContainer).toHaveClass('text-success');
    });

    it('shows red for upward trend with error color (more failures is bad)', () => {
      const { container } = render(
        <MetricCard
          {...defaultProps}
          color="error"
          trend={{ value: 15, direction: 'up', period: 'today' }}
        />
      );

      const trendContainer = screen.getByText('+15%').closest('div');
      expect(trendContainer).toHaveClass('text-error');
    });
  });

  describe('Styling', () => {
    it('has hover effect class', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const card = container.querySelector('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
    });

    it('has transition class', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const card = container.querySelector('.transition-shadow');
      expect(card).toBeInTheDocument();
    });

    it('icon container has scale transition on hover', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const iconContainer = container.querySelector('.group-hover\\:scale-110');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Decorative Elements', () => {
    it('has decorative gradient line', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const gradientLine = container.querySelector('.bg-gradient-to-r');
      expect(gradientLine).toBeInTheDocument();
    });

    it('gradient line appears on hover', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      const gradientLine = container.querySelector('.group-hover\\:opacity-100');
      expect(gradientLine).toBeInTheDocument();
    });
  });
});

describe('MetricCardSkeleton Component', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<MetricCardSkeleton />);

    expect(container.querySelector('.rounded-lg.border')).toBeInTheDocument();
  });

  it('renders multiple animated skeleton elements', () => {
    const { container } = render(<MetricCardSkeleton />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('renders skeleton for title', () => {
    const { container } = render(<MetricCardSkeleton />);

    const titleSkeleton = container.querySelector('.h-4.w-20.bg-muted.animate-pulse');
    expect(titleSkeleton).toBeInTheDocument();
  });

  it('renders skeleton for value', () => {
    const { container } = render(<MetricCardSkeleton />);

    const valueSkeleton = container.querySelector('.h-8.w-24.bg-muted.animate-pulse');
    expect(valueSkeleton).toBeInTheDocument();
  });

  it('renders skeleton for icon container', () => {
    const { container } = render(<MetricCardSkeleton />);

    const iconSkeleton = container.querySelector('.h-12.w-12.bg-muted.animate-pulse');
    expect(iconSkeleton).toBeInTheDocument();
  });

  it('renders skeleton for trend', () => {
    const { container } = render(<MetricCardSkeleton />);

    const trendSkeleton = container.querySelector('.h-3.w-16.bg-muted.animate-pulse');
    expect(trendSkeleton).toBeInTheDocument();
  });

  it('has same card styling as MetricCard', () => {
    const { container: skeletonContainer } = render(<MetricCardSkeleton />);
    const { container: cardContainer } = render(
      <MetricCard title="Test" value={0} icon={<Activity />} />
    );

    const skeletonCard = skeletonContainer.querySelector('.p-4');
    const metricCard = cardContainer.querySelector('.p-4');

    expect(skeletonCard).toBeInTheDocument();
    expect(metricCard).toBeInTheDocument();
  });
});

describe('Integration', () => {
  it('renders multiple metric cards correctly', () => {
    render(
      <div>
        <MetricCard
          title="Pass Rate"
          value="95%"
          icon={<TrendingUp />}
          color="success"
          trend={{ value: 5, direction: 'up', period: 'vs last week' }}
        />
        <MetricCard
          title="Failed Tests"
          value={3}
          icon={<Activity />}
          color="error"
          trend={{ value: -2, direction: 'down', period: 'vs yesterday' }}
        />
        <MetricCard title="Total Runs" value={250} icon={<TestTube />} />
      </div>
    );

    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Failed Tests')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Runs')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('displays different trend directions correctly', () => {
    render(
      <div>
        <MetricCard
          title="Up Trend"
          value={100}
          icon={<Activity />}
          trend={{ value: 10, direction: 'up', period: 'weekly' }}
        />
        <MetricCard
          title="Down Trend"
          value={50}
          icon={<Activity />}
          trend={{ value: -5, direction: 'down', period: 'daily' }}
        />
        <MetricCard
          title="Neutral"
          value={75}
          icon={<Activity />}
          trend={{ value: 0, direction: 'neutral', period: 'monthly' }}
        />
      </div>
    );

    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
