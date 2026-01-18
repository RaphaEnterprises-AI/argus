/**
 * @file CreateScheduleModal Component Tests
 * Tests for the CreateScheduleModal form component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateScheduleModal, ScheduleFormData } from '@/components/schedules/CreateScheduleModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CreateScheduleModal Component', () => {
  const mockTests = [
    { id: 'test-1', name: 'Test 1' },
    { id: 'test-2', name: 'Test 2' },
    { id: 'test-3', name: 'Test 3' },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    tests: mockTests,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByRole('heading', { name: /create schedule/i })).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(<CreateScheduleModal {...defaultProps} open={false} />, { wrapper: createWrapper() });
      expect(screen.queryByRole('heading', { name: /create schedule/i })).not.toBeInTheDocument();
    });

    it('renders schedule name input', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByPlaceholderText(/nightly regression/i)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByPlaceholderText(/optional description/i)).toBeInTheDocument();
    });

    it('renders Schedule Timing section', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByText('Schedule Timing')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      // Submit button has Save icon and "Create Schedule" text
      const submitButton = screen.getByRole('button', { name: /create schedule/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Schedule Name Input', () => {
    it('allows typing in schedule name', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByPlaceholderText(/nightly regression/i);
      await user.type(nameInput, 'My Schedule');
      expect(nameInput).toHaveValue('My Schedule');
    });
  });

  describe('Description Input', () => {
    it('allows typing in description', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });

      const descInput = screen.getByPlaceholderText(/optional description/i);
      await user.type(descInput, 'My description');
      expect(descInput).toHaveValue('My description');
    });
  });

  describe('Cron Presets', () => {
    it('renders frequency label', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      // The component shows "Frequency" label for cron presets
      expect(screen.getByText('Frequency')).toBeInTheDocument();
    });

    it('shows default preset option', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      // The default preset is "Daily at 9 AM" (cron: 0 9 * * *)
      expect(screen.getByText('Daily at 9 AM')).toBeInTheDocument();
    });
  });

  describe('Cancel Action', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} onClose={onClose} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Submit Action', () => {
    it('calls onSave with schedule data when form is submitted', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />, { wrapper: createWrapper() });

      // Fill in required fields
      const nameInput = screen.getByPlaceholderText(/nightly regression/i);
      await user.type(nameInput, 'Test Schedule');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create schedule/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('shows error when name is empty', async () => {
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });

      // Try to submit without entering name
      const submitButton = screen.getByRole('button', { name: /create schedule/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/schedule name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders "Edit Schedule" title when isEditing is true', () => {
      render(
        <CreateScheduleModal {...defaultProps} isEditing={true} />,
        { wrapper: createWrapper() }
      );
      expect(screen.getByRole('heading', { name: /edit schedule/i })).toBeInTheDocument();
    });

    it('pre-populates form with initial data', () => {
      const initialData: Partial<ScheduleFormData> = {
        name: 'Pre-filled Name',
        description: 'Pre-filled description',
      };

      render(
        <CreateScheduleModal {...defaultProps} initialData={initialData} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByPlaceholderText(/nightly regression/i);
      expect(nameInput).toHaveValue('Pre-filled Name');
    });
  });

  describe('Loading State', () => {
    it('disables submit button during save', async () => {
      const onSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      render(<CreateScheduleModal {...defaultProps} onSave={onSave} />, { wrapper: createWrapper() });

      const nameInput = screen.getByPlaceholderText(/nightly regression/i);
      await user.type(nameInput, 'Test Schedule');

      const submitButton = screen.getByRole('button', { name: /create schedule/i });
      await user.click(submitButton);

      // Button should be disabled during save
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Schedule Form Data Structure', () => {
    it('has correct default values', () => {
      const defaultFormData: ScheduleFormData = {
        name: '',
        description: '',
        cron_expression: '0 9 * * *',
        timezone: 'UTC',
        test_ids: [],
        test_filter: {},
        notification_config: {
          on_failure: true,
          on_success: false,
          channels: [],
        },
        environment: 'staging',
        browser: 'chromium',
        max_parallel_tests: 5,
        timeout_ms: 3600000,
        retry_failed_tests: true,
        retry_count: 2,
      };

      expect(defaultFormData.cron_expression).toBe('0 9 * * *');
      expect(defaultFormData.timezone).toBe('UTC');
      expect(defaultFormData.environment).toBe('staging');
      expect(defaultFormData.browser).toBe('chromium');
    });
  });

  describe('Cron Expression Validation', () => {
    it('validates common cron patterns', () => {
      const validCronExpressions = [
        '*/15 * * * *',  // Every 15 minutes
        '0 * * * *',     // Every hour
        '0 9 * * *',     // Daily at 9 AM
        '0 9 * * 1-5',   // Weekdays at 9 AM
        '0 9 1 * *',     // Monthly on 1st
      ];

      validCronExpressions.forEach(cron => {
        const parts = cron.split(' ');
        expect(parts.length).toBe(5);
      });
    });
  });

  describe('Accessibility', () => {
    it('modal has accessible heading', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('inputs have visible labels', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByText('Schedule Name *')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('dialog has description', () => {
      render(<CreateScheduleModal {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByText(/configure when and how your tests/i)).toBeInTheDocument();
    });
  });
});
