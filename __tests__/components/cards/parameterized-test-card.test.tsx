/**
 * Tests for ParameterizedTestCard Component
 * @module __tests__/components/cards/parameterized-test-card.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ParameterizedTestCard,
  ParameterizedTestMiniCard,
} from '@/components/parameterized/ParameterizedTestCard';
import type { ParameterizedTest } from '@/lib/hooks/use-parameterized';

// Mock the Badge and StatusDot components
vi.mock('@/components/ui/data-table', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
  StatusDot: ({ status }: { status: string }) => (
    <span data-testid="status-dot" data-status={status} />
  ),
}));

describe('ParameterizedTestCard Component', () => {
  const mockTest: ParameterizedTest = {
    id: 'test-1',
    project_id: 'project-1',
    base_test_id: 'base-test-1',
    name: 'Login Flow with Different Users',
    description: 'Tests the login flow with various user credentials and configurations',
    data_source_type: 'csv',
    data_source_config: { file_path: '/data/users.csv' },
    parameter_schema: {
      username: { type: 'string', required: true },
      password: { type: 'string', required: true },
      role: { type: 'string', required: false },
    },
    iteration_mode: 'sequential',
    max_parallel: 1,
    fail_fast: false,
    timeout_per_iteration: 60000,
    retry_failed_iterations: true,
    retry_count: 2,
    priority: 'high',
    tags: ['login', 'authentication', 'smoke', 'regression', 'critical'],
    is_active: true,
    last_run_status: 'passed',
    last_run_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
  };

  const defaultProps = {
    test: mockTest,
    onRun: vi.fn(),
    onEdit: vi.fn(),
    onClone: vi.fn(),
    onDelete: vi.fn(),
    onViewResults: vi.fn(),
    isRunning: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders test name', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('Login Flow with Different Users')).toBeInTheDocument();
    });

    it('renders test description', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(
        screen.getByText('Tests the login flow with various user credentials and configurations')
      ).toBeInTheDocument();
    });

    it('shows "No description" when description is empty', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, description: '' }}
        />
      );

      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('renders data source type badge', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('CSV')).toBeInTheDocument();
    });

    it('renders priority badge', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders iteration mode', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('Sequential')).toBeInTheDocument();
    });

    it('renders parameter count', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('3 params')).toBeInTheDocument();
    });

    it('renders singular "param" for single parameter', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{
            ...mockTest,
            parameter_schema: { username: { type: 'string' } },
          }}
        />
      );

      expect(screen.getByText('1 param')).toBeInTheDocument();
    });
  });

  describe('Tags Display', () => {
    it('renders up to 4 tags', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('login')).toBeInTheDocument();
      expect(screen.getByText('authentication')).toBeInTheDocument();
      expect(screen.getByText('smoke')).toBeInTheDocument();
      expect(screen.getByText('regression')).toBeInTheDocument();
    });

    it('shows "+N more" for additional tags', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('does not render tags section when no tags', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, tags: [] }}
        />
      );

      expect(screen.queryByText('login')).not.toBeInTheDocument();
    });
  });

  describe('Last Run Status', () => {
    it('renders last run status indicator', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByTestId('status-dot')).toBeInTheDocument();
      expect(screen.getByTestId('status-dot')).toHaveAttribute('data-status', 'passed');
    });

    it('renders last run status text', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByText('passed')).toBeInTheDocument();
    });

    it('renders last run time', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      // Should show relative time like "1 hour ago"
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('shows "Never run" when no last run', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, last_run_status: undefined, last_run_at: undefined }}
        />
      );

      expect(screen.getByText('Never run')).toBeInTheDocument();
    });
  });

  describe('Data Source Types', () => {
    const dataSourceTypes = ['inline', 'csv', 'json', 'env', 'api', 'database', 'spreadsheet'];

    dataSourceTypes.forEach((type) => {
      it(`renders icon for ${type} data source`, () => {
        const { container } = render(
          <ParameterizedTestCard
            {...defaultProps}
            test={{ ...mockTest, data_source_type: type as any }}
          />
        );

        // Should have an icon in the header
        const iconContainer = container.querySelector('.h-12.w-12.rounded-lg');
        expect(iconContainer).toBeInTheDocument();
      });
    });
  });

  describe('Iteration Modes', () => {
    it('shows Sequential mode with correct color', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      const modeLabel = screen.getByText('Sequential');
      expect(modeLabel).toBeInTheDocument();
    });

    it('shows Parallel mode with correct color', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, iteration_mode: 'parallel' }}
        />
      );

      expect(screen.getByText('Parallel')).toBeInTheDocument();
    });

    it('shows Random mode with correct color', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, iteration_mode: 'random' }}
        />
      );

      expect(screen.getByText('Random')).toBeInTheDocument();
    });
  });

  describe('Inactive State', () => {
    it('reduces opacity when test is inactive', () => {
      const { container } = render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, is_active: false }}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('opacity-60');
    });
  });

  describe('Action Buttons', () => {
    it('renders Run Test button', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /run test/i })).toBeInTheDocument();
    });

    it('renders Results button', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /results/i })).toBeInTheDocument();
    });

    it('calls onRun when Run Test is clicked', async () => {
      const user = userEvent.setup();
      const onRun = vi.fn();

      render(<ParameterizedTestCard {...defaultProps} onRun={onRun} />);

      await user.click(screen.getByRole('button', { name: /run test/i }));

      expect(onRun).toHaveBeenCalled();
    });

    it('calls onViewResults when Results is clicked', async () => {
      const user = userEvent.setup();
      const onViewResults = vi.fn();

      render(<ParameterizedTestCard {...defaultProps} onViewResults={onViewResults} />);

      await user.click(screen.getByRole('button', { name: /results/i }));

      expect(onViewResults).toHaveBeenCalled();
    });

    it('shows running state on Run Test button', () => {
      render(<ParameterizedTestCard {...defaultProps} isRunning={true} />);

      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it('disables Run Test button when running', () => {
      render(<ParameterizedTestCard {...defaultProps} isRunning={true} />);

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });
  });

  describe('Quick Action Buttons', () => {
    it('renders Edit button', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('renders Clone button', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      const cloneButton = screen.getByRole('button', { name: /clone/i });
      expect(cloneButton).toBeInTheDocument();
    });

    it('renders Delete button', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('calls onEdit when Edit is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<ParameterizedTestCard {...defaultProps} onEdit={onEdit} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(onEdit).toHaveBeenCalled();
    });

    it('calls onClone when Clone is clicked', async () => {
      const user = userEvent.setup();
      const onClone = vi.fn();

      render(<ParameterizedTestCard {...defaultProps} onClone={onClone} />);

      await user.click(screen.getByRole('button', { name: /clone/i }));

      expect(onClone).toHaveBeenCalled();
    });

    it('calls onDelete when Delete is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<ParameterizedTestCard {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Priority Variants', () => {
    it('shows error variant for critical priority', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, priority: 'critical' }}
        />
      );

      const badge = screen.getByText('critical').closest('[data-testid="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'error');
    });

    it('shows warning variant for high priority', () => {
      render(<ParameterizedTestCard {...defaultProps} />);

      const badge = screen.getByText('high').closest('[data-testid="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    it('shows info variant for medium priority', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, priority: 'medium' }}
        />
      );

      const badge = screen.getByText('medium').closest('[data-testid="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'info');
    });

    it('shows default variant for low priority', () => {
      render(
        <ParameterizedTestCard
          {...defaultProps}
          test={{ ...mockTest, priority: 'low' }}
        />
      );

      const badge = screen.getByText('low').closest('[data-testid="badge"]');
      expect(badge).toHaveAttribute('data-variant', 'default');
    });
  });
});

describe('ParameterizedTestMiniCard Component', () => {
  const mockTest: ParameterizedTest = {
    id: 'test-1',
    project_id: 'project-1',
    base_test_id: 'base-test-1',
    name: 'Quick Login Test',
    description: 'A quick test',
    data_source_type: 'json',
    data_source_config: {},
    parameter_schema: { username: { type: 'string' } },
    iteration_mode: 'parallel',
    max_parallel: 5,
    fail_fast: false,
    timeout_per_iteration: 30000,
    retry_failed_iterations: false,
    retry_count: 0,
    priority: 'medium',
    tags: [],
    is_active: true,
    last_run_status: 'failed',
    last_run_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
  };

  const defaultProps = {
    test: mockTest,
    onClick: vi.fn(),
    selected: false,
  };

  describe('Rendering', () => {
    it('renders test name', () => {
      render(<ParameterizedTestMiniCard {...defaultProps} />);

      expect(screen.getByText('Quick Login Test')).toBeInTheDocument();
    });

    it('renders data source type and iteration mode', () => {
      render(<ParameterizedTestMiniCard {...defaultProps} />);

      expect(screen.getByText(/JSON - parallel/i)).toBeInTheDocument();
    });

    it('renders status dot for last run', () => {
      render(<ParameterizedTestMiniCard {...defaultProps} />);

      expect(screen.getByTestId('status-dot')).toBeInTheDocument();
    });

    it('does not render status dot when no last run', () => {
      render(
        <ParameterizedTestMiniCard
          {...defaultProps}
          test={{ ...mockTest, last_run_status: undefined }}
        />
      );

      expect(screen.queryByTestId('status-dot')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected styles when selected', () => {
      const { container } = render(
        <ParameterizedTestMiniCard {...defaultProps} selected={true} />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('border-primary');
    });

    it('applies default styles when not selected', () => {
      const { container } = render(
        <ParameterizedTestMiniCard {...defaultProps} selected={false} />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('border-border');
    });
  });

  describe('Click Behavior', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<ParameterizedTestMiniCard {...defaultProps} onClick={onClick} />);

      const card = screen.getByText('Quick Login Test').closest('div[class*="cursor-pointer"]');
      await user.click(card!);

      expect(onClick).toHaveBeenCalled();
    });

    it('has cursor pointer style', () => {
      const { container } = render(<ParameterizedTestMiniCard {...defaultProps} />);

      const card = container.firstChild;
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Data Source Icon', () => {
    it('renders correct icon for data source type', () => {
      const { container } = render(<ParameterizedTestMiniCard {...defaultProps} />);

      const iconContainer = container.querySelector('.h-8.w-8.rounded');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
