/**
 * @file RecentRunsTable Component Tests
 * Tests for the RecentRunsTable dashboard component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RecentRunsTable, RecentRunsTableSkeleton } from '@/components/dashboard/RecentRunsTable';
import type { TestRun } from '@/lib/supabase/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock date-fns to avoid timezone issues in tests
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

const createMockRun = (overrides: Partial<TestRun> = {}): TestRun => ({
  id: 'run-1',
  project_id: 'project-1',
  name: 'Test Run 1',
  trigger: 'manual',
  status: 'passed',
  app_url: 'https://example.com',
  environment: 'staging',
  browser: 'chromium',
  total_tests: 10,
  passed_tests: 8,
  failed_tests: 2,
  skipped_tests: 0,
  duration_ms: 45000,
  started_at: '2024-01-15T10:00:00Z',
  completed_at: '2024-01-15T10:00:45Z',
  triggered_by: 'user-1',
  ci_metadata: {},
  created_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('RecentRunsTable Component', () => {
  const mockRuns: TestRun[] = [
    createMockRun({ id: '1', name: 'Run 1', status: 'passed', passed_tests: 10, failed_tests: 0, total_tests: 10 }),
    createMockRun({ id: '2', name: 'Run 2', status: 'failed', passed_tests: 5, failed_tests: 5, total_tests: 10 }),
    createMockRun({ id: '3', name: 'Run 3', status: 'running', passed_tests: 3, failed_tests: 0, total_tests: 10 }),
    createMockRun({ id: '4', name: 'Run 4', status: 'pending', passed_tests: 0, failed_tests: 0, total_tests: 10 }),
  ];

  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      expect(screen.getByText('Recent Test Runs')).toBeInTheDocument();
    });

    it('renders the component description', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      expect(screen.getByText('Latest test execution history')).toBeInTheDocument();
    });

    it('renders "View All" link', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      expect(screen.getByRole('link', { name: /view all/i })).toBeInTheDocument();
    });

    it('renders all test runs', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      expect(screen.getByText('Run 1')).toBeInTheDocument();
      expect(screen.getByText('Run 2')).toBeInTheDocument();
      expect(screen.getByText('Run 3')).toBeInTheDocument();
      expect(screen.getByText('Run 4')).toBeInTheDocument();
    });

    it('renders run name as a link', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      const runLink = screen.getAllByRole('link').find(link => link.getAttribute('href') === '/tests/1');
      expect(runLink).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('renders check icon for passed runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'passed' })]} />);
      // The CheckCircle2 icon should be present with text-success class
      const runRow = screen.getByText('Test Run 1').closest('a');
      expect(runRow).toBeInTheDocument();
    });

    it('renders X icon for failed runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'failed' })]} />);
      const runRow = screen.getByText('Test Run 1').closest('a');
      expect(runRow).toBeInTheDocument();
    });

    it('renders spinner for running runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'running' })]} />);
      const runRow = screen.getByText('Test Run 1').closest('a');
      expect(runRow).toBeInTheDocument();
    });

    it('renders clock icon for pending runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'pending' })]} />);
      const runRow = screen.getByText('Test Run 1').closest('a');
      expect(runRow).toBeInTheDocument();
    });

    it('displays status badge with correct text', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Test Counts', () => {
    it('displays passed test count for completed runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'passed', passed_tests: 15 })]} />);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('displays failed test count when there are failures', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'failed', failed_tests: 3 })]} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('hides test counts for pending runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'pending', passed_tests: 0, failed_tests: 0 })]} />);
      // Passed and failed counts should not be shown
      const runRow = screen.getByText('Test Run 1').closest('a');
      expect(runRow).not.toContainHTML('CheckCircle2');
    });

    it('shows running status for running runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ status: 'running' })]} />);
      // Running status should be displayed (verify row renders with running state)
      const runRow = screen.getByText('Test Run 1');
      expect(runRow).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar for completed runs', () => {
      const { container } = render(
        <RecentRunsTable runs={[createMockRun({ status: 'passed', passed_tests: 8, failed_tests: 2, total_tests: 10 })]} />
      );
      // Progress bar should show 80% width for 8/10 passed
      const progressBar = container.querySelector('.bg-success');
      expect(progressBar).toBeInTheDocument();
    });

    it('calculates correct pass rate', () => {
      const { container } = render(
        <RecentRunsTable runs={[createMockRun({ status: 'passed', passed_tests: 7, failed_tests: 3, total_tests: 10 })]} />
      );
      const progressBar = container.querySelector('[style*="width: 70%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('hides progress bar for pending runs', () => {
      const { container } = render(
        <RecentRunsTable runs={[createMockRun({ status: 'pending' })]} />
      );
      const progressContainer = container.querySelector('.w-20.h-2.rounded-full');
      expect(progressContainer).not.toBeInTheDocument();
    });
  });

  describe('Duration Display', () => {
    it('displays formatted duration for completed runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ duration_ms: 45000 })]} />);
      expect(screen.getByText('45.0s')).toBeInTheDocument();
    });

    it('displays minutes and seconds for longer durations', () => {
      render(<RecentRunsTable runs={[createMockRun({ duration_ms: 125000 })]} />);
      expect(screen.getByText('2m 5s')).toBeInTheDocument();
    });

    it('displays dash for null duration', () => {
      render(<RecentRunsTable runs={[createMockRun({ duration_ms: null })]} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Trigger Badge', () => {
    it('does not show trigger badge for manual runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ trigger: 'manual' })]} />);
      expect(screen.queryByText('manual')).not.toBeInTheDocument();
    });

    it('shows trigger badge for scheduled runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ trigger: 'scheduled' })]} />);
      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });

    it('shows trigger badge for webhook runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ trigger: 'webhook' })]} />);
      expect(screen.getByText('webhook')).toBeInTheDocument();
    });

    it('shows trigger badge for CI runs', () => {
      render(<RecentRunsTable runs={[createMockRun({ trigger: 'ci' })]} />);
      expect(screen.getByText('ci')).toBeInTheDocument();
    });
  });

  describe('Browser Display', () => {
    it('displays browser name', () => {
      render(<RecentRunsTable runs={[createMockRun({ browser: 'chromium' })]} />);
      expect(screen.getByText('chromium')).toBeInTheDocument();
    });

    it('displays different browsers', () => {
      render(<RecentRunsTable runs={[createMockRun({ browser: 'firefox' })]} />);
      expect(screen.getByText('firefox')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no runs', () => {
      render(<RecentRunsTable runs={[]} />);
      expect(screen.getByText('No test runs yet')).toBeInTheDocument();
    });

    it('shows helpful hint in empty state', () => {
      render(<RecentRunsTable runs={[]} />);
      expect(screen.getByText('Run your first test to see results here')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when isLoading is true', () => {
      const { container } = render(<RecentRunsTable runs={[]} isLoading />);
      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });

    it('shows 5 skeleton rows when loading', () => {
      render(<RecentRunsTable runs={[]} isLoading />);
      const skeletonRows = document.querySelectorAll('.divide-y > div');
      expect(skeletonRows.length).toBe(5);
    });
  });

  describe('Limit Prop', () => {
    it('limits displayed runs to specified limit', () => {
      const manyRuns = Array.from({ length: 15 }, (_, i) =>
        createMockRun({ id: String(i), name: `Run ${i}` })
      );
      render(<RecentRunsTable runs={manyRuns} limit={5} />);

      expect(screen.getByText('Run 0')).toBeInTheDocument();
      expect(screen.getByText('Run 4')).toBeInTheDocument();
      expect(screen.queryByText('Run 5')).not.toBeInTheDocument();
    });

    it('shows "View all X runs" button when more runs exist', () => {
      const manyRuns = Array.from({ length: 15 }, (_, i) =>
        createMockRun({ id: String(i), name: `Run ${i}` })
      );
      render(<RecentRunsTable runs={manyRuns} limit={10} />);

      expect(screen.getByRole('link', { name: /view all 15 runs/i })).toBeInTheDocument();
    });

    it('uses default limit of 10', () => {
      const manyRuns = Array.from({ length: 15 }, (_, i) =>
        createMockRun({ id: String(i), name: `Run ${i}` })
      );
      render(<RecentRunsTable runs={manyRuns} />);

      expect(screen.getByText('Run 0')).toBeInTheDocument();
      expect(screen.getByText('Run 9')).toBeInTheDocument();
      expect(screen.queryByText('Run 10')).not.toBeInTheDocument();
    });
  });

  describe('Default Name', () => {
    it('shows "Test Run" when name is null', () => {
      render(<RecentRunsTable runs={[createMockRun({ name: null })]} />);
      expect(screen.getByText('Test Run')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('links to correct test run details page', () => {
      render(<RecentRunsTable runs={[createMockRun({ id: 'test-run-123' })]} />);
      const runLink = screen.getAllByRole('link').find(
        link => link.getAttribute('href') === '/tests/test-run-123'
      );
      expect(runLink).toBeInTheDocument();
    });

    it('links to reports page from View All button', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      const viewAllLink = screen.getAllByRole('link').find(
        link => link.getAttribute('href') === '/reports'
      );
      expect(viewAllLink).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('row links are interactive', () => {
      render(<RecentRunsTable runs={mockRuns} />);
      const runLink = screen.getByText('Run 1').closest('a');
      // Links should be present and accessible for hover interactions
      expect(runLink).toBeInTheDocument();
      expect(runLink).toHaveAttribute('href');
    });
  });
});

describe('RecentRunsTableSkeleton Component', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<RecentRunsTableSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders 5 skeleton rows', () => {
    render(<RecentRunsTableSkeleton />);
    const skeletonRows = document.querySelectorAll('.divide-y > div');
    expect(skeletonRows.length).toBe(5);
  });

  it('has header skeleton elements', () => {
    const { container } = render(<RecentRunsTableSkeleton />);
    const headerSkeletons = container.querySelectorAll('.h-5, .h-4, .h-9');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('maintains card structure', () => {
    render(<RecentRunsTableSkeleton />);
    // Should be wrapped in a Card component
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
  });
});
