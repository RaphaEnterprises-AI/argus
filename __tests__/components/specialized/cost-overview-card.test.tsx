/**
 * Tests for CostOverviewCard Component
 * @module __tests__/components/specialized/cost-overview-card.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostOverviewCard, CostOverviewCardSkeleton, type CostOverviewData } from '@/components/infra/CostOverviewCard';

describe('CostOverviewCard Component', () => {
  const mockData: CostOverviewData = {
    currentMonthCost: 450,
    projectedMonthCost: 520,
    browserStackEquivalent: 2500,
    savingsPercentage: 79.2,
    totalNodes: 3,
    totalPods: 12,
  };

  describe('Rendering', () => {
    it('renders card title', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Infrastructure Cost Overview')).toBeInTheDocument();
    });

    it('renders card description', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(
        screen.getByText(/browser pool infrastructure costs and savings/i)
      ).toBeInTheDocument();
    });

    it('renders savings percentage badge', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('79% savings')).toBeInTheDocument();
    });

    it('renders nothing when data is null', () => {
      const { container } = render(<CostOverviewCard data={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders skeleton when loading', () => {
      const { container } = render(<CostOverviewCard data={mockData} isLoading={true} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Display', () => {
    it('renders current month cost', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Current Month')).toBeInTheDocument();
      expect(screen.getByText('$450')).toBeInTheDocument();
    });

    it('renders projected month cost', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText(/projected: \$520/i)).toBeInTheDocument();
    });

    it('renders BrowserStack equivalent cost', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('BrowserStack Equivalent')).toBeInTheDocument();
      expect(screen.getByText('$2,500')).toBeInTheDocument();
    });

    it('renders savings amount', () => {
      render(<CostOverviewCard data={mockData} />);

      // $2500 - $520 = $1980
      expect(screen.getByText(/you save \$1,980\/month/i)).toBeInTheDocument();
    });
  });

  describe('Infrastructure Stats', () => {
    it('renders total nodes count', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Active Nodes')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Kubernetes nodes')).toBeInTheDocument();
    });

    it('renders total pods count', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Browser Pods')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Selenium Grid pods')).toBeInTheDocument();
    });
  });

  describe('Savings Bar', () => {
    it('renders cost comparison section', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Cost Comparison')).toBeInTheDocument();
      expect(screen.getByText('Self-hosted vs BrowserStack')).toBeInTheDocument();
    });

    it('renders self-hosted cost label', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText(/self-hosted: \$520/i)).toBeInTheDocument();
    });

    it('renders BrowserStack cost label in bar', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText(/browserstack: \$2,500/i)).toBeInTheDocument();
    });

    it('renders progress bar with correct width', () => {
      const { container } = render(<CostOverviewCard data={mockData} />);

      const progressBar = container.querySelector('.bg-gradient-to-r.from-success');
      expect(progressBar).toBeInTheDocument();
      // Width should be approximately 100 - 79.2 = 20.8% (accounting for floating point)
      const style = progressBar?.getAttribute('style') || '';
      const widthMatch = style.match(/width:\s*([\d.]+)%/);
      expect(widthMatch).not.toBeNull();
      const width = parseFloat(widthMatch![1]);
      expect(width).toBeCloseTo(20.8, 1);
    });
  });

  describe('Currency Formatting', () => {
    it('formats small amounts without decimals', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            currentMonthCost: 50,
          }}
        />
      );

      expect(screen.getByText('$50')).toBeInTheDocument();
    });

    it('formats large amounts with comma separators', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            browserStackEquivalent: 12500,
          }}
        />
      );

      expect(screen.getByText('$12,500')).toBeInTheDocument();
    });

    it('formats very large amounts correctly', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            browserStackEquivalent: 125000,
          }}
        />
      );

      expect(screen.getByText('$125,000')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero costs', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            currentMonthCost: 0,
            projectedMonthCost: 0,
          }}
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('handles zero nodes', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            totalNodes: 0,
            totalPods: 0,
          }}
        />
      );

      expect(screen.getAllByText('0').length).toBe(2);
    });

    it('handles 100% savings', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            savingsPercentage: 100,
            projectedMonthCost: 0,
          }}
        />
      );

      expect(screen.getByText('100% savings')).toBeInTheDocument();
    });

    it('rounds savings percentage to whole number', () => {
      render(
        <CostOverviewCard
          data={{
            ...mockData,
            savingsPercentage: 79.6,
          }}
        />
      );

      expect(screen.getByText('80% savings')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('renders with full width (col-span-full)', () => {
      const { container } = render(<CostOverviewCard data={mockData} />);

      const card = container.firstChild;
      expect(card).toHaveClass('col-span-full');
    });

    it('renders icons', () => {
      const { container } = render(<CostOverviewCard data={mockData} />);

      // Should have DollarSign, TrendingDown, Server, and Cloud icons
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders savings badge with success color', () => {
      const { container } = render(<CostOverviewCard data={mockData} />);

      const savingsBadge = container.querySelector('.bg-success\\/10.text-success');
      expect(savingsBadge).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders 4 metric sections', () => {
      render(<CostOverviewCard data={mockData} />);

      expect(screen.getByText('Current Month')).toBeInTheDocument();
      expect(screen.getByText('BrowserStack Equivalent')).toBeInTheDocument();
      expect(screen.getByText('Active Nodes')).toBeInTheDocument();
      expect(screen.getByText('Browser Pods')).toBeInTheDocument();
    });
  });
});

describe('CostOverviewCardSkeleton Component', () => {
  describe('Rendering', () => {
    it('renders skeleton card', () => {
      const { container } = render(<CostOverviewCardSkeleton />);

      expect(container.firstChild).toHaveClass('col-span-full');
    });

    it('renders animated skeleton elements', () => {
      const { container } = render(<CostOverviewCardSkeleton />);

      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('renders skeleton for title', () => {
      const { container } = render(<CostOverviewCardSkeleton />);

      const titleSkeleton = container.querySelector('.h-6.w-64.bg-muted.animate-pulse');
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('renders skeleton for description', () => {
      const { container } = render(<CostOverviewCardSkeleton />);

      const descSkeleton = container.querySelector('.h-4.w-96.bg-muted.animate-pulse');
      expect(descSkeleton).toBeInTheDocument();
    });

    it('renders 4 metric skeletons', () => {
      const { container } = render(<CostOverviewCardSkeleton />);

      const metricSkeletons = container.querySelectorAll('.h-9.w-32.bg-muted.animate-pulse');
      expect(metricSkeletons.length).toBe(4);
    });
  });

  describe('Layout', () => {
    it('has same structure as loaded card', () => {
      const { container: skeletonContainer } = render(<CostOverviewCardSkeleton />);
      const { container: cardContainer } = render(
        <CostOverviewCard
          data={{
            currentMonthCost: 100,
            projectedMonthCost: 120,
            browserStackEquivalent: 500,
            savingsPercentage: 75,
            totalNodes: 2,
            totalPods: 8,
          }}
        />
      );

      // Both should have similar card structure
      expect(skeletonContainer.querySelector('.col-span-full')).toBeInTheDocument();
      expect(cardContainer.querySelector('.col-span-full')).toBeInTheDocument();
    });
  });
});

describe('Integration', () => {
  it('transitions from skeleton to loaded state', () => {
    const data: CostOverviewData = {
      currentMonthCost: 300,
      projectedMonthCost: 350,
      browserStackEquivalent: 1500,
      savingsPercentage: 76.67,
      totalNodes: 2,
      totalPods: 8,
    };

    const { rerender, container } = render(<CostOverviewCard data={data} isLoading={true} />);

    // Should show skeleton
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    // Rerender with loaded data
    rerender(<CostOverviewCard data={data} isLoading={false} />);

    // Should show actual data
    expect(screen.getByText('$300')).toBeInTheDocument();
    expect(screen.getByText('77% savings')).toBeInTheDocument();
  });

  it('handles data updates correctly', () => {
    const initialData: CostOverviewData = {
      currentMonthCost: 200,
      projectedMonthCost: 250,
      browserStackEquivalent: 1000,
      savingsPercentage: 75,
      totalNodes: 2,
      totalPods: 6,
    };

    const updatedData: CostOverviewData = {
      currentMonthCost: 300,
      projectedMonthCost: 350,
      browserStackEquivalent: 1000,
      savingsPercentage: 65,
      totalNodes: 3,
      totalPods: 10,
    };

    const { rerender } = render(<CostOverviewCard data={initialData} />);

    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    rerender(<CostOverviewCard data={updatedData} />);

    expect(screen.getByText('$300')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
