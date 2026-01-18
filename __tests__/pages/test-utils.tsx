/**
 * Test Utilities for Page Tests
 *
 * Provides mocks, wrappers, and utilities for testing dashboard pages
 * with Vitest and React Testing Library.
 */

import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// Mock Data Factories
// ============================================================================

export const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john@example.com',
  imageUrl: 'https://example.com/avatar.png',
};

export const mockProject = (overrides = {}) => ({
  id: `project_${Date.now()}`,
  name: 'Test Project',
  slug: 'test-project',
  app_url: 'https://test.example.com',
  description: 'A test project for testing',
  user_id: 'user_123',
  organization_id: 'org_123',
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockTest = (overrides = {}) => ({
  id: `test_${Date.now()}`,
  project_id: 'project_123',
  name: 'Sample Test',
  description: 'A sample test',
  steps: [
    { instruction: 'Navigate to login page' },
    { instruction: 'Enter username' },
    { instruction: 'Enter password' },
    { instruction: 'Click login button' },
  ],
  priority: 'medium' as const,
  source: 'manual' as const,
  tags: ['auth', 'login'],
  created_by: 'user_123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockTestRun = (overrides = {}) => ({
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

export const mockDiscoverySession = (overrides = {}) => ({
  id: `discovery_${Date.now()}`,
  project_id: 'project_123',
  status: 'completed' as const,
  pages_found: 15,
  flows_found: 5,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  ...overrides,
});

export const mockVisualBaseline = (overrides = {}) => ({
  id: `baseline_${Date.now()}`,
  project_id: 'project_123',
  name: 'Homepage Baseline',
  page_url: 'https://test.example.com/',
  viewport: { width: 1920, height: 1080 },
  screenshot_url: 'https://storage.example.com/baseline.png',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockVisualComparison = (overrides = {}) => ({
  id: `comparison_${Date.now()}`,
  project_id: 'project_123',
  baseline_id: 'baseline_123',
  status: 'match' as const,
  diff_percentage: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockQualityAudit = (overrides = {}) => ({
  id: `audit_${Date.now()}`,
  project_id: 'project_123',
  page_url: 'https://test.example.com/',
  performance_score: 85,
  accessibility_score: 92,
  best_practices_score: 88,
  seo_score: 90,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockOrganization = (overrides = {}) => ({
  id: 'org_123',
  name: 'Test Organization',
  slug: 'test-org',
  plan: 'pro',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockApiKey = (overrides = {}) => ({
  id: `key_${Date.now()}`,
  name: 'Test API Key',
  key_prefix: 'arg_test_',
  scopes: ['read', 'write'],
  is_active: true,
  last_used_at: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockUserProfile = (overrides = {}) => ({
  id: 'user_123',
  display_name: 'John Doe',
  email: 'john@example.com',
  bio: 'Test user',
  avatar_url: 'https://example.com/avatar.png',
  timezone: 'America/New_York',
  language: 'en',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockUserSettings = (overrides = {}) => ({
  notifications: {
    email_notifications: true,
    slack_notifications: false,
    in_app_notifications: true,
    test_failure_alerts: true,
    daily_digest: true,
    weekly_report: false,
    alert_threshold: 80,
  },
  test_defaults: {
    default_browser: 'chromium' as const,
    default_timeout: 30000,
    parallel_execution: true,
    retry_failed_tests: true,
    max_retries: 3,
    screenshot_on_failure: true,
    video_recording: false,
  },
  ...overrides,
});

export const mockReportsStats = (overrides = {}) => ({
  avgPassRate: 85,
  avgDuration: 4.5,
  totalRuns: 100,
  dailyStats: [
    { date: '2024-01-01', day: 'Mon', passed: 8, failed: 2 },
    { date: '2024-01-02', day: 'Tue', passed: 9, failed: 1 },
    { date: '2024-01-03', day: 'Wed', passed: 10, failed: 0 },
  ],
  ...overrides,
});

// ============================================================================
// Mock Hooks
// ============================================================================

// Clerk mocks
export const mockUseUser = () => ({
  user: mockUser,
  isLoaded: true,
  isSignedIn: true,
});

export const mockUseUserNotLoaded = () => ({
  user: null,
  isLoaded: false,
  isSignedIn: false,
});

// Next.js Router mocks
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

export const mockParams = (params: Record<string, string> = {}) => params;

// Create mock mutation result
export const createMockMutation = (overrides = {}) => ({
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

// Create mock query result
export const createMockQuery = <T,>(data: T, overrides = {}) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  isFetching: false,
  isSuccess: true,
  ...overrides,
});

// ============================================================================
// Module Mocks
// ============================================================================

// Setup all common mocks
export function setupMocks() {
  // Mock Clerk
  vi.mock('@clerk/nextjs', () => ({
    useUser: vi.fn(() => mockUseUser()),
    useAuth: vi.fn(() => ({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
      getToken: vi.fn().mockResolvedValue('test-token'),
    })),
    SignIn: () => null,
    SignUp: () => null,
    ClerkProvider: ({ children }: { children: ReactNode }) => children,
  }));

  // Mock Next.js navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
  }));

  // Mock Supabase client
  vi.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: () => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    }),
  }));

  // Mock date-fns for consistent date formatting
  vi.mock('date-fns', async () => {
    const actual = await vi.importActual('date-fns');
    return {
      ...actual,
      formatDistanceToNow: vi.fn(() => '2 hours ago'),
    };
  });

  // Mock version
  vi.mock('@/lib/version', () => ({
    APP_VERSION: '1.0.0-test',
  }));
}

// ============================================================================
// Hook Mock Factories
// ============================================================================

export function createProjectsHookMocks(projects = [mockProject()]) {
  return {
    useProjects: vi.fn(() => createMockQuery(projects)),
    useProject: vi.fn((id: string) =>
      createMockQuery(projects.find((p) => p.id === id) || null)
    ),
    useCreateProject: vi.fn(() => createMockMutation()),
    useUpdateProject: vi.fn(() => createMockMutation()),
    useDeleteProject: vi.fn(() => createMockMutation()),
  };
}

export function createTestsHookMocks(tests = [mockTest()], runs = [mockTestRun()]) {
  return {
    useTests: vi.fn(() => createMockQuery(tests)),
    useTestRuns: vi.fn(() => createMockQuery(runs)),
    useCreateTest: vi.fn(() => createMockMutation()),
    useDeleteTest: vi.fn(() => createMockMutation()),
    useRunSingleTest: vi.fn(() => createMockMutation()),
    useRunTest: vi.fn(() => createMockMutation()),
    useTestRunSubscription: vi.fn(),
  };
}

export function createDiscoveryHookMocks(
  sessions = [mockDiscoverySession()],
  pages: unknown[] = []
) {
  return {
    useDiscoverySessions: vi.fn(() => createMockQuery(sessions)),
    useDiscoveredPages: vi.fn(() => createMockQuery(pages)),
  };
}

export function createVisualHookMocks(
  baselines = [mockVisualBaseline()],
  comparisons = [mockVisualComparison()]
) {
  return {
    useVisualBaselines: vi.fn(() => createMockQuery(baselines)),
    useVisualComparisons: vi.fn(() => createMockQuery(comparisons)),
  };
}

export function createQualityHookMocks(audits = [mockQualityAudit()]) {
  return {
    useQualityAudits: vi.fn(() => createMockQuery(audits)),
  };
}

export function createReportsHookMocks(
  stats = mockReportsStats(),
  runs = [mockTestRun()]
) {
  return {
    useReportsStats: vi.fn(() => createMockQuery(stats)),
    useRecentRuns: vi.fn(() => createMockQuery(runs)),
  };
}

export function createSettingsHookMocks() {
  const profile = mockUserProfile();
  const settings = mockUserSettings();
  const org = mockOrganization();
  const keys = [mockApiKey()];

  return {
    useUserProfile: vi.fn(() => ({
      profile,
      loading: false,
      error: null,
      updateProfile: vi.fn().mockResolvedValue(undefined),
      isUpdating: false,
      updateSuccess: false,
    })),
    useUserSettings: vi.fn(() => ({
      settings,
      isLoading: false,
      error: null,
      updateNotificationPreferences: vi.fn().mockResolvedValue(undefined),
      updateTestDefaults: vi.fn().mockResolvedValue(undefined),
      isUpdating: false,
      notificationsMutation: createMockMutation(),
      testDefaultsMutation: createMockMutation(),
    })),
    useCurrentOrganization: vi.fn(() => ({
      organization: org,
      loading: false,
      error: null,
    })),
    useApiKeys: vi.fn(() => createMockQuery(keys)),
    useCreateApiKey: vi.fn(() => createMockMutation()),
    useRevokeApiKey: vi.fn(() => createMockMutation()),
  };
}

export function createTestLibraryHookMocks(tests = [mockTest()]) {
  return {
    useTestLibrary: vi.fn(() => createMockQuery(tests)),
    useTestLibraryStats: vi.fn(() => ({
      stats: {
        totalTests: tests.length,
        recentTests: 2,
        byPriority: {
          critical: 1,
          high: 2,
          medium: 3,
          low: 1,
        },
      },
      isLoading: false,
    })),
    useDeleteLibraryTest: vi.fn(() => createMockMutation()),
    useDuplicateLibraryTest: vi.fn(() => createMockMutation()),
    useTestTags: vi.fn(() => ['auth', 'login', 'checkout']),
  };
}

export function createLiveSessionHookMocks() {
  return {
    useActiveSessions: vi.fn(() => createMockQuery([])),
    useActivityStream: vi.fn(() => createMockQuery([])),
  };
}

export function createRealtimeHookMocks() {
  return {
    useRealtimeTests: vi.fn(() => ({
      runningTests: [],
      isSubscribed: true,
    })),
    useProjectPresence: vi.fn(() => ({
      onlineUsers: [],
      isConnected: true,
    })),
  };
}

// ============================================================================
// Test Wrapper with Providers
// ============================================================================

export function createTestQueryClient() {
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

interface AllProvidersProps {
  children: ReactNode;
}

export function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ============================================================================
// Test Helpers
// ============================================================================

export async function waitForLoadingToComplete(
  findByText: (text: string | RegExp) => Promise<HTMLElement>,
  timeout = 5000
) {
  // Wait for loading indicator to disappear
  await vi.waitFor(
    async () => {
      try {
        await findByText(/loading/i);
        throw new Error('Still loading');
      } catch {
        // Loading is complete if we can't find the loading text
        return true;
      }
    },
    { timeout }
  );
}

export function expectLoadingState(container: HTMLElement) {
  // Check for common loading indicators
  const spinner = container.querySelector('[class*="animate-spin"]');
  const loadingText = container.textContent?.match(/loading/i);
  return spinner !== null || loadingText !== null;
}

export function expectEmptyState(container: HTMLElement, message: string | RegExp) {
  const content = container.textContent || '';
  if (typeof message === 'string') {
    return content.includes(message);
  }
  return message.test(content);
}

// ============================================================================
// Event Simulation Helpers
// ============================================================================

export function createChangeEvent(value: string) {
  return { target: { value } };
}

export function createSelectEvent(value: string) {
  return { target: { value } };
}
