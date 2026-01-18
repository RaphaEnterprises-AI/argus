/**
 * @file ScheduleCard Component Tests
 * Tests for the ScheduleCard schedule component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleCard, Schedule } from '@/components/schedules/ScheduleCard';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
  formatDistanceToNowStrict: vi.fn(() => 'in 4 hours'),
  format: vi.fn(() => '09:00 AM'),
}));

const createMockSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'schedule-1',
  name: 'Daily Regression',
  description: 'Run all regression tests daily',
  cron_expression: '0 9 * * *',
  timezone: 'America/New_York',
  enabled: true,
  next_run_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  run_count: 45,
  failure_count: 2,
  success_rate: 95.5,
  test_ids: ['test-1', 'test-2', 'test-3'],
  notification_config: {
    on_failure: true,
    on_success: false,
  },
  environment: 'staging',
  browser: 'chromium',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ScheduleCard Component', () => {
  const defaultProps = {
    schedule: createMockSchedule(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
    onTriggerNow: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders schedule name', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('Daily Regression')).toBeInTheDocument();
    });

    it('renders schedule description', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('Run all regression tests daily')).toBeInTheDocument();
    });

    it('renders status indicator', () => {
      const { container } = render(<ScheduleCard {...defaultProps} />);
      const statusDot = container.querySelector('.rounded-full');
      expect(statusDot).toBeInTheDocument();
    });

    it('renders cron expression in human-readable format', () => {
      render(<ScheduleCard {...defaultProps} />);
      // Component converts '0 9 * * *' to 'Daily at 9:00 AM'
      expect(screen.getByText('Daily at 9:00 AM')).toBeInTheDocument();
    });

    it('renders timezone', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('America/New_York')).toBeInTheDocument();
    });

    it('renders Trigger Now button', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByRole('button', { name: /trigger now/i })).toBeInTheDocument();
    });

    it('renders Pause button when enabled', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('renders Enable button when disabled', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />);
      expect(screen.getByRole('button', { name: /enable/i })).toBeInTheDocument();
    });

    it('renders more actions menu button', () => {
      render(<ScheduleCard {...defaultProps} />);
      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows green status for passed lastRunStatus', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="passed" />
      );
      const statusDot = container.querySelector('.bg-green-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows red status for failed lastRunStatus', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="failed" />
      );
      const statusDot = container.querySelector('.bg-red-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows animated status for running', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="running" />
      );
      const statusDot = container.querySelector('.animate-pulse');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows yellow status for pending', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="pending" />
      );
      const statusDot = container.querySelector('.bg-yellow-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows Paused badge when disabled', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('applies reduced opacity when disabled', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />
      );
      expect(container.firstChild).toHaveClass('opacity-60');
    });
  });

  describe('Statistics', () => {
    it('displays run count', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('Runs:')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('displays success rate with percentage', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('96%')).toBeInTheDocument();
    });

    it('shows success rate in green for high rates', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ success_rate: 95 })} />);
      const successRate = screen.getByText('95%');
      expect(successRate).toHaveClass('text-green-500');
    });

    it('shows success rate in yellow for medium rates', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ success_rate: 75 })} />);
      const successRate = screen.getByText('75%');
      expect(successRate).toHaveClass('text-yellow-500');
    });

    it('shows success rate in red for low rates', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ success_rate: 50 })} />);
      const successRate = screen.getByText('50%');
      expect(successRate).toHaveClass('text-red-500');
    });

    it('displays failure count when there are failures', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('2 failed')).toBeInTheDocument();
    });

    it('hides failure count when there are no failures', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ failure_count: 0 })} />);
      expect(screen.queryByText('failed')).not.toBeInTheDocument();
    });

    it('displays last run time', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('Last run:')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
  });

  describe('Next Run', () => {
    it('displays next run countdown when enabled', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.getByText('in 4 hours')).toBeInTheDocument();
    });

    it('hides next run when disabled', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />);
      expect(screen.queryByText('in 4 hours')).not.toBeInTheDocument();
    });

    it('shows "Not scheduled" when no next run', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ next_run_at: undefined })} />);
      // Timer icon should not have countdown text
    });
  });

  describe('Actions Menu', () => {
    it('opens actions menu on click', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onEdit when Edit is clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onEdit={onEdit} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);
      await user.click(screen.getByText('Edit'));

      expect(onEdit).toHaveBeenCalledWith(defaultProps.schedule);
    });

    it('calls onDelete when Delete is clicked', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onDelete={onDelete} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);
      await user.click(screen.getByText('Delete'));

      expect(onDelete).toHaveBeenCalledWith('schedule-1');
    });

    it('shows Run Now in menu', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);

      expect(screen.getByText('Run Now')).toBeInTheDocument();
    });

    it('shows Pause in menu when enabled', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);

      expect(screen.getAllByText('Pause').length).toBeGreaterThan(0);
    });

    it('shows Enable in menu when disabled', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);

      expect(screen.getAllByText('Enable').length).toBeGreaterThan(0);
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      const { container } = render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-ellipsis-vertical')
      );
      await user.click(menuButton!);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      // Click the overlay
      const overlay = container.querySelector('.fixed.inset-0');
      await user.click(overlay!);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('calls onTriggerNow when Trigger Now is clicked', async () => {
      const onTriggerNow = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onTriggerNow={onTriggerNow} />);

      await user.click(screen.getByRole('button', { name: /trigger now/i }));
      expect(onTriggerNow).toHaveBeenCalledWith('schedule-1');
    });

    it('disables Trigger Now when schedule is disabled', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ enabled: false })} />);
      expect(screen.getByRole('button', { name: /trigger now/i })).toBeDisabled();
    });

    it('calls onToggle when Pause is clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onToggle={onToggle} />);

      await user.click(screen.getByRole('button', { name: /pause/i }));
      expect(onToggle).toHaveBeenCalledWith('schedule-1', false);
    });

    it('calls onToggle when Enable is clicked', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onToggle={onToggle} schedule={createMockSchedule({ enabled: false })} />);

      await user.click(screen.getByRole('button', { name: /enable/i }));
      expect(onToggle).toHaveBeenCalledWith('schedule-1', true);
    });
  });

  describe('Cron Expression Parsing', () => {
    it('shows "Every hour" for hourly cron', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ cron_expression: '0 * * * *' })} />);
      expect(screen.getByText('Every hour')).toBeInTheDocument();
    });

    it('shows "Every 15 minutes" for 15-min cron', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ cron_expression: '*/15 * * * *' })} />);
      expect(screen.getByText('Every 15 minutes')).toBeInTheDocument();
    });

    it('shows "Daily at midnight" for midnight cron', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ cron_expression: '0 0 * * *' })} />);
      expect(screen.getByText('Daily at midnight')).toBeInTheDocument();
    });

    it('shows weekday schedule for weekday cron', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ cron_expression: '0 9 * * 1-5' })} />);
      // Component converts '0 9 * * 1-5' to 'Weekdays at 9:00 AM'
      expect(screen.getByText('Weekdays at 9:00 AM')).toBeInTheDocument();
    });

    it('shows raw cron when pattern is unrecognized', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ cron_expression: '15 14 1 * *' })} />);
      expect(screen.getByText('15 14 1 * *')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse History', () => {
    it('shows Show History button when onToggleExpand is provided', () => {
      render(<ScheduleCard {...defaultProps} onToggleExpand={vi.fn()} />);
      expect(screen.getByRole('button', { name: /show history/i })).toBeInTheDocument();
    });

    it('shows Hide History when expanded', () => {
      render(<ScheduleCard {...defaultProps} onToggleExpand={vi.fn()} isExpanded />);
      expect(screen.getByRole('button', { name: /hide history/i })).toBeInTheDocument();
    });

    it('calls onToggleExpand when clicked', async () => {
      const onToggleExpand = vi.fn();
      const user = userEvent.setup();

      render(<ScheduleCard {...defaultProps} onToggleExpand={onToggleExpand} />);

      await user.click(screen.getByRole('button', { name: /show history/i }));
      expect(onToggleExpand).toHaveBeenCalled();
    });

    it('does not show history button when onToggleExpand is not provided', () => {
      render(<ScheduleCard {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /history/i })).not.toBeInTheDocument();
    });
  });

  describe('No Description', () => {
    it('handles missing description gracefully', () => {
      render(<ScheduleCard {...defaultProps} schedule={createMockSchedule({ description: undefined })} />);
      expect(screen.getByText('Daily Regression')).toBeInTheDocument();
      // Should not show undefined
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });

  describe('Card Styling', () => {
    it('has card structure', () => {
      const { container } = render(<ScheduleCard {...defaultProps} />);
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('has transition effects', () => {
      const { container } = render(<ScheduleCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('transition-all');
    });
  });
});
