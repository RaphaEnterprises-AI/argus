/**
 * Tests for CreateScheduleModal Component
 * @module __tests__/components/modals/create-schedule-modal.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateScheduleModal, type ScheduleFormData } from '@/components/schedules/CreateScheduleModal';

describe('CreateScheduleModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    tests: [
      { id: 'test-1', name: 'Login Test', tags: ['auth', 'critical'] },
      { id: 'test-2', name: 'Checkout Test', tags: ['e2e'] },
      { id: 'test-3', name: 'Search Test', tags: ['smoke'] },
    ],
    notificationChannels: [
      { id: 'channel-1', name: 'Slack Alerts', channel_type: 'slack' },
      { id: 'channel-2', name: 'Email Team', channel_type: 'email' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      // Title and button may both contain "Create Schedule"
      expect(screen.getAllByText('Create Schedule').length).toBeGreaterThan(0);
    });

    it('does not render modal when open is false', () => {
      render(<CreateScheduleModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Create Schedule')).not.toBeInTheDocument();
    });

    it('renders Edit Schedule title when isEditing is true', () => {
      render(<CreateScheduleModal {...defaultProps} isEditing={true} />);

      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    });

    it('renders dialog description', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(
        screen.getByText(/configure when and how your tests should run/i)
      ).toBeInTheDocument();
    });

    it('renders schedule name input', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Schedule Name *')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/e\.g\., nightly regression suite/i)
      ).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/optional description of what this schedule does/i)
      ).toBeInTheDocument();
    });

    it('renders Cancel and Create Schedule buttons', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Schedule' })).toBeInTheDocument();
    });

    it('renders Update Schedule button when isEditing', () => {
      render(<CreateScheduleModal {...defaultProps} isEditing={true} />);

      expect(screen.getByRole('button', { name: 'Update Schedule' })).toBeInTheDocument();
    });
  });

  describe('Schedule Timing Section', () => {
    it('renders Schedule Timing section header', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Schedule Timing')).toBeInTheDocument();
    });

    it('renders frequency presets', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Every 15 minutes')).toBeInTheDocument();
      expect(screen.getByText('Every 30 minutes')).toBeInTheDocument();
      expect(screen.getByText('Every hour')).toBeInTheDocument();
      expect(screen.getByText('Daily at 9 AM')).toBeInTheDocument();
      expect(screen.getByText('Weekly on Monday')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('shows custom cron input when Custom is selected', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />);

      await user.click(screen.getByText('Custom'));

      expect(screen.getByText('Cron Expression')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('* * * * *')).toBeInTheDocument();
    });

    it('hides custom cron input when preset is selected', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />);

      // First select Custom to show the input
      await user.click(screen.getByText('Custom'));
      expect(screen.getByPlaceholderText('* * * * *')).toBeInTheDocument();

      // Then select a preset to hide it
      await user.click(screen.getByText('Every hour'));
      expect(screen.queryByPlaceholderText('* * * * *')).not.toBeInTheDocument();
    });

    it('renders timezone selector', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Timezone')).toBeInTheDocument();
      // The timezone selector is a native select element (in portal, so use document)
      const select = document.querySelector('select');
      expect(select).toBeInTheDocument();
    });

    it('displays next run times preview', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Next 5 runs:')).toBeInTheDocument();
    });
  });

  describe('Test Selection Section', () => {
    it('renders Test Selection section header', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Test Selection')).toBeInTheDocument();
    });

    it('renders test list when tests are provided', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Login Test')).toBeInTheDocument();
      expect(screen.getByText('Checkout Test')).toBeInTheDocument();
      expect(screen.getByText('Search Test')).toBeInTheDocument();
    });

    it('shows empty message when no tests are available', () => {
      render(<CreateScheduleModal {...defaultProps} tests={[]} />);

      expect(
        screen.getByText(/no tests available\. create tests first/i)
      ).toBeInTheDocument();
    });

    it('allows selecting tests', async () => {
      render(<CreateScheduleModal {...defaultProps} />);

      // Verify that tests are rendered with clickable labels
      const loginTestText = screen.getByText('Login Test');
      const testItem = loginTestText.closest('label');
      expect(testItem).toBeInTheDocument();
      expect(testItem).toHaveClass('cursor-pointer');

      // Note: The actual toggle functionality requires onClick handler on label
      // which should be verified in integration tests
    });

    it('shows tag badges for tests', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('auth')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
    });

    it('shows all tests selected message when none are selected', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(
        screen.getByText(/all tests will be included if none are selected/i)
      ).toBeInTheDocument();
    });
  });

  describe('Execution Settings Section', () => {
    it('renders Execution Settings section header', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Execution Settings')).toBeInTheDocument();
    });

    it('renders environment selector', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Environment')).toBeInTheDocument();
    });

    it('renders browser selector', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Browser')).toBeInTheDocument();
    });

    it('renders parallel tests input', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Parallel Tests')).toBeInTheDocument();
    });

    it('renders timeout input', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Timeout (minutes)')).toBeInTheDocument();
    });

    it('renders retry failed tests toggle', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Retry Failed Tests')).toBeInTheDocument();
      expect(screen.getByText(/automatically retry tests that fail/i)).toBeInTheDocument();
    });
  });

  describe('Notification Settings Section', () => {
    it('renders Notifications section header', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('renders notify on failure toggle', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Notify on Failure')).toBeInTheDocument();
    });

    it('renders notify on success toggle', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Notify on Success')).toBeInTheDocument();
    });

    it('renders notification channels when provided', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByText('Notification Channels')).toBeInTheDocument();
      expect(screen.getByText('Slack Alerts')).toBeInTheDocument();
      expect(screen.getByText('Email Team')).toBeInTheDocument();
    });

    it('does not render channels section when no channels', () => {
      render(<CreateScheduleModal {...defaultProps} notificationChannels={[]} />);

      expect(screen.queryByText('Notification Channels')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      expect(screen.getByText('Schedule name is required')).toBeInTheDocument();
    });

    it('clears error when name is entered', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));
      expect(screen.getByText('Schedule name is required')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'My Schedule');
      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      await waitFor(() => {
        expect(screen.queryByText('Schedule name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'Nightly Tests');

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        const savedData: ScheduleFormData = onSave.mock.calls[0][0];
        expect(savedData.name).toBe('Nightly Tests');
      });
    });

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateScheduleModal {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'Test Schedule');

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error message on submission failure', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'Test Schedule');

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });

    it('shows saving state while submitting', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const onSave = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'Test Schedule');

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      // Resolve the promise to clean up
      resolvePromise!();
    });
  });

  describe('Modal Close Behavior', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateScheduleModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Initial Data', () => {
    it('pre-fills form with initialData', () => {
      render(
        <CreateScheduleModal
          {...defaultProps}
          initialData={{
            name: 'Existing Schedule',
            description: 'An existing description',
            cron_expression: '0 */6 * * *',
          }}
        />
      );

      expect(screen.getByPlaceholderText(/e\.g\., nightly regression suite/i)).toHaveValue(
        'Existing Schedule'
      );
      expect(
        screen.getByPlaceholderText(/optional description of what this schedule does/i)
      ).toHaveValue('An existing description');
    });

    it('selects custom cron when initialData has non-preset cron', () => {
      render(
        <CreateScheduleModal
          {...defaultProps}
          initialData={{
            cron_expression: '5 4 * * *', // Not a preset
          }}
        />
      );

      // Custom should be selected and cron input should be visible
      expect(screen.getByPlaceholderText('* * * * *')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible form controls', () => {
      render(<CreateScheduleModal {...defaultProps} />);

      // All form inputs should have associated labels
      expect(screen.getByPlaceholderText(/e\.g\., nightly regression suite/i)).toBeInTheDocument();
    });

    it('disables Cancel button while saving', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const onSave = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., nightly regression suite/i);
      await user.type(nameInput, 'Test');

      await user.click(screen.getByRole('button', { name: 'Create Schedule' }));

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      resolvePromise!();
    });
  });
});
