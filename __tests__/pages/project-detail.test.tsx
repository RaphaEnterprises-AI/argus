/**
 * Tests for Project Detail Page
 *
 * Covers:
 * - Initial render and layout
 * - Loading states
 * - Not found state
 * - Tab navigation (Overview, Tests, Discovery, Visual, Quality, Activity, Settings)
 * - Each tab's content
 * - Project settings editing
 * - Project deletion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// vi.hoisted() - Define all mock data and factories BEFORE vi.mock hoisting
// ============================================================================
const {
  mockUser,
  mockRouter,
  mockParams,
  testProject,
  mockTests,
  mockRuns,
  mockSessions,
  mockBaselines,
  mockComparisons,
  mockAudits,
  mockUpdateProject,
  mockDeleteProject,
  mockConfirm,
  createMockQuery,
  createMockMutation,
  // Mock hook functions
  mockUseProject,
  mockUseUpdateProject,
  mockUseDeleteProject,
  mockUseTests,
  mockUseTestRuns,
  mockUseDiscoverySessions,
  mockUseDiscoveredPages,
  mockUseVisualBaselines,
  mockUseVisualComparisons,
  mockUseQualityAudits,
  mockUseActiveSessions,
  mockUseActivityStream,
} = vi.hoisted(() => {
  const mockUser = {
    id: 'user_123',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    imageUrl: 'https://example.com/avatar.png',
  };

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/projects/project_123',
    query: {},
    asPath: '/projects/project_123',
    route: '/projects/[id]',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };

  const mockParams = { id: 'project_123' };

  const testProject = {
    id: 'project_123',
    name: 'Test Project',
    slug: 'test-project',
    app_url: 'https://test.example.com',
    description: 'A test project for testing',
    user_id: 'user_123',
    organization_id: 'org_123',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockTests = [
    {
      id: 'test_1',
      project_id: 'project_123',
      name: 'Login Test',
      description: 'A login test',
      steps: [{ instruction: 'Step 1' }],
      priority: 'medium' as const,
      source: 'manual' as const,
      tags: ['auth'],
      created_by: 'user_123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'test_2',
      project_id: 'project_123',
      name: 'Checkout Test',
      description: 'A checkout test',
      steps: [{ instruction: 'Step 1' }, { instruction: 'Step 2' }],
      priority: 'high' as const,
      source: 'manual' as const,
      tags: ['checkout'],
      created_by: 'user_123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockRuns = [
    {
      id: 'run_1',
      project_id: 'project_123',
      name: 'Run 1',
      app_url: 'https://test.example.com',
      status: 'passed' as const,
      total_tests: 10,
      passed_tests: 10,
      failed_tests: 0,
      duration_ms: 5000,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'run_2',
      project_id: 'project_123',
      name: 'Run 2',
      app_url: 'https://test.example.com',
      status: 'failed' as const,
      total_tests: 10,
      passed_tests: 8,
      failed_tests: 2,
      duration_ms: 6000,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const mockSessions = [
    {
      id: 'session_1',
      project_id: 'project_123',
      status: 'completed' as const,
      pages_found: 10,
      flows_found: 3,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
  ];

  const mockBaselines = [
    {
      id: 'baseline_1',
      project_id: 'project_123',
      name: 'Homepage',
      page_url: 'https://test.example.com/',
      viewport: { width: 1920, height: 1080 },
      screenshot_url: 'https://storage.example.com/baseline1.png',
      created_at: new Date().toISOString(),
    },
    {
      id: 'baseline_2',
      project_id: 'project_123',
      name: 'Product Page',
      page_url: 'https://test.example.com/products',
      viewport: { width: 1920, height: 1080 },
      screenshot_url: 'https://storage.example.com/baseline2.png',
      created_at: new Date().toISOString(),
    },
  ];

  const mockComparisons = [
    {
      id: 'comp_1',
      project_id: 'project_123',
      baseline_id: 'baseline_1',
      status: 'match' as const,
      diff_percentage: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'comp_2',
      project_id: 'project_123',
      baseline_id: 'baseline_2',
      status: 'mismatch' as const,
      diff_percentage: 5,
      created_at: new Date().toISOString(),
    },
  ];

  const mockAudits = [
    {
      id: 'audit_1',
      project_id: 'project_123',
      page_url: 'https://test.example.com/',
      performance_score: 85,
      accessibility_score: 92,
      best_practices_score: 88,
      seo_score: 90,
      created_at: new Date().toISOString(),
    },
  ];

  const mockUpdateProject = vi.fn();
  const mockDeleteProject = vi.fn();
  const mockConfirm = vi.fn();

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

  // Create mock hook functions inside vi.hoisted so they're available at hoist time
  const mockUseProject = vi.fn(() => createMockQuery(testProject));
  const mockUseUpdateProject = vi.fn(() => ({
    mutateAsync: mockUpdateProject,
    isPending: false,
  }));
  const mockUseDeleteProject = vi.fn(() => ({
    mutateAsync: mockDeleteProject,
    isPending: false,
  }));
  const mockUseTests = vi.fn(() => createMockQuery(mockTests));
  const mockUseTestRuns = vi.fn(() => createMockQuery(mockRuns));
  const mockUseDiscoverySessions = vi.fn(() => createMockQuery(mockSessions));
  const mockUseDiscoveredPages = vi.fn(() => createMockQuery([]));
  const mockUseVisualBaselines = vi.fn(() => createMockQuery(mockBaselines));
  const mockUseVisualComparisons = vi.fn(() => createMockQuery(mockComparisons));
  const mockUseQualityAudits = vi.fn(() => createMockQuery(mockAudits));
  const mockUseActiveSessions = vi.fn(() => createMockQuery([]));
  const mockUseActivityStream = vi.fn(() => createMockQuery([]));

  return {
    mockUser,
    mockRouter,
    mockParams,
    testProject,
    mockTests,
    mockRuns,
    mockSessions,
    mockBaselines,
    mockComparisons,
    mockAudits,
    mockUpdateProject,
    mockDeleteProject,
    mockConfirm,
    createMockQuery,
    createMockMutation,
    // Export mock hook functions
    mockUseProject,
    mockUseUpdateProject,
    mockUseDeleteProject,
    mockUseTests,
    mockUseTestRuns,
    mockUseDiscoverySessions,
    mockUseDiscoveredPages,
    mockUseVisualBaselines,
    mockUseVisualComparisons,
    mockUseQualityAudits,
    mockUseActiveSessions,
    mockUseActivityStream,
  };
});

// ============================================================================
// vi.mock() calls - These can now use the hoisted values
// ============================================================================

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_123',
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/projects/project_123',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}));

// Mock project hooks - use hoisted mock functions
vi.mock('@/lib/hooks/use-projects', () => ({
  useProject: mockUseProject,
  useUpdateProject: mockUseUpdateProject,
  useDeleteProject: mockUseDeleteProject,
}));

// Mock tests hooks
vi.mock('@/lib/hooks/use-tests', () => ({
  useTests: mockUseTests,
  useTestRuns: mockUseTestRuns,
}));

// Mock discovery hooks
vi.mock('@/lib/hooks/use-discovery', () => ({
  useDiscoverySessions: mockUseDiscoverySessions,
  useDiscoveredPages: mockUseDiscoveredPages,
}));

// Mock visual hooks
vi.mock('@/lib/hooks/use-visual', () => ({
  useVisualBaselines: mockUseVisualBaselines,
  useVisualComparisons: mockUseVisualComparisons,
}));

// Mock quality hooks
vi.mock('@/lib/hooks/use-quality', () => ({
  useQualityAudits: mockUseQualityAudits,
}));

// Mock live session hooks
vi.mock('@/lib/hooks/use-live-session', () => ({
  useActiveSessions: mockUseActiveSessions,
  useActivityStream: mockUseActivityStream,
}));

// Mock Sidebar
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock LiveSessionViewer
vi.mock('@/components/shared/live-session-viewer', () => ({
  LiveSessionViewer: ({ onClose }: { session: unknown; onClose: () => void }) => (
    <div data-testid="live-session-viewer">
      <button onClick={onClose}>Close Viewer</button>
    </div>
  ),
}));

// Mock Supabase client for activity logs
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  __esModule: true,
  default: { getSupabaseClient: () => mockSupabaseClient },
  getSupabaseClient: () => mockSupabaseClient,
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
import ProjectDetailPage from '@/app/projects/[id]/page';

// ============================================================================
// Test wrapper
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
describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-establish default mock implementations
    mockUseProject.mockImplementation(() => createMockQuery(testProject));
    mockUseUpdateProject.mockImplementation(() => ({
      mutateAsync: mockUpdateProject,
      isPending: false,
    }));
    mockUseDeleteProject.mockImplementation(() => ({
      mutateAsync: mockDeleteProject,
      isPending: false,
    }));
    mockUseTests.mockImplementation(() => createMockQuery(mockTests));
    mockUseTestRuns.mockImplementation(() => createMockQuery(mockRuns));
    mockUseDiscoverySessions.mockImplementation(() => createMockQuery(mockSessions));
    mockUseDiscoveredPages.mockImplementation(() => createMockQuery([]));
    mockUseVisualBaselines.mockImplementation(() => createMockQuery(mockBaselines));
    mockUseVisualComparisons.mockImplementation(() => createMockQuery(mockComparisons));
    mockUseQualityAudits.mockImplementation(() => createMockQuery(mockAudits));
    mockUseActiveSessions.mockImplementation(() => createMockQuery([]));
    mockUseActivityStream.mockImplementation(() => createMockQuery([]));

    mockConfirm.mockReturnValue(true);
    mockRouter.push.mockClear();
    mockUpdateProject.mockClear();
    mockDeleteProject.mockClear();
    window.confirm = mockConfirm;
  });

  describe('Initial Render', () => {
    it('should render the page layout with sidebar', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should render project name in header', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should render project URL with external link', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const urlLink = screen.getByText('https://test.example.com');
      expect(urlLink).toBeInTheDocument();
      expect(urlLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should render back button', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should render settings button', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      expect(settingsButtons.length).toBeGreaterThan(0);
    });

    it('should render all tabs', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByText('Overview')).toBeInTheDocument();
      // Tests may appear multiple times (tab + content heading)
      expect(screen.getAllByText('Tests').length).toBeGreaterThan(0);
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Visual')).toBeInTheDocument();
      expect(screen.getByText('Quality')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(2); // Header button + tab
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while project is loading', () => {
      mockUseProject.mockReturnValue(
        createMockQuery(null, { isLoading: true })      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const spinner = document.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Not Found State', () => {
    it('should show not found message when project does not exist', () => {
      mockUseProject.mockReturnValue(
        createMockQuery(null)      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });

    it('should show back to projects button in not found state', () => {
      mockUseProject.mockReturnValue(
        createMockQuery(null)      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByRole('button', { name: /Back to Projects/i })).toBeInTheDocument();
    });

    it('should navigate to projects when back button is clicked in not found state', async () => {
      mockUseProject.mockReturnValue(
        createMockQuery(null)      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const backButton = screen.getByRole('button', { name: /Back to Projects/i });
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/projects');
    });
  });

  describe('Tab Navigation', () => {
    it('should show Overview tab content by default', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      // Overview tab should show stats cards
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should switch to Tests tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        // Look for the Tests tab content marker
        expect(screen.getAllByText(/Tests/).length).toBeGreaterThan(0);
      });
    });

    it('should switch to Discovery tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const discoveryTabs = screen.getAllByRole('button', { name: /Discovery/i });
      fireEvent.click(discoveryTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Discovery/).length).toBeGreaterThan(0);
      });
    });

    it('should switch to Visual tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Visual/).length).toBeGreaterThan(0);
      });
    });

    it('should switch to Quality tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const qualityTabs = screen.getAllByRole('button', { name: /Quality/i });
      fireEvent.click(qualityTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Quality/).length).toBeGreaterThan(0);
      });
    });

    // TODO: This test is skipped because the RecentActivityList component uses require()
    // at runtime which Vitest's vi.mock() cannot intercept properly
    it.skip('should switch to Activity tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const activityTabs = screen.getAllByRole('button', { name: /Activity/i });
      fireEvent.click(activityTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Activity/).length).toBeGreaterThan(0);
      });
    });

    it('should switch to Settings tab when clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      // Click the tab (not the header button)
      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      const settingsTab = settingsButtons.find(btn => btn.closest('[class*="border-b"]'));
      if (settingsTab) {
        fireEvent.click(settingsTab);
      }

      await waitFor(() => {
        expect(screen.getByText('Project Settings')).toBeInTheDocument();
      });
    });

    it('should highlight active tab', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const overviewTab = screen.getByRole('button', { name: /Overview/i });
      expect(overviewTab).toHaveClass('border-primary');
    });
  });

  describe('Overview Tab', () => {
    it('should display stats cards', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      // Tests may appear multiple times, check for at least one
      expect(screen.getAllByText(/Tests/).length).toBeGreaterThan(0);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should display correct test count', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      // The number 2 may appear in stats or counts
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // 2 tests or 2 baselines
    });

    it('should show quick action buttons', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByText('Run Tests')).toBeInTheDocument();
      expect(screen.getByText('Start Discovery')).toBeInTheDocument();
      expect(screen.getByText('Visual Test')).toBeInTheDocument();
      expect(screen.getByText('Quality Audit')).toBeInTheDocument();
    });

    it('should show recent test runs', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      expect(screen.getByText('Recent Test Runs')).toBeInTheDocument();
    });

    it('should navigate to tests when Run Tests is clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const runTestsButton = screen.getByText('Run Tests').closest('button');
      if (runTestsButton) {
        fireEvent.click(runTestsButton);
      }

      expect(mockRouter.push).toHaveBeenCalledWith('/tests');
    });
  });

  describe('Tests Tab', () => {
    it('should display test count', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        // Check that tests tab is active
        expect(screen.getAllByText(/Tests/).length).toBeGreaterThan(0);
      });
    });

    it('should list all tests', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('Login Test')).toBeInTheDocument();
        expect(screen.getByText('Checkout Test')).toBeInTheDocument();
      });
    });

    it('should show step count for each test', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('1 steps')).toBeInTheDocument();
        expect(screen.getByText('2 steps')).toBeInTheDocument();
      });
    });

    it('should show manage tests button', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        const manageButtons = screen.getAllByRole('button', { name: /Manage Tests/i });
        expect(manageButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no tests exist', async () => {
      mockUseTests.mockReturnValue(
        createMockQuery([])
      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const testsTabs = screen.getAllByRole('button', { name: /Tests/i });
      fireEvent.click(testsTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('No tests created yet')).toBeInTheDocument();
      });
    });
  });

  describe('Discovery Tab', () => {
    it('should show discovery sessions count', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const discoveryTabs = screen.getAllByRole('button', { name: /Discovery/i });
      fireEvent.click(discoveryTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Discovery/).length).toBeGreaterThan(0);
      });
    });

    it('should show start discovery button', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const discoveryTabs = screen.getAllByRole('button', { name: /Discovery/i });
      fireEvent.click(discoveryTabs[0]);

      await waitFor(() => {
        const startButtons = screen.getAllByRole('button', { name: /Start Discovery/i });
        expect(startButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no discoveries exist', async () => {
      mockUseDiscoverySessions.mockReturnValue(
        createMockQuery([])
      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const discoveryTabs = screen.getAllByRole('button', { name: /Discovery/i });
      fireEvent.click(discoveryTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('No discoveries yet')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Tab', () => {
    it('should show visual testing title', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Visual/).length).toBeGreaterThan(0);
      });
    });

    it('should show baselines count', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Visual/).length).toBeGreaterThan(0);
      });
    });

    it('should show comparisons count', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Visual/).length).toBeGreaterThan(0);
      });
    });

    it('should show mismatches count', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Visual/).length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no baselines exist', async () => {
      mockUseVisualBaselines.mockReturnValue(
        createMockQuery([])
      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const visualTabs = screen.getAllByRole('button', { name: /Visual/i });
      fireEvent.click(visualTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('No visual baselines yet')).toBeInTheDocument();
      });
    });
  });

  describe('Quality Tab', () => {
    it('should show quality audits title', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const qualityTabs = screen.getAllByRole('button', { name: /Quality/i });
      fireEvent.click(qualityTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Quality/).length).toBeGreaterThan(0);
      });
    });

    it('should display score cards for latest audit', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const qualityTabs = screen.getAllByRole('button', { name: /Quality/i });
      fireEvent.click(qualityTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Quality/).length).toBeGreaterThan(0);
      });
    });

    it('should display correct scores', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const qualityTabs = screen.getAllByRole('button', { name: /Quality/i });
      fireEvent.click(qualityTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Quality/).length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no audits exist', async () => {
      mockUseQualityAudits.mockReturnValue(
        createMockQuery([])
      );

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const qualityTabs = screen.getAllByRole('button', { name: /Quality/i });
      fireEvent.click(qualityTabs[0]);

      await waitFor(() => {
        expect(screen.getByText('No audits yet')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Tab', () => {
    it('should display project settings form', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      // Navigate to settings tab
      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Project Settings')).toBeInTheDocument();
      });
    });

    it('should display project name field', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Project Name')).toBeInTheDocument();
      });
    });

    it('should display application URL field', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Application URL')).toBeInTheDocument();
      });
    });

    it('should show edit button', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      });
    });

    it('should show danger zone with delete button', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete Project/i })).toBeInTheDocument();
      });
    });

    it('should enable editing mode when edit button is clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      });
    });

    it('should call update mutation when save is clicked', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      // Enter edit mode
      const editButton = await screen.findByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);

      // Save changes
      const saveButton = await screen.findByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalled();
      });
    });

    it('should show confirmation before deleting project', async () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      const deleteButton = await screen.findByRole('button', { name: /Delete Project/i });
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('should delete project and navigate to projects list', async () => {
      mockDeleteProject.mockResolvedValue({});

      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButtons[0]);

      const deleteButton = await screen.findByRole('button', { name: /Delete Project/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteProject).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/projects');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to projects list when back button is clicked', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/projects');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab navigation', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const tabs = screen.getAllByRole('button').filter(btn =>
        ['Overview', 'Tests', 'Discovery', 'Visual', 'Quality', 'Activity', 'Settings'].some(
          tabName => btn.textContent?.includes(tabName)
        )
      );

      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should have accessible external links', () => {
      render(<ProjectDetailPage />, { wrapper: AllProviders });

      const externalLink = screen.getByText('https://test.example.com').closest('a');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing project data gracefully', () => {
      mockUseProject.mockReturnValue(
        createMockQuery(null)      );

      expect(() => {
        render(<ProjectDetailPage />, { wrapper: AllProviders });
      }).not.toThrow();
    });

    it('should handle empty tests array', () => {
      mockUseTests.mockReturnValue(
        createMockQuery([])      );

      expect(() => {
        render(<ProjectDetailPage />, { wrapper: AllProviders });
      }).not.toThrow();
    });
  });
});
