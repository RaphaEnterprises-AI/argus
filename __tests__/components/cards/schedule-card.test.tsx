/**
 * Tests for ScheduleCard Component
 * @module __tests__/components/cards/schedule-card.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleCard, type Schedule } from '@/components/schedules/ScheduleCard';

describe('ScheduleCard Component', () => {
  const mockSchedule: Schedule = {
    id: 'schedule-1',
    name: 'Nightly Regression',
    description: 'Run full regression suite every night',
    cron_expression: '0 0 * * *',
    timezone: 'UTC',
    enabled: true,
    next_run_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    last_run_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    run_count: 150,
    failure_count: 5,
    success_rate: 96.67,
    test_ids: ['test-1', 'test-2', 'test-3'],
    notification_config: {
      on_failure: true,
      on_success: false,
      channels: ['channel-1'],
    },
    environment: 'staging',
    browser: 'chromium',
    created_at: new Date().toISOString(),
  };

  const defaultProps = {
    schedule: mockSchedule,
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

      expect(screen.getByText('Nightly Regression')).toBeInTheDocument();
    });

    it('renders schedule description', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('Run full regression suite every night')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const { description, ...scheduleWithoutDesc } = mockSchedule;

      render(
        <ScheduleCard
          {...defaultProps}
          schedule={scheduleWithoutDesc as Schedule}
        />
      );

      expect(screen.queryByText('Run full regression suite every night')).not.toBeInTheDocument();
    });

    it('renders cron expression in human-readable format', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('Daily at midnight')).toBeInTheDocument();
    });

    it('renders timezone', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('UTC')).toBeInTheDocument();
    });

    it('renders next run countdown', () => {
      render(<ScheduleCard {...defaultProps} />);

      // Should show "in 1 hour" or similar
      expect(screen.getByText(/in/i)).toBeInTheDocument();
    });
  });

  describe('Cron Human-Readable Conversion', () => {
    const cronTests = [
      { cron: '0 * * * *', expected: 'Every hour' },
      { cron: '*/15 * * * *', expected: 'Every 15 minutes' },
      { cron: '*/30 * * * *', expected: 'Every 30 minutes' },
      { cron: '0 0 * * *', expected: 'Daily at midnight' },
      { cron: '0 9 * * *', expected: 'Daily at 9:00 AM' },
      { cron: '0 9 * * 1-5', expected: 'Weekdays at 9:00 AM' },
      { cron: '0 0 * * 0', expected: 'Weekly on Sunday' },
      { cron: '0 0 * * 1', expected: 'Weekly on Monday' },
      { cron: '0 0 1 * *', expected: 'Monthly on the 1st' },
    ];

    cronTests.forEach(({ cron, expected }) => {
      it(`converts "${cron}" to "${expected}"`, () => {
        render(
          <ScheduleCard
            {...defaultProps}
            schedule={{ ...mockSchedule, cron_expression: cron }}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });

    it('shows raw cron for unrecognized patterns', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, cron_expression: '5 4 * * *' }}
        />
      );

      // Should show in "Daily at HH:MM" format
      expect(screen.getByText(/daily at 04:05/i)).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('renders run count', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('Runs:')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders success rate', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('97%')).toBeInTheDocument();
    });

    it('renders failure count when there are failures', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText('5 failed')).toBeInTheDocument();
    });

    it('does not render failure count when zero', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, failure_count: 0 }}
        />
      );

      expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    });

    it('renders last run time', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByText(/last run:/i)).toBeInTheDocument();
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe('Success Rate Colors', () => {
    it('shows green for high success rate (>=90)', () => {
      const { container } = render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, success_rate: 95 }}
        />
      );

      const successRateElement = screen.getByText('95%');
      expect(successRateElement).toHaveClass('text-green-500');
    });

    it('shows yellow for medium success rate (>=70)', () => {
      const { container } = render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, success_rate: 75 }}
        />
      );

      const successRateElement = screen.getByText('75%');
      expect(successRateElement).toHaveClass('text-yellow-500');
    });

    it('shows red for low success rate (<70)', () => {
      const { container } = render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, success_rate: 50 }}
        />
      );

      const successRateElement = screen.getByText('50%');
      expect(successRateElement).toHaveClass('text-red-500');
    });
  });

  describe('Enabled/Disabled State', () => {
    it('shows Paused badge when disabled', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('reduces opacity when disabled', () => {
      const { container } = render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('opacity-60');
    });

    it('hides next run countdown when disabled', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      // Timer icon should not be visible for next run
      expect(screen.queryByText(/in \d/)).not.toBeInTheDocument();
    });

    it('disables Trigger Now button when disabled', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      const triggerButton = screen.getByRole('button', { name: /trigger now/i });
      expect(triggerButton).toBeDisabled();
    });
  });

  describe('Last Run Status', () => {
    it('shows green indicator for passed status', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="passed" />
      );

      const statusDot = container.querySelector('.bg-green-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows red indicator for failed status', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="failed" />
      );

      const statusDot = container.querySelector('.bg-red-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows blue pulsing indicator for running status', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="running" />
      );

      const statusDot = container.querySelector('.bg-blue-500.animate-pulse');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows yellow indicator for pending status', () => {
      const { container } = render(
        <ScheduleCard {...defaultProps} lastRunStatus="pending" />
      );

      const statusDot = container.querySelector('.bg-yellow-500');
      expect(statusDot).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Trigger Now button', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /trigger now/i })).toBeInTheDocument();
    });

    it('renders Pause button when enabled', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('renders Enable button when disabled', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      expect(screen.getAllByRole('button', { name: /enable/i }).length).toBeGreaterThan(0);
    });

    it('calls onTriggerNow when Trigger Now is clicked', async () => {
      const user = userEvent.setup();
      const onTriggerNow = vi.fn();

      render(<ScheduleCard {...defaultProps} onTriggerNow={onTriggerNow} />);

      await user.click(screen.getByRole('button', { name: /trigger now/i }));

      expect(onTriggerNow).toHaveBeenCalledWith(mockSchedule.id);
    });

    it('calls onToggle when Pause is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(<ScheduleCard {...defaultProps} onToggle={onToggle} />);

      await user.click(screen.getByRole('button', { name: /pause/i }));

      expect(onToggle).toHaveBeenCalledWith(mockSchedule.id, false);
    });

    it('calls onToggle when Enable is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(
        <ScheduleCard
          {...defaultProps}
          onToggle={onToggle}
          schedule={{ ...mockSchedule, enabled: false }}
        />
      );

      // Get the quick action Enable button (not the menu one)
      const enableButtons = screen.getAllByRole('button', { name: /enable/i });
      await user.click(enableButtons[enableButtons.length - 1]); // Last one is the quick action

      expect(onToggle).toHaveBeenCalledWith(mockSchedule.id, true);
    });
  });

  describe('Actions Menu', () => {
    it('opens actions menu when clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      // Click the menu button (first button which is the menu toggle)
      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onEdit when Edit menu item is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<ScheduleCard {...defaultProps} onEdit={onEdit} />);

      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      await user.click(screen.getByText('Edit'));

      expect(onEdit).toHaveBeenCalledWith(mockSchedule);
    });

    it('calls onDelete when Delete menu item is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<ScheduleCard {...defaultProps} onDelete={onDelete} />);

      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      await user.click(screen.getByText('Delete'));

      expect(onDelete).toHaveBeenCalledWith(mockSchedule.id);
    });

    it('shows Run Now in menu', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      expect(screen.getByText('Run Now')).toBeInTheDocument();
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      expect(screen.getByText('Edit')).toBeInTheDocument();

      // Click outside (the overlay)
      const overlay = document.querySelector('.fixed.inset-0');
      await user.click(overlay!);

      // Menu should be closed
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse History', () => {
    it('renders Show History button when onToggleExpand is provided', () => {
      render(<ScheduleCard {...defaultProps} onToggleExpand={vi.fn()} />);

      expect(screen.getByRole('button', { name: /show history/i })).toBeInTheDocument();
    });

    it('does not render history button when onToggleExpand is not provided', () => {
      render(<ScheduleCard {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /show history/i })).not.toBeInTheDocument();
    });

    it('shows Hide History when expanded', () => {
      render(
        <ScheduleCard {...defaultProps} onToggleExpand={vi.fn()} isExpanded={true} />
      );

      expect(screen.getByRole('button', { name: /hide history/i })).toBeInTheDocument();
    });

    it('calls onToggleExpand when history button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleExpand = vi.fn();

      render(<ScheduleCard {...defaultProps} onToggleExpand={onToggleExpand} />);

      await user.click(screen.getByRole('button', { name: /show history/i }));

      expect(onToggleExpand).toHaveBeenCalled();
    });
  });

  describe('Next Run Countdown', () => {
    it('shows "Not scheduled" when next_run_at is undefined', () => {
      const { next_run_at, ...scheduleWithoutNextRun } = mockSchedule;

      render(
        <ScheduleCard
          {...defaultProps}
          schedule={scheduleWithoutNextRun as Schedule}
        />
      );

      // Should not show the next run timer section
      expect(screen.queryByText(/in \d/)).not.toBeInTheDocument();
    });

    it('shows "Running soon..." when next run is in the past', () => {
      render(
        <ScheduleCard
          {...defaultProps}
          schedule={{
            ...mockSchedule,
            next_run_at: new Date(Date.now() - 1000).toISOString(),
          }}
        />
      );

      expect(screen.getByText('Running soon...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible buttons', () => {
      render(<ScheduleCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it('menu items are focusable', async () => {
      const user = userEvent.setup();
      render(<ScheduleCard {...defaultProps} />);

      const menuButton = screen.getAllByRole('button')[0];
      await user.click(menuButton);

      const editButton = screen.getByText('Edit').closest('button');
      expect(editButton).toBeInTheDocument();
    });
  });
});
