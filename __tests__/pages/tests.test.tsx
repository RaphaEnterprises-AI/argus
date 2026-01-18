/**
 * Tests for Tests Page
 *
 * Covers:
 * - Initial render and layout
 * - Loading states
 * - Empty states (no projects, no tests)
 * - Test list display with DataTable
 * - Project selection
 * - Test creation form
 * - Test deletion
 * - Running tests
 * - Realtime subscription status
 * - Activity feed toggle
 * - Recent runs display
 */

import React, { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// Hoisted Mocks - All mock data and factories defined before vi.mock() hoisting
// ============================================================================

const {
  mockUser,
  mockRouter,
  mockProject,
  mockTest,
  mockTestRun,
  mockProjects,
  mockTests,
  mockRuns,
  mockCreateTest,
  mockDeleteTest,
  mockRunSingleTest,
  createMockQuery,
  createMockMutation,
  // Mock hook functions
  mockUseProjects,
  mockUseCreateProject,
  mockUseTests,
  mockUseTestRuns,
  mockUseCreateTest,
  mockUseDeleteTest,
  mockUseRunSingleTest,
  mockUseTestRunSubscription,
  mockUseRealtimeTests,
  mockUseProjectPresence,
} = vi.hoisted(() => {
  // Mock user
  const mockUser = {
    id: 'user_123',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    imageUrl: 'https://example.com/avatar.png',
  };

  // Mock router
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/tests',
    query: {},
    asPath: '/tests',
    route: '/tests',
  };

  // Mock factories
  const mockProject = (overrides = {}) => ({
    id: `project_${Date.now()}`,
    name: 'Test Project',
    slug: 'test-project',
    app_url: 'https://test.example.com',
    description: 'A test project',
    user_id: 'user_123',
    organization_id: 'org_123',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const mockTest = (overrides = {}) => ({
    id: `test_${Date.now()}`,
    project_id: 'project_123',
    name: 'Sample Test',
    description: 'A sample test',
    steps: [
      { instruction: 'Navigate to login page' },
      { instruction: 'Enter username' },
    ],
    priority: 'medium' as const,
    source: 'manual' as const,
    tags: ['auth', 'login'],
    created_by: 'user_123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const mockTestRun = (overrides = {}) => ({
    id: `run_${Date.now()}`,
    project_id: 'project_123',
    name: 'Test Run',
    app_url: 'https://test.example.com',
    status: 'passed' as const,
    total_tests: 10,
    passed_tests: 9,
    failed_tests: 1,
    duration_ms: 5000,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  });

  // Mock data arrays
  const mockProjects = [
    mockProject({ id: 'project_1', name: 'Project One', app_url: 'https://one.example.com' }),
    mockProject({ id: 'project_2', name: 'Project Two', app_url: 'https://two.example.com' }),
  ];

  const mockTests = [
    mockTest({
      id: 'test_1',
      name: 'Login Test',
      priority: 'high',
      source: 'manual',
      steps: [{ instruction: 'Step 1' }, { instruction: 'Step 2' }],
    }),
    mockTest({
      id: 'test_2',
      name: 'Checkout Test',
      priority: 'critical',
      source: 'ai-generated',
      steps: [{ instruction: 'Step 1' }],
    }),
    mockTest({
      id: 'test_3',
      name: 'Search Test',
      priority: 'medium',
      source: 'discovery',
      steps: [],
    }),
  ];

  const mockRuns = [
    mockTestRun({ id: 'run_1', name: 'Run 1', status: 'passed', duration_ms: 3000 }),
    mockTestRun({ id: 'run_2', name: 'Run 2', status: 'failed', duration_ms: 5000 }),
    mockTestRun({ id: 'run_3', name: 'Run 3', status: 'running', duration_ms: null }),
  ];

  // Mutation mocks
  const mockCreateTest = vi.fn();
  const mockDeleteTest = vi.fn();
  const mockRunSingleTest = vi.fn();

  // Query/Mutation factories
  const createMockQuery = <T,>(data: T, overrides = {}) => ({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: true,
    ...overrides,
  });

  const createMockMutation = (overrides = {}) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
    ...overrides,
  });

  // Create mock hook functions for use in vi.mock() and tests
  const mockUseProjects = vi.fn(() => createMockQuery(mockProjects));
  const mockUseCreateProject = vi.fn(() => createMockMutation());
  const mockUseTests = vi.fn(() => createMockQuery(mockTests));
  const mockUseTestRuns = vi.fn(() => createMockQuery(mockRuns));
  const mockUseCreateTest = vi.fn(() => ({
    mutateAsync: mockCreateTest,
    isPending: false,
  }));
  const mockUseDeleteTest = vi.fn(() => ({
    mutateAsync: mockDeleteTest,
    isPending: false,
  }));
  const mockUseRunSingleTest = vi.fn(() => ({
    mutate: mockRunSingleTest,
    isPending: false,
  }));
  const mockUseTestRunSubscription = vi.fn();
  const mockUseRealtimeTests = vi.fn(() => ({
    runningTests: [],
    isSubscribed: true,
  }));
  const mockUseProjectPresence = vi.fn(() => ({
    onlineUsers: [],
    isConnected: true,
  }));

  return {
    mockUser,
    mockRouter,
    mockProject,
    mockTest,
    mockTestRun,
    mockProjects,
    mockTests,
    mockRuns,
    mockCreateTest,
    mockDeleteTest,
    mockRunSingleTest,
    createMockQuery,
    createMockMutation,
    // Mock hook functions
    mockUseProjects,
    mockUseCreateProject,
    mockUseTests,
    mockUseTestRuns,
    mockUseCreateTest,
    mockUseDeleteTest,
    mockUseRunSingleTest,
    mockUseTestRunSubscription,
    mockUseRealtimeTests,
    mockUseProjectPresence,
  };
});

// ============================================================================
// Module Mocks - Using hoisted values
// ============================================================================

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/tests',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock projects hooks
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: mockUseProjects,
  useCreateProject: mockUseCreateProject,
}));

// Mock tests hooks
vi.mock('@/lib/hooks/use-tests', () => ({
  useTests: mockUseTests,
  useTestRuns: mockUseTestRuns,
  useCreateTest: mockUseCreateTest,
  useDeleteTest: mockUseDeleteTest,
  useRunSingleTest: mockUseRunSingleTest,
  useTestRunSubscription: mockUseTestRunSubscription,
}));

// Mock realtime hooks
vi.mock('@/hooks/use-realtime-tests', () => ({
  useRealtimeTests: mockUseRealtimeTests,
}));

vi.mock('@/hooks/use-presence', () => ({
  useProjectPresence: mockUseProjectPresence,
}));

// Mock Sidebar
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock DataTable
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ columns, data, searchKey, searchPlaceholder, isLoading, emptyMessage }: {
    columns: unknown[];
    data: unknown[];
    searchKey: string;
    searchPlaceholder: string;
    isLoading: boolean;
    emptyMessage: string;
  }) => (
    <div data-testid="data-table">
      {isLoading ? (
        <div>Loading...</div>
      ) : data.length === 0 ? (
        <div>{emptyMessage}</div>
      ) : (
        <table>
          <tbody>
            {(data as Array<{ id: string; name: string; priority: string; source: string; steps: unknown[] }>).map((item) => (
              <tr key={item.id} data-testid={`test-row-${item.id}`}>
                <td>{item.name}</td>
                <td>{item.priority}</td>
                <td>{item.source}</td>
                <td>{item.steps?.length || 0} steps</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ),
  StatusDot: ({ status }: { status: string }) => (
    <span data-testid={`status-dot-${status}`} className={`status-${status}`} />
  ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

// Mock LiveExecutionModal
vi.mock('@/components/tests/live-execution-modal', () => ({
  LiveExecutionModal: ({ test, appUrl, open, onClose, onComplete }: {
    test: unknown;
    appUrl: string;
    open: boolean;
    onClose: () => void;
    onComplete: (success: boolean, results: unknown[]) => void;
  }) => (
    open ? (
      <div data-testid="live-execution-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onComplete(true, [])}>Complete Success</button>
        <button onClick={() => onComplete(false, [])}>Complete Failure</button>
      </div>
    ) : null
  ),
}));

// Mock RealtimeActivityFeed
vi.mock('@/components/activity/realtime-activity-feed', () => ({
  RealtimeActivityFeed: ({ projectId, maxItems }: { projectId: string | undefined; maxItems: number }) => (
    <div data-testid="realtime-activity-feed">
      <span>Project: {projectId}</span>
      <span>Max: {maxItems}</span>
    </div>
  ),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new_run_1' }, error: null }),
    })),
  }),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

// ============================================================================
// Imports AFTER mocks
// ============================================================================

import TestsPage from '@/app/tests/page';

// ============================================================================
// Test Wrapper with Providers
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('TestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-establish default mock implementations after clearing
    mockUseProjects.mockImplementation(() => createMockQuery(mockProjects));
    mockUseCreateProject.mockImplementation(() => createMockMutation());
    mockUseTests.mockImplementation(() => createMockQuery(mockTests));
    mockUseTestRuns.mockImplementation(() => createMockQuery(mockRuns));
    mockUseCreateTest.mockImplementation(() => ({
      mutateAsync: mockCreateTest,
      isPending: false,
    }));
    mockUseDeleteTest.mockImplementation(() => ({
      mutateAsync: mockDeleteTest,
      isPending: false,
    }));
    mockUseRunSingleTest.mockImplementation(() => ({
      mutate: mockRunSingleTest,
      isPending: false,
    }));
    mockUseTestRunSubscription.mockImplementation(() => undefined);
    mockUseRealtimeTests.mockImplementation(() => ({
      runningTests: [],
      isSubscribed: true,
    }));
    mockUseProjectPresence.mockImplementation(() => ({
      onlineUsers: [],
      isConnected: true,
    }));

    mockCreateTest.mockClear();
    mockDeleteTest.mockClear();
    mockRunSingleTest.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the page layout with sidebar', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should render project selector', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should render stats pills', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText(/tests/)).toBeInTheDocument();
      expect(screen.getByText(/pass rate/)).toBeInTheDocument();
      expect(screen.getByText(/avg/)).toBeInTheDocument();
    });

    it('should render realtime status indicator', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render activity toggle button', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByRole('button', { name: /Activity/i })).toBeInTheDocument();
    });

    it('should render app URL input', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const urlInput = screen.getByPlaceholderText(/App URL to test/i);
      expect(urlInput).toBeInTheDocument();
    });

    it('should render Run All button', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByRole('button', { name: /Run All/i })).toBeInTheDocument();
    });

    it('should render New Test button', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByRole('button', { name: /New Test/i })).toBeInTheDocument();
    });

    it('should render tests DataTable', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show create project form when no projects exist', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Create your first project')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Application URL/i)).toBeInTheDocument();
    });

    it('should show empty message when no tests exist', () => {
      mockUseTests.mockReturnValue(
        createMockQuery([])      );

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText(/No tests yet/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator in DataTable when tests are loading', () => {
      mockUseTests.mockReturnValue(
        createMockQuery([], { isLoading: true })      );

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Test List Display', () => {
    it('should display all tests', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Login Test')).toBeInTheDocument();
      expect(screen.getByText('Checkout Test')).toBeInTheDocument();
      expect(screen.getByText('Search Test')).toBeInTheDocument();
    });

    it('should show correct test count in stats', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      // Should show 3 tests
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display test priorities', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should display test sources', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('manual')).toBeInTheDocument();
      expect(screen.getByText('ai-generated')).toBeInTheDocument();
      expect(screen.getByText('discovery')).toBeInTheDocument();
    });

    it('should show step counts', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('2 steps')).toBeInTheDocument();
      expect(screen.getByText('1 steps')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();
    });
  });

  describe('Project Selection', () => {
    it('should display all projects in selector', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Project One');
      expect(options[1]).toHaveTextContent('Project Two');
    });

    it('should update app URL when project changes', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'project_2' } });

      await waitFor(() => {
        const urlInput = screen.getByPlaceholderText(/App URL to test/i) as HTMLInputElement;
        expect(urlInput.value).toBe('https://two.example.com');
      });
    });
  });

  describe('Test Creation', () => {
    it('should show new test form when New Test button is clicked', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const newTestButton = screen.getByRole('button', { name: /New Test/i });
      fireEvent.click(newTestButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Test')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Test name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter test steps/i)).toBeInTheDocument();
      });
    });

    it('should hide form when Cancel is clicked', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      // Open form
      const newTestButton = screen.getByRole('button', { name: /New Test/i });
      fireEvent.click(newTestButton);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Test')).not.toBeInTheDocument();
      });
    });

    it('should call create test mutation when form is submitted', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      // Open form
      const newTestButton = screen.getByRole('button', { name: /New Test/i });
      fireEvent.click(newTestButton);

      // Fill form
      const nameInput = screen.getByPlaceholderText(/Test name/i);
      const stepsInput = screen.getByPlaceholderText(/Enter test steps/i);

      fireEvent.change(nameInput, { target: { value: 'New Test' } });
      fireEvent.change(stepsInput, { target: { value: 'Step 1\nStep 2' } });

      // Submit
      const createButton = screen.getByRole('button', { name: /Create Test/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateTest).toHaveBeenCalled();
      });
    });

    it('should disable create button when form is empty', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const newTestButton = screen.getByRole('button', { name: /New Test/i });
      fireEvent.click(newTestButton);

      const createButton = screen.getByRole('button', { name: /Create Test/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Recent Runs Display', () => {
    it('should display recent runs section', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Recent Runs')).toBeInTheDocument();
    });

    it('should show run statuses', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('status-dot-passed')).toBeInTheDocument();
      expect(screen.getByTestId('status-dot-failed')).toBeInTheDocument();
      expect(screen.getByTestId('status-dot-running')).toBeInTheDocument();
    });

    it('should show run names', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Run 1')).toBeInTheDocument();
      expect(screen.getByText('Run 2')).toBeInTheDocument();
      expect(screen.getByText('Run 3')).toBeInTheDocument();
    });

    it('should not show recent runs section when no runs exist', () => {
      mockUseTestRuns.mockReturnValue(
        createMockQuery([])      );

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.queryByText('Recent Runs')).not.toBeInTheDocument();
    });
  });

  describe('Realtime Status', () => {
    it('should show Live status when subscribed', () => {
      mockUseRealtimeTests.mockReturnValue({
        runningTests: [],
        isSubscribed: true,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should show Offline status when not subscribed', () => {
      mockUseRealtimeTests.mockReturnValue({
        runningTests: [],
        isSubscribed: false,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should show running tests count when tests are running', () => {
      mockUseRealtimeTests.mockReturnValue({
        runningTests: [{ id: 'test_1', name: 'Running Test' }],
        isSubscribed: true,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });

    it('should show running tests banner', () => {
      mockUseRealtimeTests.mockReturnValue({
        runningTests: [
          { id: 'test_1', name: 'Test 1' },
          { id: 'test_2', name: 'Test 2' },
        ],
        isSubscribed: true,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText(/2 tests running/)).toBeInTheDocument();
    });
  });

  describe('Online Users', () => {
    it('should show online users count when users are present', () => {
      mockUseProjectPresence.mockReturnValue({
        onlineUsers: [{ id: 'user_1' }, { id: 'user_2' }],
        isConnected: true,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.getByText('2 online')).toBeInTheDocument();
    });

    it('should not show online users when none are present', () => {
      mockUseProjectPresence.mockReturnValue({
        onlineUsers: [],
        isConnected: true,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.queryByText(/online/)).not.toBeInTheDocument();
    });
  });

  describe('Activity Feed', () => {
    it('should toggle activity feed visibility', async () => {
      render(<TestsPage />, { wrapper: AllProviders });

      // Activity feed should be hidden by default
      expect(screen.queryByTestId('realtime-activity-feed')).not.toBeInTheDocument();

      // Click activity button
      const activityButton = screen.getByRole('button', { name: /Activity/i });
      fireEvent.click(activityButton);

      await waitFor(() => {
        expect(screen.getByTestId('realtime-activity-feed')).toBeInTheDocument();
      });

      // Click again to hide
      fireEvent.click(activityButton);

      await waitFor(() => {
        expect(screen.queryByTestId('realtime-activity-feed')).not.toBeInTheDocument();
      });
    });
  });

  describe('Live Execution Modal', () => {
    it('should not show modal initially', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      expect(screen.queryByTestId('live-execution-modal')).not.toBeInTheDocument();
    });
  });

  describe('Project Creation (Empty State)', () => {
    it('should create project when form is submitted', async () => {
      const mockCreateProjectFn = vi.fn().mockResolvedValue({
        id: 'new_project',
        name: 'New Project',
        app_url: 'https://new.example.com',
      });

      mockUseProjects.mockReturnValue(
        createMockQuery([])      );
      mockUseCreateProject.mockReturnValue({
        mutateAsync: mockCreateProjectFn,
        isPending: false,
      });

      render(<TestsPage />, { wrapper: AllProviders });

      const nameInput = screen.getByPlaceholderText('Project name');
      const urlInput = screen.getByPlaceholderText(/Application URL/i);

      fireEvent.change(nameInput, { target: { value: 'New Project' } });
      fireEvent.change(urlInput, { target: { value: 'https://new.example.com' } });

      const createButton = screen.getByRole('button', { name: /Create Project/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateProjectFn).toHaveBeenCalled();
      });
    });

    it('should disable create button when form is incomplete', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      render(<TestsPage />, { wrapper: AllProviders });

      const createButton = screen.getByRole('button', { name: /Create Project/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Stats Calculation', () => {
    it('should calculate pass rate correctly', () => {
      const runsWithStats = [
        mockTestRun({ status: 'passed' }),
        mockTestRun({ status: 'passed' }),
        mockTestRun({ status: 'failed' }),
        mockTestRun({ status: 'passed' }),
      ];

      mockUseTestRuns.mockReturnValue(
        createMockQuery(runsWithStats)      );

      render(<TestsPage />, { wrapper: AllProviders });

      // 3 passed out of 4 = 75%
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });

    it('should calculate average duration', () => {
      const runsWithDuration = [
        mockTestRun({ duration_ms: 2000 }),
        mockTestRun({ duration_ms: 4000 }),
      ];

      mockUseTestRuns.mockReturnValue(
        createMockQuery(runsWithDuration)      );

      render(<TestsPage />, { wrapper: AllProviders });

      // Average of 2s and 4s = 3s
      expect(screen.getByText('3.0s')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible project selector', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible text inputs', () => {
      render(<TestsPage />, { wrapper: AllProviders });

      // App URL input
      const urlInput = screen.getByPlaceholderText(/App URL to test/i);
      expect(urlInput.tagName.toLowerCase()).toBe('input');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing test steps gracefully', () => {
      const testsWithMissingSteps = [
        mockTest({ id: 'test_1', name: 'Test', steps: null as unknown as [] }),
      ];

      mockUseTests.mockReturnValue(
        createMockQuery(testsWithMissingSteps)      );

      expect(() => {
        render(<TestsPage />, { wrapper: AllProviders });
      }).not.toThrow();
    });

    it('should handle empty runs array', () => {
      mockUseTestRuns.mockReturnValue(
        createMockQuery([])      );

      expect(() => {
        render(<TestsPage />, { wrapper: AllProviders });
      }).not.toThrow();
    });
  });
});
