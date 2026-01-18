/**
 * Tests for EmptyState UI Components
 * @module __tests__/components/ui/empty-state.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmptyState,
  NoTestsEmptyState,
  NoProjectsEmptyState,
  NoResultsEmptyState,
  ErrorEmptyState,
} from '@/components/ui/empty-state';
import { TestTube } from 'lucide-react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('renders headline correctly', () => {
      render(<EmptyState headline="No items found" />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('renders subtext when provided', () => {
      render(
        <EmptyState
          headline="No items"
          subtext="You haven't created any items yet."
        />
      );

      expect(screen.getByText("You haven't created any items yet.")).toBeInTheDocument();
    });

    it('does not render subtext when not provided', () => {
      render(<EmptyState headline="No items" />);

      const subtext = screen.queryByText(/you haven't/i);
      expect(subtext).not.toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <EmptyState
          headline="Test"
          className="custom-class"
          data-testid="empty-state"
        />
      );

      // The custom class should be applied to the container
      const container = screen.getByText('Test').closest('div[class*="custom-class"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<EmptyState variant="default" headline="Default Empty State" />);

      expect(screen.getByText('Default Empty State')).toBeInTheDocument();
    });

    it('renders no-tests variant', () => {
      render(<EmptyState variant="no-tests" headline="No Tests" />);

      expect(screen.getByText('No Tests')).toBeInTheDocument();
    });

    it('renders no-projects variant', () => {
      render(<EmptyState variant="no-projects" headline="No Projects" />);

      expect(screen.getByText('No Projects')).toBeInTheDocument();
    });

    it('renders no-results variant', () => {
      render(<EmptyState variant="no-results" headline="No Results" />);

      expect(screen.getByText('No Results')).toBeInTheDocument();
    });

    it('renders error variant', () => {
      render(<EmptyState variant="error" headline="Error Occurred" />);

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });
  });

  describe('Custom Illustration', () => {
    it('renders custom illustration when provided', () => {
      render(
        <EmptyState
          headline="Custom Illustration"
          illustration={<div data-testid="custom-illustration">Custom SVG</div>}
        />
      );

      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
    });

    it('renders default illustration when not provided', () => {
      render(<EmptyState headline="Default Illustration" />);

      // The default illustration should render (contains icons)
      expect(screen.getByText('Default Illustration')).toBeInTheDocument();
    });
  });

  describe('Primary Action', () => {
    it('renders primary action button when provided', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          headline="Test"
          primaryAction={{
            label: 'Create New',
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
    });

    it('calls onClick when primary action is clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          headline="Test"
          primaryAction={{
            label: 'Create New',
            onClick: handleClick,
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /create new/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders custom icon in primary action when provided', () => {
      render(
        <EmptyState
          headline="Test"
          primaryAction={{
            label: 'Create Test',
            onClick: vi.fn(),
            icon: <TestTube data-testid="test-icon" className="w-4 h-4" />,
          }}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render primary action when not provided', () => {
      render(<EmptyState headline="Test" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Secondary Action', () => {
    it('renders secondary action button when provided', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          headline="Test"
          secondaryAction={{
            label: 'Learn More',
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('calls onClick when secondary action is clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          headline="Test"
          secondaryAction={{
            label: 'Learn More',
            onClick: handleClick,
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /learn more/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders both primary and secondary actions', () => {
      render(
        <EmptyState
          headline="Test"
          primaryAction={{
            label: 'Primary',
            onClick: vi.fn(),
          }}
          secondaryAction={{
            label: 'Secondary',
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });
  });

  describe('Tip Section', () => {
    it('renders tip when provided', () => {
      render(
        <EmptyState
          headline="Test"
          tip="Here's a helpful tip for you."
        />
      );

      expect(screen.getByText("Here's a helpful tip for you.")).toBeInTheDocument();
    });

    it('renders Pro Tip label', () => {
      render(
        <EmptyState
          headline="Test"
          tip="A helpful tip"
        />
      );

      expect(screen.getByText('Pro Tip')).toBeInTheDocument();
    });

    it('does not render tip section when not provided', () => {
      render(<EmptyState headline="Test" />);

      expect(screen.queryByText('Pro Tip')).not.toBeInTheDocument();
    });
  });
});

describe('NoTestsEmptyState Component', () => {
  it('renders with correct headline', () => {
    render(<NoTestsEmptyState />);

    expect(screen.getByText('No tests yet')).toBeInTheDocument();
  });

  it('renders with correct subtext', () => {
    render(<NoTestsEmptyState />);

    expect(
      screen.getByText(/create your first test to start monitoring/i)
    ).toBeInTheDocument();
  });

  it('renders Create First Test button when onCreateTest is provided', () => {
    const handleCreate = vi.fn();

    render(<NoTestsEmptyState onCreateTest={handleCreate} />);

    expect(screen.getByRole('button', { name: /create first test/i })).toBeInTheDocument();
  });

  it('calls onCreateTest when button is clicked', async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    render(<NoTestsEmptyState onCreateTest={handleCreate} />);

    await user.click(screen.getByRole('button', { name: /create first test/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('renders import tests button when onImportTests is provided', () => {
    const handleImport = vi.fn();

    render(<NoTestsEmptyState onImportTests={handleImport} />);

    expect(screen.getByRole('button', { name: /import existing tests/i })).toBeInTheDocument();
  });

  it('renders tip about critical user flows', () => {
    render(<NoTestsEmptyState />);

    expect(screen.getByText(/start with your most critical user flows/i)).toBeInTheDocument();
  });
});

describe('NoProjectsEmptyState Component', () => {
  it('renders with correct headline', () => {
    render(<NoProjectsEmptyState />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('renders with correct subtext', () => {
    render(<NoProjectsEmptyState />);

    expect(
      screen.getByText(/create a project to organize your tests/i)
    ).toBeInTheDocument();
  });

  it('renders Create Project button when onCreateProject is provided', () => {
    const handleCreate = vi.fn();

    render(<NoProjectsEmptyState onCreateProject={handleCreate} />);

    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });

  it('calls onCreateProject when button is clicked', async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    render(<NoProjectsEmptyState onCreateProject={handleCreate} />);

    await user.click(screen.getByRole('button', { name: /create project/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('renders tip about project configuration', () => {
    render(<NoProjectsEmptyState />);

    expect(
      screen.getByText(/each project can have its own configuration/i)
    ).toBeInTheDocument();
  });
});

describe('NoResultsEmptyState Component', () => {
  it('renders with correct headline', () => {
    render(<NoResultsEmptyState />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders generic subtext when no search query is provided', () => {
    render(<NoResultsEmptyState />);

    expect(
      screen.getByText(/we couldn't find what you're looking for/i)
    ).toBeInTheDocument();
  });

  it('renders search query in subtext when provided', () => {
    render(<NoResultsEmptyState searchQuery="test query" />);

    expect(
      screen.getByText(/we couldn't find anything matching "test query"/i)
    ).toBeInTheDocument();
  });

  it('renders Clear search button when onClearSearch is provided', () => {
    const handleClear = vi.fn();

    render(<NoResultsEmptyState onClearSearch={handleClear} />);

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('calls onClearSearch when button is clicked', async () => {
    const handleClear = vi.fn();
    const user = userEvent.setup();

    render(<NoResultsEmptyState onClearSearch={handleClear} />);

    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders tip about search terms', () => {
    render(<NoResultsEmptyState />);

    expect(
      screen.getByText(/try using broader search terms/i)
    ).toBeInTheDocument();
  });
});

describe('ErrorEmptyState Component', () => {
  it('renders with correct headline', () => {
    render(<ErrorEmptyState />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders default subtext when no message is provided', () => {
    render(<ErrorEmptyState />);

    expect(
      screen.getByText(/we encountered an error while loading/i)
    ).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<ErrorEmptyState message="Custom error message" />);

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders Try Again button when onRetry is provided', () => {
    const handleRetry = vi.fn();

    render(<ErrorEmptyState onRetry={handleRetry} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when button is clicked', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorEmptyState onRetry={handleRetry} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render button when onRetry is not provided', () => {
    render(<ErrorEmptyState />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('Integration', () => {
  it('renders complete empty state with all options', async () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        variant="no-tests"
        headline="No tests found"
        subtext="Get started by creating your first test."
        primaryAction={{
          label: 'Create Test',
          onClick: handlePrimary,
        }}
        secondaryAction={{
          label: 'Import Tests',
          onClick: handleSecondary,
        }}
        tip="Tests help ensure your application works correctly."
      />
    );

    expect(screen.getByText('No tests found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first test.')).toBeInTheDocument();
    expect(screen.getByText('Tests help ensure your application works correctly.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Test' }));
    expect(handlePrimary).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Import Tests' }));
    expect(handleSecondary).toHaveBeenCalled();
  });
});
