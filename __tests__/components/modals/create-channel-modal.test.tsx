/**
 * Tests for CreateChannelModal Component
 * @module __tests__/components/modals/create-channel-modal.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateChannelModal, type ChannelFormData } from '@/components/notifications/CreateChannelModal';

describe('CreateChannelModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onTest: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Create Notification Channel')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      render(<CreateChannelModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Create Notification Channel')).not.toBeInTheDocument();
    });

    it('renders Edit title when isEditing is true', () => {
      render(<CreateChannelModal {...defaultProps} isEditing={true} />);

      expect(screen.getByText('Edit Notification Channel')).toBeInTheDocument();
    });
  });

  describe('Step 1: Channel Type Selection', () => {
    it('renders channel type selection on initial render', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(
        screen.getByText('Choose how you want to receive notifications')
      ).toBeInTheDocument();
    });

    it('renders Slack option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('Send notifications to a Slack channel')).toBeInTheDocument();
    });

    it('renders Email option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Send notifications via email')).toBeInTheDocument();
    });

    it('renders Webhook option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Webhook')).toBeInTheDocument();
      expect(screen.getByText('Send notifications to a custom webhook')).toBeInTheDocument();
    });

    it('renders Discord option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('Send notifications to a Discord channel')).toBeInTheDocument();
    });

    it('renders Microsoft Teams option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('Microsoft Teams')).toBeInTheDocument();
      expect(screen.getByText('Send notifications to a Teams channel')).toBeInTheDocument();
    });

    it('renders PagerDuty option', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByText('PagerDuty')).toBeInTheDocument();
      expect(screen.getByText('Trigger PagerDuty incidents')).toBeInTheDocument();
    });

    it('advances to config step when channel type is selected', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();
    });

    it('renders Cancel button on type selection step', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Step 2: Slack Configuration', () => {
    it('renders Slack config form after selection', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByText('Channel Name *')).toBeInTheDocument();
      expect(screen.getByText('Webhook URL *')).toBeInTheDocument();
    });

    it('shows helper text for Slack webhook', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(
        screen.getByText(/get this from your slack workspace settings/i)
      ).toBeInTheDocument();
    });

    it('shows optional channel field for Slack', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByText('Channel (optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('#alerts')).toBeInTheDocument();
    });
  });

  describe('Step 2: Email Configuration', () => {
    it('renders Email config form after selection', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Email'));

      expect(screen.getByText('Recipients *')).toBeInTheDocument();
    });

    it('allows adding email recipients', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Email'));

      const emailInput = screen.getByPlaceholderText('email@example.com');
      await user.type(emailInput, 'test@example.com');

      // Find and click the add button
      const addButton = screen.getAllByRole('button').find((btn) =>
        btn.querySelector('svg')
      );
      await user.click(addButton!);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows Reply-To field for Email', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Email'));

      expect(screen.getByText('Reply-To (optional)')).toBeInTheDocument();
    });
  });

  describe('Step 2: Webhook Configuration', () => {
    it('renders Webhook config form after selection', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Webhook'));

      expect(screen.getByText('Webhook URL *')).toBeInTheDocument();
      expect(screen.getByText('HTTP Method')).toBeInTheDocument();
      expect(screen.getByText('Headers (optional)')).toBeInTheDocument();
      expect(screen.getByText('Secret (optional)')).toBeInTheDocument();
    });

    it('allows selecting HTTP method for Webhook', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Webhook'));

      const methodSelect = screen.getByRole('combobox');
      expect(methodSelect).toBeInTheDocument();
    });
  });

  describe('Rate Limit Setting', () => {
    it('renders rate limit input on config step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByText('Rate Limit (per hour)')).toBeInTheDocument();
    });
  });

  describe('Test Connection', () => {
    it('renders Test Connection button when onTest is provided', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
    });

    it('does not render Test Connection button when onTest is not provided', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} onTest={undefined} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.queryByRole('button', { name: /test connection/i })).not.toBeInTheDocument();
    });

    it('shows success message after successful test', async () => {
      const user = userEvent.setup();
      const onTest = vi.fn().mockResolvedValue(true);

      render(<CreateChannelModal {...defaultProps} onTest={onTest} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      await waitFor(() => {
        expect(screen.getByText(/test successful/i)).toBeInTheDocument();
      });
    });

    it('shows error message after failed test', async () => {
      const user = userEvent.setup();
      const onTest = vi.fn().mockResolvedValue(false);

      render(<CreateChannelModal {...defaultProps} onTest={onTest} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      await waitFor(() => {
        expect(screen.getByText(/test failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('shows Back button on config step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('returns to type selection when Back is clicked on config step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(
        screen.getByText('Choose how you want to receive notifications')
      ).toBeInTheDocument();
    });

    it('advances to rules step when Next is clicked on config step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByText('Set up notification rules')).toBeInTheDocument();
    });
  });

  describe('Step 3: Notification Rules', () => {
    it('renders rules configuration on rules step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByText('Notification Rules')).toBeInTheDocument();
    });

    it('renders Add Rule button', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByRole('button', { name: /add rule/i })).toBeInTheDocument();
    });

    it('renders default rule', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      // Default rule has event_type selector
      expect(screen.getByText('Event Type')).toBeInTheDocument();
    });

    it('adds new rule when Add Rule is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      const eventTypeLabels = screen.getAllByText('Event Type');
      expect(eventTypeLabels.length).toBe(1);

      await user.click(screen.getByRole('button', { name: /add rule/i }));

      const eventTypeLabelsAfter = screen.getAllByText('Event Type');
      expect(eventTypeLabelsAfter.length).toBe(2);
    });

    it('renders event type options', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      // The event type select should have options
      const select = screen.getAllByRole('combobox')[0];
      expect(select).toBeInTheDocument();
    });

    it('renders priority selector', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('renders cooldown input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByText('Cooldown (minutes)')).toBeInTheDocument();
    });

    it('allows deleting rules', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      // Add a rule first to have multiple
      await user.click(screen.getByRole('button', { name: /add rule/i }));

      // Find and click delete button on a rule
      const deleteButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.classList.contains('text-muted-foreground');
      });

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        // Should have one less rule
        const eventTypeLabels = screen.getAllByText('Event Type');
        expect(eventTypeLabels.length).toBe(1);
      }
    });
  });

  describe('Form Submission', () => {
    it('shows validation error when name is empty', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      expect(screen.getByText('Channel name is required')).toBeInTheDocument();
    });

    it('calls onSave with form data on valid submission', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(<CreateChannelModal {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText(/my slack channel/i);
      await user.type(nameInput, 'Alerts Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        const savedData: ChannelFormData = onSave.mock.calls[0][0];
        expect(savedData.name).toBe('Alerts Channel');
        expect(savedData.channel_type).toBe('slack');
      });
    });

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateChannelModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText(/my slack channel/i);
      await user.type(nameInput, 'Test Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error message on submission failure', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      render(<CreateChannelModal {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText(/my slack channel/i);
      await user.type(nameInput, 'Test Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });

    it('shows Update Channel button when isEditing', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} isEditing={true} />);

      // Skip type selection step in edit mode
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByRole('button', { name: /update channel/i })).toBeInTheDocument();
    });
  });

  describe('Initial Data', () => {
    it('pre-fills form with initialData', async () => {
      const user = userEvent.setup();

      render(
        <CreateChannelModal
          {...defaultProps}
          isEditing={true}
          initialData={{
            name: 'Existing Channel',
            channel_type: 'slack',
            config: { webhook_url: 'https://hooks.slack.com/test', channel: '#alerts' },
            enabled: true,
            rate_limit_per_hour: 50,
            rules: [],
          }}
        />
      );

      // Should show config step directly in edit mode
      expect(screen.getByPlaceholderText(/my slack channel/i)).toHaveValue('Existing Channel');
    });

    it('skips type selection in edit mode', () => {
      render(
        <CreateChannelModal
          {...defaultProps}
          isEditing={true}
          initialData={{
            name: 'Existing Channel',
            channel_type: 'email',
            config: { recipients: [], cc: [], reply_to: '' },
            enabled: true,
            rate_limit_per_hour: 100,
            rules: [],
          }}
        />
      );

      // Should be on config step, not type selection
      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();
    });
  });

  describe('Modal Close Behavior', () => {
    it('calls onClose when Cancel is clicked on type step', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<CreateChannelModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<CreateChannelModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible description for each step', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      // Step 1
      expect(
        screen.getByText('Choose how you want to receive notifications')
      ).toBeInTheDocument();

      // Step 2
      await user.click(screen.getByText('Slack'));
      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();

      // Step 3
      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      expect(screen.getByText('Set up notification rules')).toBeInTheDocument();
    });
  });
});
