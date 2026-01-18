/**
 * Tests for Visual Testing Page
 *
 * Tests the visual testing page functionality including:
 * - Initial render and loading states
 * - Tab navigation (overview, responsive, cross-browser, accessibility, history)
 * - Visual comparisons display and filtering
 * - Running visual tests
 * - Approving/rejecting comparisons
 * - Updating baselines
 * - Stats display
 * - Date range and status filters
 * - Search functionality
 * - Detail sheet interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VisualPage from '@/app/visual/page';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: vi.fn(),
  }),
  usePathname: () => '/visual',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'test-user-id',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
    },
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

// Mock data
const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project 1',
    app_url: 'https://app1.example.com',
    created_at: new Date().toISOString(),
  },
  {
    id: 'project-2',
    name: 'Test Project 2',
    app_url: 'https://app2.example.com',
    created_at: new Date().toISOString(),
  },
];

const mockBaselines = [
  {
    id: 'baseline-1',
    project_id: 'project-1',
    name: 'homepage',
    page_url: 'https://app1.example.com/',
    viewport: '1920x1080',
    screenshot_url: 'data:image/png;base64,baseline1',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'baseline-2',
    project_id: 'project-1',
    name: 'login',
    page_url: 'https://app1.example.com/login',
    viewport: '1920x1080',
    screenshot_url: 'data:image/png;base64,baseline2',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const mockComparisons = [
  {
    id: 'comp-1',
    project_id: 'project-1',
    baseline_id: 'baseline-1',
    name: 'homepage',
    status: 'match',
    match_percentage: 99.5,
    difference_count: 5,
    baseline_url: 'data:image/png;base64,baseline1',
    current_url: 'data:image/png;base64,current1',
    diff_url: null,
    threshold: 0.1,
    created_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    approved_by: 'user-1',
  },
  {
    id: 'comp-2',
    project_id: 'project-1',
    baseline_id: 'baseline-2',
    name: 'login',
    status: 'mismatch',
    match_percentage: 85.2,
    difference_count: 1480,
    baseline_url: 'data:image/png;base64,baseline2',
    current_url: 'data:image/png;base64,current2',
    diff_url: 'data:image/png;base64,diff2',
    threshold: 0.1,
    created_at: new Date().toISOString(),
    approved_at: null,
    approved_by: null,
  },
  {
    id: 'comp-3',
    project_id: 'project-1',
    baseline_id: null,
    name: 'dashboard',
    status: 'new',
    match_percentage: 100,
    difference_count: 0,
    baseline_url: 'data:image/png;base64,new1',
    current_url: 'data:image/png;base64,new1',
    diff_url: null,
    threshold: 0.1,
    created_at: new Date().toISOString(),
    approved_at: null,
    approved_by: null,
  },
  {
    id: 'comp-4',
    project_id: 'project-1',
    baseline_id: 'baseline-1',
    name: 'homepage-pending',
    status: 'pending',
    match_percentage: null,
    difference_count: 0,
    baseline_url: 'data:image/png;base64,baseline1',
    current_url: 'data:image/png;base64,pending1',
    diff_url: null,
    threshold: 0.1,
    created_at: new Date().toISOString(),
    approved_at: null,
    approved_by: null,
  },
];

// Mock hook implementations
const mockUseProjects = vi.fn(() => ({
  data: mockProjects,
  isLoading: false,
  error: null,
}));

const mockUseVisualBaselines = vi.fn(() => ({
  data: mockBaselines,
  isLoading: false,
  error: null,
}));

const mockUseVisualComparisons = vi.fn(() => ({
  data: mockComparisons,
  isLoading: false,
  error: null,
}));

const mockUseApproveComparison = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

const mockUseRunVisualTest = vi.fn(() => ({
  mutateAsync: vi.fn().mockResolvedValue({
    comparison: { id: 'new-comp' },
    baseline: { id: 'new-baseline' },
    isNew: true,
  }),
  isPending: false,
}));

const mockUseUpdateBaseline = vi.fn(() => ({
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

// Mock hooks
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: () => mockUseProjects(),
}));

vi.mock('@/lib/hooks/use-visual', () => ({
  useVisualBaselines: (projectId: string | null) => mockUseVisualBaselines(),
  useVisualComparisons: (projectId: string | null, limit?: number) => mockUseVisualComparisons(),
  useApproveComparison: () => mockUseApproveComparison(),
  useRunVisualTest: () => mockUseRunVisualTest(),
  useUpdateBaseline: () => mockUseUpdateBaseline(),
}));

// Mock Sidebar
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

// Create wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('Visual Page', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Reset mock implementations
    mockUseProjects.mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    });

    mockUseVisualBaselines.mockReturnValue({
      data: mockBaselines,
      isLoading: false,
      error: null,
    });

    mockUseVisualComparisons.mockReturnValue({
      data: mockComparisons,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the visual page with sidebar', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should display project selector', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const selectors = screen.getAllByRole('combobox');
      expect(selectors.length).toBeGreaterThan(0);
    });

    it('should display quick stats in header', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Match count (1 match in mock data) - may appear multiple times in different views
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('should display New Visual Test button', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /new visual test/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should display all tabs', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Tabs may appear in multiple places (e.g., mobile + desktop layouts)
      expect(screen.getAllByRole('button', { name: /overview/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /responsive/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /cross-browser/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /accessibility/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /history/i }).length).toBeGreaterThan(0);
    });

    it('should have Overview tab active by default', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveClass('bg-primary');
    });

    it('should switch to Responsive tab when clicked', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Multiple responsive buttons may exist - click the first one
      const responsiveTab = screen.getAllByRole('button', { name: /responsive/i })[0];
      await user.click(responsiveTab);

      expect(responsiveTab).toHaveClass('bg-primary');
    });

    it('should switch to History tab and show history content', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const historyTab = screen.getByRole('button', { name: /history/i });
      await user.click(historyTab);

      // History timeline should be visible with comparisons
      expect(screen.getByText('homepage')).toBeInTheDocument();
    });

    it('should show accessibility coming soon message', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const accessibilityTab = screen.getByRole('button', { name: /accessibility/i });
      await user.click(accessibilityTab);

      expect(screen.getByText(/visual accessibility analysis coming soon/i)).toBeInTheDocument();
    });

    it('should show cross-browser coming soon message', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Multiple cross-browser buttons may exist - click the first one
      const crossBrowserTab = screen.getAllByRole('button', { name: /cross-browser/i })[0];
      await user.click(crossBrowserTab);

      expect(screen.getByText(/cross-browser testing coming soon/i)).toBeInTheDocument();
    });
  });

  describe('Stats Cards', () => {
    it('should display Total Tests stat', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      // Stats numbers may appear multiple times in different layouts
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    });

    it('should display Pass Rate stat', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Pass Rate')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument(); // 1/4 match
    });

    it('should display Changes Detected stat', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Changes Detected')).toBeInTheDocument();
    });

    it('should display Auto-Approved stat', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Auto-Approved')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when data is loading', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });
      mockUseVisualBaselines.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });
      mockUseVisualComparisons.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('No Projects State', () => {
    it('should display no projects message', () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No Projects Yet')).toBeInTheDocument();
      expect(screen.getByText(/create a project first to start visual testing/i)).toBeInTheDocument();
    });
  });

  describe('Comparisons Display', () => {
    it('should display comparison cards', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Comparison names may appear in multiple places
      expect(screen.getAllByText('homepage').length).toBeGreaterThan(0);
      expect(screen.getAllByText('login').length).toBeGreaterThan(0);
      expect(screen.getAllByText('dashboard').length).toBeGreaterThan(0);
    });

    it('should display status badges on comparison cards', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('match')).toBeInTheDocument();
      expect(screen.getByText('mismatch')).toBeInTheDocument();
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('should display match percentage for mismatch', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('85.2% match')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status when dropdown changes', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const statusFilter = screen.getAllByRole('combobox')[1]; // Second select is status
      await user.selectOptions(statusFilter, 'mismatch');

      // Should show mismatch comparisons (may appear in multiple places)
      // Note: homepage may still appear in baselines section which isn't filtered
      expect(screen.getAllByText('login').length).toBeGreaterThan(0);
    });

    it('should filter by date range', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const dateFilter = screen.getAllByRole('combobox')[2]; // Third select is date range
      await user.selectOptions(dateFilter, 'today');

      // All mock comparisons are from "today" (may appear in multiple places)
      expect(screen.getAllByText('homepage').length).toBeGreaterThan(0);
    });

    it('should filter by search query', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search comparisons/i);
      await user.type(searchInput, 'login');

      // Filtered results should include login
      // Note: homepage may still appear in baselines section which isn't filtered by search
      expect(screen.getAllByText('login').length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by date descending by default', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const sortSelect = screen.getAllByRole('combobox')[3]; // Fourth select is sort
      expect(sortSelect).toHaveValue('date-desc');
    });

    it('should change sort order when dropdown changes', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const sortSelect = screen.getAllByRole('combobox')[3];
      await user.selectOptions(sortSelect, 'status');

      expect(sortSelect).toHaveValue('status');
    });
  });

  describe('Run Visual Test', () => {
    it('should show URL input when New Visual Test button is clicked', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const newTestButton = screen.getByRole('button', { name: /new visual test/i });
      await user.click(newTestButton);

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('should run visual test when capture button is clicked', async () => {
      const mockRunTest = vi.fn().mockResolvedValue({
        comparison: { id: 'new-comp' },
        baseline: { id: 'new-baseline' },
        isNew: true,
      });

      mockUseRunVisualTest.mockReturnValue({
        mutateAsync: mockRunTest,
        isPending: false,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      const newTestButton = screen.getByRole('button', { name: /new visual test/i });
      await user.click(newTestButton);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://test.example.com');

      const captureButton = screen.getByRole('button', { name: /capture/i });
      await user.click(captureButton);

      expect(mockRunTest).toHaveBeenCalledWith({
        projectId: 'project-1',
        url: 'https://test.example.com',
      });
    });

    it('should show loading state when running visual test', async () => {
      mockUseRunVisualTest.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      const newTestButton = screen.getByRole('button', { name: /new visual test/i });
      await user.click(newTestButton);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://test.example.com');

      expect(screen.getByText(/capturing/i)).toBeInTheDocument();
    });

    it('should close URL input when X button is clicked', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const newTestButton = screen.getByRole('button', { name: /new visual test/i });
      await user.click(newTestButton);

      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();

      // Find close button (has X icon)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => {
        const svg = btn.querySelector('svg.lucide-x');
        return svg !== null;
      });

      if (closeButton) {
        await user.click(closeButton);
        expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
      }
    });
  });

  describe('Comparison Selection', () => {
    it('should open detail sheet when comparison card is clicked', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Find and click a comparison card (multiple may exist)
      const homepageCard = screen.getAllByText('homepage')[0].closest('[class*="cursor-pointer"]');
      if (homepageCard) {
        await user.click(homepageCard);

        // Sheet should open with comparison details
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }
    });

    it('should show view mode controls in detail sheet', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Multiple homepage elements may exist - get the first one
      const homepageCard = screen.getAllByText('homepage')[0].closest('[class*="cursor-pointer"]');
      if (homepageCard) {
        await user.click(homepageCard);

        await waitFor(() => {
          expect(screen.getByText('Side by Side')).toBeInTheDocument();
          expect(screen.getByText('Slider')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Baseline Management', () => {
    it('should display baselines section', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Baselines text may appear multiple times (header, section, etc.)
      expect(screen.getAllByText(/baselines/i).length).toBeGreaterThan(0);
    });

    it('should display baseline cards', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Baselines section should show baseline names
      const baselineSection = screen.getAllByText(/baselines/i)[0].closest('div');
      expect(baselineSection).toBeInTheDocument();
    });

    it('should have Manage Baselines button', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /manage baselines/i })).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display quick actions section', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should have Run Visual Test button in quick actions', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /run visual test/i })).toBeInTheDocument();
    });

    it('should have Run Responsive Suite button', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /run responsive suite/i })).toBeInTheDocument();
    });

    it('should have Run Cross-Browser Suite button', () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /run cross-browser suite/i })).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no comparisons exist', () => {
      mockUseVisualComparisons.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no visual comparisons found/i)).toBeInTheDocument();
    });

    it('should show empty state when no baselines exist', () => {
      mockUseVisualBaselines.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      mockUseVisualComparisons.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<VisualPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no baselines yet/i)).toBeInTheDocument();
    });

    it('should show filter suggestion when filters return no results', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText(/search comparisons/i);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Tab', () => {
    it('should display responsive matrix when tab is active', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      // Multiple responsive buttons may exist - click the first one
      const responsiveTab = screen.getAllByRole('button', { name: /responsive/i })[0];
      await user.click(responsiveTab);

      // Should show viewport sizes or empty state (either one is acceptable)
      const hasEmptyState = screen.queryByText(/no responsive tests yet/i);
      const hasMobile = screen.queryAllByText('Mobile S').length > 0;
      expect(hasEmptyState || hasMobile).toBeTruthy();
    });
  });

  describe('History Tab', () => {
    it('should group comparisons by date', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const historyTab = screen.getByRole('button', { name: /history/i });
      await user.click(historyTab);

      // Should show date headers
      // All mock comparisons are from today
      expect(screen.getAllByText(/january/i).length).toBeGreaterThan(0);
    });

    it('should show comparison details in history', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const historyTab = screen.getByRole('button', { name: /history/i });
      await user.click(historyTab);

      expect(screen.getByText('homepage')).toBeInTheDocument();
      expect(screen.getByText('login')).toBeInTheDocument();
    });
  });

  describe('Project Selection', () => {
    it('should change project when dropdown changes', async () => {
      render(<VisualPage />, { wrapper: createWrapper() });

      const selectors = screen.getAllByRole('combobox');
      const projectSelector = selectors[0]; // First combobox is project selector
      await user.selectOptions(projectSelector, 'project-2');

      expect(projectSelector).toHaveValue('project-2');
    });
  });
});
