/**
 * Tests for SaveTestDialog Component
 * @module __tests__/components/modals/save-test-dialog.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveTestDialog } from '@/components/tests/save-test-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user-123' },
  }),
}));

// Mock the hooks
vi.mock('@/lib/hooks/use-test-library', () => ({
  useSaveToLibrary: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      id: 'saved-test-id',
      name: 'Test Name',
    }),
    isPending: false,
  }),
}));

// Use stable reference to avoid infinite re-renders
const mockProjectsResult = {
  data: [
    { id: 'project-1', name: 'Project One' },
    { id: 'project-2', name: 'Project Two' },
  ],
};

vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: () => mockProjectsResult,
}));

vi.mock('@/lib/hooks/useToast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to wrap component with QueryClient
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

describe('SaveTestDialog Component', () => {
  const mockTestData = {
    test: {
      name: 'Login Flow Test',
      description: 'Tests the user login flow',
      steps: [
        { action: 'click', target: '#login-button', description: 'Click login button' },
        { action: 'type', target: '#email', value: 'test@example.com', description: 'Enter email' },
        { action: 'click', target: '#submit', description: 'Submit form' },
      ],
      assertions: [
        { type: 'visible', expected: '.dashboard', description: 'Dashboard is visible' },
      ],
    },
    app_url: 'https://example.com',
    summary: {
      name: 'Login Flow Test',
      steps_count: 3,
      assertions_count: 1,
    },
  };

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    testData: mockTestData,
    onSaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Save Test to Library')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(<SaveTestDialog {...defaultProps} open={false} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Save Test to Library')).not.toBeInTheDocument();
    });

    it('does not render when testData is null', () => {
      render(<SaveTestDialog {...defaultProps} testData={null} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Save Test to Library')).not.toBeInTheDocument();
    });

    it('renders dialog title and description', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Save Test to Library')).toBeInTheDocument();
      expect(
        screen.getByText(/save this test to your library to re-run it anytime/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('pre-fills test name from testData', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByPlaceholderText(/enter a descriptive name/i);
      expect(nameInput).toHaveValue('Login Flow Test');
    });

    it('renders project selector when multiple projects exist', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/what does this test verify/i)).toBeInTheDocument();
    });

    it('pre-fills description from testData', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const descInput = screen.getByPlaceholderText(/what does this test verify/i);
      expect(descInput).toHaveValue('Tests the user login flow');
    });
  });

  describe('Priority Selection', () => {
    it('renders priority options', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('selects medium priority by default', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const mediumButton = screen.getByText('Medium').closest('button');
      expect(mediumButton).toHaveClass('bg-primary');
    });

    it('allows changing priority', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Critical'));

      const criticalButton = screen.getByText('Critical').closest('button');
      expect(criticalButton).toHaveClass('bg-primary');
    });
  });

  describe('Tags', () => {
    it('renders tags section', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('allows adding a tag', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const tagInput = screen.getByPlaceholderText(/add a tag/i);
      await user.type(tagInput, 'authentication');

      // Find the add tag button
      const addButton = tagInput.parentElement?.querySelector('button');
      await user.click(addButton!);

      expect(screen.getByText('authentication')).toBeInTheDocument();
    });

    it('allows adding tag with Enter key', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const tagInput = screen.getByPlaceholderText(/add a tag/i);
      await user.type(tagInput, 'e2e{Enter}');

      expect(screen.getByText('e2e')).toBeInTheDocument();
    });

    it('allows adding tag with comma key', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const tagInput = screen.getByPlaceholderText(/add a tag/i);
      await user.type(tagInput, 'smoke,');

      expect(screen.getByText('smoke')).toBeInTheDocument();
    });

    it('shows suggested tags', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      // Should show some suggested tags
      expect(screen.getByText('+ login')).toBeInTheDocument();
    });

    it('allows adding suggested tag by clicking', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('+ login'));

      // Tag should now appear in the list without the + prefix
      const tagElements = screen.getAllByText('login');
      expect(tagElements.length).toBeGreaterThan(0);
    });

    it('allows removing a tag', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      // Add a tag first
      const tagInput = screen.getByPlaceholderText(/add a tag/i);
      await user.type(tagInput, 'test-tag{Enter}');

      expect(screen.getByText('test-tag')).toBeInTheDocument();

      // Find and click the remove button on the tag
      const tagElement = screen.getByText('test-tag');
      const removeButton = tagElement.parentElement?.querySelector('button');
      await user.click(removeButton!);

      expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
    });

    it('prevents duplicate tags', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const tagInput = screen.getByPlaceholderText(/add a tag/i);

      // Add the same tag twice
      await user.type(tagInput, 'unique{Enter}');
      await user.type(tagInput, 'unique{Enter}');

      // Should only have one instance of the tag
      const tagElements = screen.getAllByText('unique');
      expect(tagElements.length).toBe(1);
    });
  });

  describe('Test Summary', () => {
    it('renders test summary section', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Test Summary')).toBeInTheDocument();
    });

    it('shows steps count', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/3/)).toBeInTheDocument();
      expect(screen.getByText(/steps/)).toBeInTheDocument();
    });

    it('shows assertions count', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/assertion/i)).toBeInTheDocument();
    });

    it('shows app URL', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('renders Cancel button', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders Save to Library button', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /save to library/i })).toBeInTheDocument();
    });

    it('calls onOpenChange when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<SaveTestDialog {...defaultProps} onOpenChange={onOpenChange} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables Save button when name is empty', async () => {
      const user = userEvent.setup();
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByPlaceholderText(/enter a descriptive name/i);
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /save to library/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('shows success state after successful save', async () => {
      const user = userEvent.setup();

      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /save to library/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Saved!')).toBeInTheDocument();
      });
    });

    it('shows success description', async () => {
      const user = userEvent.setup();

      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /save to library/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/your test has been saved to the library/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible labels for form fields', () => {
      render(<SaveTestDialog {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Test Name')).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });
  });
});
