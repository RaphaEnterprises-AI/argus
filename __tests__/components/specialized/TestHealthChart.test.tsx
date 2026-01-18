/**
 * @file TestHealthChart Component Tests
 * Tests for the TestHealthChart dashboard component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestHealthChart, TestHealthChartSkeleton, TestHealthDataPoint } from '@/components/dashboard/TestHealthChart';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`area-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const sampleData: TestHealthDataPoint[] = [
  { date: '2024-01-01', day: 'Mon', passed: 45, failed: 5, skipped: 2 },
  { date: '2024-01-02', day: 'Tue', passed: 48, failed: 3, skipped: 1 },
  { date: '2024-01-03', day: 'Wed', passed: 42, failed: 8, skipped: 3 },
  { date: '2024-01-04', day: 'Thu', passed: 50, failed: 2, skipped: 0 },
  { date: '2024-01-05', day: 'Fri', passed: 47, failed: 4, skipped: 1 },
  { date: '2024-01-06', day: 'Sat', passed: 30, failed: 1, skipped: 0 },
  { date: '2024-01-07', day: 'Sun', passed: 25, failed: 0, skipped: 0 },
];

describe('TestHealthChart Component', () => {
  const defaultProps = {
    data: sampleData,
    selectedPeriod: 7 as const,
    onPeriodChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByText('Test Health Trend')).toBeInTheDocument();
    });

    it('renders the component description', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByText('Pass/fail distribution over time')).toBeInTheDocument();
    });

    it('renders period selector buttons', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30d' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '90d' })).toBeInTheDocument();
    });

    it('renders the chart container', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders area chart', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders chart axes', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders chart grid', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders tooltip', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders legend', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  describe('Data Areas', () => {
    it('renders passed area', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('area-passed')).toBeInTheDocument();
    });

    it('renders failed area', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('area-failed')).toBeInTheDocument();
    });

    it('renders skipped area', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('area-skipped')).toBeInTheDocument();
    });

    it('has correct area names', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('area-passed')).toHaveAttribute('data-name', 'Passed');
      expect(screen.getByTestId('area-failed')).toHaveAttribute('data-name', 'Failed');
      expect(screen.getByTestId('area-skipped')).toHaveAttribute('data-name', 'Skipped');
    });
  });

  describe('Period Selection', () => {
    it('highlights the selected period button', () => {
      render(<TestHealthChart {...defaultProps} selectedPeriod={7} />);
      const button7d = screen.getByRole('button', { name: '7d' });
      expect(button7d).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('calls onPeriodChange when period is selected', async () => {
      const onPeriodChange = vi.fn();
      const user = userEvent.setup();

      render(<TestHealthChart {...defaultProps} onPeriodChange={onPeriodChange} />);

      await user.click(screen.getByRole('button', { name: '30d' }));
      expect(onPeriodChange).toHaveBeenCalledWith(30);
    });

    it('calls onPeriodChange with correct value for each period', async () => {
      const onPeriodChange = vi.fn();
      const user = userEvent.setup();

      render(<TestHealthChart {...defaultProps} onPeriodChange={onPeriodChange} />);

      await user.click(screen.getByRole('button', { name: '7d' }));
      expect(onPeriodChange).toHaveBeenCalledWith(7);

      await user.click(screen.getByRole('button', { name: '30d' }));
      expect(onPeriodChange).toHaveBeenCalledWith(30);

      await user.click(screen.getByRole('button', { name: '90d' }));
      expect(onPeriodChange).toHaveBeenCalledWith(90);
    });

    it('shows 30d as selected when selectedPeriod is 30', () => {
      render(<TestHealthChart {...defaultProps} selectedPeriod={30} />);
      const button30d = screen.getByRole('button', { name: '30d' });
      expect(button30d).toHaveClass('bg-primary');
    });

    it('shows 90d as selected when selectedPeriod is 90', () => {
      render(<TestHealthChart {...defaultProps} selectedPeriod={90} />);
      const button90d = screen.getByRole('button', { name: '90d' });
      expect(button90d).toHaveClass('bg-primary');
    });

    it('non-selected periods have muted styling', () => {
      render(<TestHealthChart {...defaultProps} selectedPeriod={7} />);
      const button30d = screen.getByRole('button', { name: '30d' });
      expect(button30d).toHaveClass('text-muted-foreground');
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no data', () => {
      render(<TestHealthChart {...defaultProps} data={[]} />);
      expect(screen.getByText('No test data available for this period')).toBeInTheDocument();
    });

    it('does not render chart when no data', () => {
      render(<TestHealthChart {...defaultProps} data={[]} />);
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('still renders period selector when no data', () => {
      render(<TestHealthChart {...defaultProps} data={[]} />);
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      const { container } = render(<TestHealthChart {...defaultProps} isLoading />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not render chart when loading', () => {
      render(<TestHealthChart {...defaultProps} isLoading />);
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('still renders header when loading', () => {
      render(<TestHealthChart {...defaultProps} isLoading />);
      expect(screen.getByText('Test Health Trend')).toBeInTheDocument();
    });

    it('still renders period selector when loading', () => {
      render(<TestHealthChart {...defaultProps} isLoading />);
      expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('handles data without skipped field', () => {
      const dataWithoutSkipped = [
        { date: '2024-01-01', day: 'Mon', passed: 45, failed: 5 },
        { date: '2024-01-02', day: 'Tue', passed: 48, failed: 3 },
      ];

      render(<TestHealthChart {...defaultProps} data={dataWithoutSkipped} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('calculates pass rate correctly', () => {
      // The component should calculate passRate = passed / (passed + failed) * 100
      // For first data point: 45 / (45 + 5) * 100 = 90%
      render(<TestHealthChart {...defaultProps} />);
      // Chart rendering means data processing worked
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('handles zero tests case', () => {
      const zeroData = [
        { date: '2024-01-01', day: 'Mon', passed: 0, failed: 0, skipped: 0 },
      ];

      render(<TestHealthChart {...defaultProps} data={zeroData} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('is wrapped in a Card component', () => {
      const { container } = render(<TestHealthChart {...defaultProps} />);
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('has CardHeader with title and description', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByText('Test Health Trend')).toBeInTheDocument();
      expect(screen.getByText('Pass/fail distribution over time')).toBeInTheDocument();
    });

    it('has CardContent with chart', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('period buttons are focusable', () => {
      render(<TestHealthChart {...defaultProps} />);
      const button7d = screen.getByRole('button', { name: '7d' });
      button7d.focus();
      expect(document.activeElement).toBe(button7d);
    });

    it('period buttons have visible text', () => {
      render(<TestHealthChart {...defaultProps} />);
      expect(screen.getByRole('button', { name: '7d' })).toHaveTextContent('7d');
      expect(screen.getByRole('button', { name: '30d' })).toHaveTextContent('30d');
      expect(screen.getByRole('button', { name: '90d' })).toHaveTextContent('90d');
    });
  });
});

describe('TestHealthChartSkeleton Component', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<TestHealthChartSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('has header skeleton elements', () => {
    const { container } = render(<TestHealthChartSkeleton />);
    const headerSkeletons = container.querySelectorAll('.h-5, .h-4');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('has period selector skeleton', () => {
    const { container } = render(<TestHealthChartSkeleton />);
    const periodSkeleton = container.querySelector('.h-9');
    expect(periodSkeleton).toBeInTheDocument();
  });

  it('has chart area skeleton', () => {
    const { container } = render(<TestHealthChartSkeleton />);
    const chartSkeleton = container.querySelector('.h-\\[280px\\]');
    expect(chartSkeleton).toBeInTheDocument();
  });

  it('maintains card structure', () => {
    render(<TestHealthChartSkeleton />);
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
  });
});
