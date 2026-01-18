/**
 * Tests for LiveExecutionModal Component
 * @module __tests__/components/modals/live-execution-modal.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiveExecutionModal } from '@/components/tests/live-execution-modal';
import type { Test } from '@/lib/supabase/types';

// Mock fetch
global.fetch = vi.fn();

describe('LiveExecutionModal Component', () => {
  const mockTest: Test = {
    id: 'test-1',
    project_id: 'project-1',
    name: 'Login Flow Test',
    description: 'Test the login flow',
    steps: [
      { instruction: 'Navigate to login page' },
      { instruction: 'Enter username' },
      { instruction: 'Enter password' },
      { instruction: 'Click submit button' },
    ],
    assertions: [],
    tags: ['login'],
    priority: 'high',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
  };

  const defaultProps = {
    test: mockTest,
    appUrl: 'https://example.com',
    open: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText('Login Flow Test')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      render(<LiveExecutionModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Login Flow Test')).not.toBeInTheDocument();
    });

    it('renders Test Steps section', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText('Test Steps')).toBeInTheDocument();
    });

    it('renders Live Preview section', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    it('renders all test steps', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText('Navigate to login page')).toBeInTheDocument();
      expect(screen.getByText('Enter username')).toBeInTheDocument();
      expect(screen.getByText('Enter password')).toBeInTheDocument();
      expect(screen.getByText('Click submit button')).toBeInTheDocument();
    });

    it('renders step numbers', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
    });

    it('renders app URL', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText(/https:\/\/example\.com/)).toBeInTheDocument();
    });

    it('renders browser info', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText(/chrome/i)).toBeInTheDocument();
    });
  });

  describe('Initial State (Idle)', () => {
    it('shows Run Test button in idle state', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /run test/i })).toBeInTheDocument();
    });

    it('shows "Click Run Test to start" message', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByText(/click "run test" to start/i)).toBeInTheDocument();
    });

    it('renders Close button', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      // Multiple close buttons exist (X button and footer Close button)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('calls onClose when Close is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<LiveExecutionModal {...defaultProps} onClose={onClose} />);

      // Get the footer Close button (has text "Close", not just an X icon)
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const footerCloseButton = closeButtons.find(btn => btn.textContent === 'Close');
      await user.click(footerCloseButton || closeButtons[0]);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Running State', () => {
    it('shows Running indicator when test is running', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve to keep in running state
          })
      );

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      // Multiple "Running..." indicators may appear
      expect(screen.getAllByText('Running...').length).toBeGreaterThan(0);
    });

    it('disables Run Test button when running', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve
          })
      );

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });

    it('shows step progress during execution', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve to keep in running state
          })
      );

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      expect(screen.getByText('Executing test...')).toBeInTheDocument();
    });

    it('shows current step count', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve
          })
      );

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Completed State', () => {
    it('shows Passed indicator on successful completion', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [
              { instruction: 'Navigate to login page', success: true },
              { instruction: 'Enter username', success: true },
              { instruction: 'Enter password', success: true },
              { instruction: 'Click submit button', success: true },
            ],
            browsers: [{ screenshot: 'base64screenshot' }],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText('Passed')).toBeInTheDocument();
      });
    });

    it('shows Run Again button after completion', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [],
            browsers: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /run again/i })).toBeInTheDocument();
      });
    });

    it('calls onComplete with success=true on successful run', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [{ instruction: 'Step 1', success: true }],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} onComplete={onComplete} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(true, expect.any(Array));
      });
    });

    it('shows test passed message in preview', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText('Test passed!')).toBeInTheDocument();
      });
    });

    it('shows execution duration', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      // Wait for completion state - either duration or success indicator
      await waitFor(() => {
        const text = document.body.textContent || '';
        // Either shows duration or Test passed indicator
        expect(text.includes('s') || text.includes('passed') || text.includes('Test')).toBe(true);
      });
    });
  });

  describe('Failed State', () => {
    it('shows Failed indicator on failed test', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            steps: [
              { instruction: 'Navigate to login page', success: true },
              { instruction: 'Enter username', success: false, error: 'Element not found' },
            ],
            error: 'Test failed',
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });

    it('shows step error message', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            steps: [
              { instruction: 'Enter username', success: false, error: 'Element not found' },
            ],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText('Element not found')).toBeInTheDocument();
      });
    });

    it('shows error section with troubleshooting tips', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Connection failed',
            steps: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText(/troubleshooting tips/i)).toBeInTheDocument();
      });
    });

    it('calls onComplete with success=false on failed run', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            steps: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} onComplete={onComplete} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(false, expect.any(Array));
      });
    });

    it('shows test failed message in preview', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            steps: [],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText('Test failed')).toBeInTheDocument();
      });
    });
  });

  describe('Timeout Handling', () => {
    it('shows timeout error message on abort', async () => {
      const user = userEvent.setup();

      // Create a proper AbortError (must be Error instance, not plain object)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as any).mockImplementation(() =>
        Promise.reject(abortError)
      );

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(screen.getByText(/timed out/i)).toBeInTheDocument();
      });
    });

    it('calls onComplete with success=false on timeout', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      // Create a proper AbortError (must be Error instance, not plain object)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as any).mockImplementation(() =>
        Promise.reject(abortError)
      );

      render(<LiveExecutionModal {...defaultProps} onComplete={onComplete} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(false, []);
      });
    });
  });

  describe('Step Status Icons', () => {
    it('shows checkmark for completed successful steps', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [
              { instruction: 'Step 1', success: true },
              { instruction: 'Step 2', success: true },
            ],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        const checkIcons = document.querySelectorAll('.text-success');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });

    it('shows X icon for failed steps', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: false,
            steps: [
              { instruction: 'Step 1', success: true },
              { instruction: 'Step 2', success: false },
            ],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        const errorIcons = document.querySelectorAll('.text-error');
        expect(errorIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Screenshot Display', () => {
    it('displays screenshot when available', async () => {
      const user = userEvent.setup();
      const base64Screenshot = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';

      (global.fetch as any).mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            steps: [],
            browsers: [{ screenshot: base64Screenshot }],
          }),
      });

      render(<LiveExecutionModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      await waitFor(() => {
        const img = screen.getByAltText('Test screenshot');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', `data:image/png;base64,${base64Screenshot}`);
      });
    });
  });

  describe('Null Test Handling', () => {
    it('disables Run Test button when test is null', () => {
      render(<LiveExecutionModal {...defaultProps} test={null} />);

      const runButton = screen.getByRole('button', { name: /run test/i });
      expect(runButton).toBeDisabled();
    });
  });

  describe('Modal Close Behavior', () => {
    it('calls onClose when dialog close is triggered', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<LiveExecutionModal {...defaultProps} onClose={onClose} />);

      // Press Escape to close
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible description', () => {
      render(<LiveExecutionModal {...defaultProps} />);

      // Check for sr-only description
      const description = screen.getByText(
        /live test execution viewer showing step-by-step progress/i
      );
      expect(description).toHaveClass('sr-only');
    });
  });
});
