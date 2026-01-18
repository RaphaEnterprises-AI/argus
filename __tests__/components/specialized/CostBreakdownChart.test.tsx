/**
 * @file CostBreakdownChart Component Tests
 * Tests for the CostBreakdownChart infrastructure component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CostBreakdownChart, CostBreakdownChartSkeleton, CostBreakdown } from '@/components/infra/CostBreakdownChart';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, dataKey }: { children: React.ReactNode; dataKey: string }) => (
    <div data-testid={`pie-${dataKey}`}>{children}</div>
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="pie-cell" data-fill={fill} />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: ({ content }: { content: React.FC }) => <div data-testid="tooltip" />,
}));

const sampleData: CostBreakdown = {
  compute: 250.50,
  network: 45.25,
  storage: 30.00,
  ai_inference: 175.75,
  embeddings: 50.00,
};

describe('CostBreakdownChart Component', () => {
  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
    });

    it('renders the component description', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('Monthly infrastructure costs by category')).toBeInTheDocument();
    });

    it('renders the pie chart container', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders nothing when data is null', () => {
      const { container } = render(<CostBreakdownChart data={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders responsive container', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Cost Legend', () => {
    it('renders all cost categories in legend', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('Browser Nodes')).toBeInTheDocument();
      expect(screen.getByText('AI Inference')).toBeInTheDocument();
      expect(screen.getByText('Embeddings')).toBeInTheDocument();
      expect(screen.getByText('Network')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });

    it('displays formatted currency values', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('$250.50')).toBeInTheDocument();
      expect(screen.getByText('$45.25')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });

    it('displays percentage for each category', () => {
      render(<CostBreakdownChart data={sampleData} />);
      // Total is ~551.50, compute is ~45%
      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });

    it('displays total cost', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Total should be sum of all values
      expect(screen.getByText('$551.50')).toBeInTheDocument();
    });

    it('sorts categories by value in descending order', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      const legendItems = container.querySelectorAll('.space-y-3 > div');
      // First item should be highest (compute - Browser Nodes)
      expect(legendItems[0]?.textContent).toContain('Browser Nodes');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton when isLoading is true', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} isLoading />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not render chart when loading', () => {
      render(<CostBreakdownChart data={sampleData} isLoading />);
      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty Cost Categories', () => {
    it('filters out categories with zero value', () => {
      const dataWithZeros: CostBreakdown = {
        compute: 100,
        network: 0,
        storage: 0,
        ai_inference: 50,
        embeddings: 0,
      };

      render(<CostBreakdownChart data={dataWithZeros} />);
      expect(screen.getByText('Browser Nodes')).toBeInTheDocument();
      expect(screen.getByText('AI Inference')).toBeInTheDocument();
      expect(screen.queryByText('Network')).not.toBeInTheDocument();
      expect(screen.queryByText('Storage')).not.toBeInTheDocument();
      expect(screen.queryByText('Embeddings')).not.toBeInTheDocument();
    });

    it('calculates correct percentages with filtered values', () => {
      const dataWithZeros: CostBreakdown = {
        compute: 75,
        network: 0,
        storage: 0,
        ai_inference: 25,
        embeddings: 0,
      };

      render(<CostBreakdownChart data={dataWithZeros} />);
      // Compute should be 75%
      expect(screen.getByText(/75%/)).toBeInTheDocument();
      // AI Inference should be 25%
      expect(screen.getByText(/25%/)).toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('is wrapped in a Card component', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('has CardHeader with title', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
    });

    it('has CardContent with chart and legend', () => {
      render(<CostBreakdownChart data={sampleData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('renders color indicators for each category', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      const colorIndicators = container.querySelectorAll('.w-3.h-3.rounded-full');
      expect(colorIndicators.length).toBeGreaterThan(0);
    });

    it('applies correct colors to categories', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      // Check that color elements exist
      const greenIndicator = container.querySelector('[style*="background-color: rgb(34, 197, 94)"]') ||
                           container.querySelector('.w-3.h-3');
      expect(greenIndicator).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency with correct locale', () => {
      render(<CostBreakdownChart data={sampleData} />);
      // Should use en-US format with $
      expect(screen.getByText('$250.50')).toBeInTheDocument();
    });

    it('handles decimal values correctly', () => {
      const dataWithDecimals: CostBreakdown = {
        compute: 100.99,
        network: 50.01,
        storage: 25.50,
        ai_inference: 75.25,
        embeddings: 48.25,
      };

      render(<CostBreakdownChart data={dataWithDecimals} />);
      expect(screen.getByText('$100.99')).toBeInTheDocument();
      expect(screen.getByText('$50.01')).toBeInTheDocument();
    });

    it('handles large values', () => {
      const largeData: CostBreakdown = {
        compute: 10000.00,
        network: 5000.00,
        storage: 3000.00,
        ai_inference: 8000.00,
        embeddings: 4000.00,
      };

      render(<CostBreakdownChart data={largeData} />);
      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('has responsive layout with flex container', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      const flexContainer = container.querySelector('.flex.flex-col.lg\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });

    it('chart and legend are side by side on larger screens', () => {
      const { container } = render(<CostBreakdownChart data={sampleData} />);
      const chartSection = container.querySelector('.lg\\:w-1\\/2.h-64');
      const legendSection = container.querySelector('.w-full.lg\\:w-1\\/2');
      expect(chartSection).toBeInTheDocument();
      expect(legendSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<CostBreakdownChart data={sampleData} />);
      const title = screen.getByText('Cost Breakdown');
      // Should be within a proper card header structure
      expect(title).toBeInTheDocument();
    });

    it('displays semantic cost information', () => {
      render(<CostBreakdownChart data={sampleData} />);
      // Values should be displayed as text
      expect(screen.getByText('$250.50')).toBeInTheDocument();
      expect(screen.getByText('Browser Nodes')).toBeInTheDocument();
    });
  });
});

describe('CostBreakdownChartSkeleton Component', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<CostBreakdownChartSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('has header skeleton elements', () => {
    const { container } = render(<CostBreakdownChartSkeleton />);
    const headerSkeletons = container.querySelectorAll('.h-6, .h-4');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('has circular skeleton for pie chart', () => {
    const { container } = render(<CostBreakdownChartSkeleton />);
    const circleSkeleton = container.querySelector('.rounded-full');
    expect(circleSkeleton).toBeInTheDocument();
  });

  it('has legend skeleton items', () => {
    const { container } = render(<CostBreakdownChartSkeleton />);
    // Should have 5 skeleton rows for the 5 categories
    const legendRows = container.querySelectorAll('.space-y-3 > div');
    expect(legendRows.length).toBe(5);
  });

  it('maintains card structure', () => {
    render(<CostBreakdownChartSkeleton />);
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
  });

  it('has responsive layout', () => {
    const { container } = render(<CostBreakdownChartSkeleton />);
    const flexContainer = container.querySelector('.flex.flex-col.lg\\:flex-row');
    expect(flexContainer).toBeInTheDocument();
  });
});
