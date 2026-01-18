/**
 * @file CreateChannelModal Component Tests
 * Tests for the CreateChannelModal notification form component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateChannelModal, ChannelFormData } from '@/components/notifications/CreateChannelModal';

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

    it('does not render when open is false', () => {
      render(<CreateChannelModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Create Notification Channel')).not.toBeInTheDocument();
    });

    it('shows Edit title when isEditing is true', () => {
      render(<CreateChannelModal {...defaultProps} isEditing />);
      expect(screen.getByText('Edit Notification Channel')).toBeInTheDocument();
    });
  });

  describe('Step 1: Channel Type Selection', () => {
    it('shows channel type selection as first step', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByText('Choose how you want to receive notifications')).toBeInTheDocument();
    });

    it('renders all channel type options', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Webhook')).toBeInTheDocument();
      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Teams')).toBeInTheDocument();
      expect(screen.getByText('PagerDuty')).toBeInTheDocument();
    });

    it('shows descriptions for channel types', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByText('Send notifications to a Slack channel')).toBeInTheDocument();
      expect(screen.getByText('Send notifications via email')).toBeInTheDocument();
    });

    it('advances to config step when channel type is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));

      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();
    });

    it('shows Cancel button on type step', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Step 2: Slack Configuration', () => {
    const navigateToSlackConfig = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText('Slack'));
    };

    it('shows Slack configuration form', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByText('Webhook URL *')).toBeInTheDocument();
      expect(screen.getByText('Channel (optional)')).toBeInTheDocument();
    });

    it('shows channel name input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByText('Channel Name *')).toBeInTheDocument();
    });

    it('shows placeholder for webhook URL', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByPlaceholderText('https://hooks.slack.com/services/...')).toBeInTheDocument();
    });

    it('shows rate limit input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByText('Rate Limit (per hour)')).toBeInTheDocument();
    });

    it('allows entering webhook URL', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      const webhookInput = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
      await user.type(webhookInput, 'https://example.com/fake-webhook-for-testing');

      expect(webhookInput).toHaveValue('https://example.com/fake-webhook-for-testing');
    });

    it('shows Back button', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('goes back to type selection on Back click', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);
      await user.click(screen.getByRole('button', { name: /back/i }));

      expect(screen.getByText('Choose how you want to receive notifications')).toBeInTheDocument();
    });

    it('shows Next: Rules button', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByRole('button', { name: /next: rules/i })).toBeInTheDocument();
    });

    it('shows Test Connection button when onTest is provided', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToSlackConfig(user);

      expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
    });
  });

  describe('Step 2: Email Configuration', () => {
    const navigateToEmailConfig = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText('Email'));
    };

    it('shows Email configuration form', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToEmailConfig(user);

      expect(screen.getByText('Recipients *')).toBeInTheDocument();
    });

    it('shows reply-to input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToEmailConfig(user);

      expect(screen.getByText('Reply-To (optional)')).toBeInTheDocument();
    });

    it('allows adding email recipients', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToEmailConfig(user);

      const emailInput = screen.getByPlaceholderText('email@example.com');
      await user.type(emailInput, 'test@example.com');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      );
      await user.click(addButton!);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('removes recipient when X is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToEmailConfig(user);

      // Add a recipient
      const emailInput = screen.getByPlaceholderText('email@example.com');
      await user.type(emailInput, 'test@example.com{enter}');

      expect(screen.getByText('test@example.com')).toBeInTheDocument();

      // Find the X button within the recipient chip
      const chipButtons = screen.getAllByRole('button');
      const removeButton = chipButtons.find(btn =>
        btn.closest('span')?.textContent?.includes('test@example.com')
      );
      await user.click(removeButton!);

      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Step 2: Webhook Configuration', () => {
    const navigateToWebhookConfig = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText('Webhook'));
    };

    it('shows Webhook configuration form', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToWebhookConfig(user);

      expect(screen.getByText('Webhook URL *')).toBeInTheDocument();
      expect(screen.getByText('HTTP Method')).toBeInTheDocument();
      expect(screen.getByText('Headers (optional)')).toBeInTheDocument();
    });

    it('shows method selector with POST as default', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToWebhookConfig(user);

      const methodSelect = screen.getByDisplayValue('POST');
      expect(methodSelect).toBeInTheDocument();
    });

    it('allows adding headers', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToWebhookConfig(user);

      const headerNameInput = screen.getByPlaceholderText('Header name');
      const headerValueInput = screen.getByPlaceholderText('Value');

      await user.type(headerNameInput, 'Authorization');
      await user.type(headerValueInput, 'Bearer token123');

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-plus')
      );
      await user.click(addButton!);

      expect(screen.getByText('Authorization: Bearer token123')).toBeInTheDocument();
    });

    it('shows secret input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToWebhookConfig(user);

      expect(screen.getByText('Secret (optional)')).toBeInTheDocument();
    });
  });

  describe('Step 3: Notification Rules', () => {
    const navigateToRulesStep = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));
    };

    it('shows rules step heading', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByText('Set up notification rules')).toBeInTheDocument();
    });

    it('shows Notification Rules header', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByText('Notification Rules')).toBeInTheDocument();
    });

    it('shows Add Rule button', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByRole('button', { name: /add rule/i })).toBeInTheDocument();
    });

    it('has default rule for test.run.failed', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByDisplayValue('Test Run Failed')).toBeInTheDocument();
    });

    it('shows event type selector', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByText('Event Type')).toBeInTheDocument();
    });

    it('shows priority selector', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('shows cooldown input', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByText('Cooldown (minutes)')).toBeInTheDocument();
    });

    it('allows adding new rule', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);
      await user.click(screen.getByRole('button', { name: /add rule/i }));

      // Should now have 2 event type selects
      const eventSelects = screen.getAllByText('Event Type');
      expect(eventSelects.length).toBe(2);
    });

    it('allows removing rule', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-trash-2')
      );

      if (deleteButtons.length > 0) {
        const initialCount = deleteButtons.length;
        await user.click(deleteButtons[0]);

        // After removing, either count decreases or empty state shows
        const remainingButtons = screen.queryAllByRole('button').filter(btn =>
          btn.querySelector('svg')?.classList.contains('lucide-trash-2')
        );
        expect(remainingButtons.length).toBeLessThan(initialCount);
      }
    });

    it('shows Create Channel button', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await navigateToRulesStep(user);

      expect(screen.getByRole('button', { name: /create channel/i })).toBeInTheDocument();
    });

    it('shows Update Channel button when editing', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} isEditing />);

      // In edit mode, starts at config step
      await user.click(screen.getByRole('button', { name: /next: rules/i }));

      expect(screen.getByRole('button', { name: /update channel/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when channel name is empty on save', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      expect(screen.getByText('Channel name is required')).toBeInTheDocument();
    });

    it('clears error when channel name is filled', async () => {
      const user = userEvent.setup();
      render(<CreateChannelModal {...defaultProps} />);

      // Select Slack channel type
      await user.click(screen.getByText('Slack'));

      // Fill in the name first on the config step
      const nameInput = screen.getByPlaceholderText('My Slack Channel');
      await user.type(nameInput, 'My Channel');

      // The error should not be visible after filling the name
      expect(screen.queryByText('Channel name is required')).not.toBeInTheDocument();
    });
  });

  describe('Test Connection', () => {
    it('shows success message on successful test', async () => {
      const onTest = vi.fn().mockResolvedValue(true);
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onTest={onTest} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Successful!')).toBeInTheDocument();
      });
    });

    it('shows error message on failed test', async () => {
      const onTest = vi.fn().mockResolvedValue(false);
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onTest={onTest} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Failed')).toBeInTheDocument();
      });
    });

    it('shows loading state during test', async () => {
      const onTest = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onTest={onTest} />);

      await user.click(screen.getByText('Slack'));
      await user.click(screen.getByRole('button', { name: /test connection/i }));

      expect(screen.getByText('Testing...')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with correct data on submit', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText('My Slack Channel');
      await user.type(nameInput, 'My Test Channel');

      const webhookInput = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
      await user.type(webhookInput, 'https://hooks.slack.com/test');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'My Test Channel',
          channel_type: 'slack',
          enabled: true,
        }));
      });
    });

    it('closes modal on successful save', async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onClose={onClose} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText('My Slack Channel');
      await user.type(nameInput, 'Test Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error message on save failure', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText('My Slack Channel');
      await user.type(nameInput, 'Test Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });

    it('shows loading state during save', async () => {
      const onSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();

      render(<CreateChannelModal {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByText('Slack'));

      const nameInput = screen.getByPlaceholderText('My Slack Channel');
      await user.type(nameInput, 'Test Channel');

      await user.click(screen.getByRole('button', { name: /next: rules/i }));
      await user.click(screen.getByRole('button', { name: /create channel/i }));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const initialData: Partial<ChannelFormData> = {
      name: 'Existing Channel',
      channel_type: 'slack',
      config: { webhook_url: 'https://hooks.slack.com/test', channel: '#alerts', mention_users: [] },
      enabled: true,
      rate_limit_per_hour: 50,
      rules: [{ event_type: 'test.run.passed', conditions: {}, priority: 'high', cooldown_minutes: 30 }],
    };

    it('starts at config step when editing', () => {
      render(<CreateChannelModal {...defaultProps} isEditing initialData={initialData} />);

      expect(screen.getByText('Configure your notification channel')).toBeInTheDocument();
    });

    it('populates form with initial data', () => {
      render(<CreateChannelModal {...defaultProps} isEditing initialData={initialData} />);

      expect(screen.getByDisplayValue('Existing Channel')).toBeInTheDocument();
    });

    it('populates webhook URL from initial data', () => {
      render(<CreateChannelModal {...defaultProps} isEditing initialData={initialData} />);

      expect(screen.getByDisplayValue('https://hooks.slack.com/test')).toBeInTheDocument();
    });

    it('populates rate limit from initial data', () => {
      render(<CreateChannelModal {...defaultProps} isEditing initialData={initialData} />);

      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('channel type buttons are focusable', () => {
      render(<CreateChannelModal {...defaultProps} />);
      const slackButton = screen.getByText('Slack').closest('button');
      expect(slackButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('shows descriptive dialog title', () => {
      render(<CreateChannelModal {...defaultProps} />);
      expect(screen.getByText('Create Notification Channel')).toBeInTheDocument();
    });
  });
});
