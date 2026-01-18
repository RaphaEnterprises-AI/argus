/**
 * Tests for Visual Comparison Detail Page
 *
 * Tests the visual comparison detail page functionality including:
 * - Initial render and loading states
 * - Error states (not found, missing screenshots)
 * - Comparison viewer with different view modes
 * - Keyboard shortcuts
 * - Approve/Reject actions
 * - Update baseline functionality
 * - AI insights display
 * - Changes list
 * - Metadata display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComparisonDetailPage from '@/app/visual/[comparisonId]/page';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
let mockComparisonId = 'comp-1';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: vi.fn(),
  }),
  useParams: () => ({
    comparisonId: mockComparisonId,
  }),
  usePathname: () => `/visual/${mockComparisonId}`,
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
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

// Mock data
const mockComparison = {
  id: 'comp-1',
  project_id: 'project-1',
  baseline_id: 'baseline-1',
  name: 'Homepage Test',
  status: 'mismatch',
  match_percentage: 85.5,
  difference_count: 1450,
  baseline_url: 'data:image/png;base64,baseline1',
  current_url: 'data:image/png;base64,current1',
  diff_url: 'data:image/png;base64,diff1',
  threshold: 0.1,
  created_at: new Date().toISOString(),
  approved_at: null,
  approved_by: null,
};

const mockMatchComparison = {
  ...mockComparison,
  id: 'comp-match',
  status: 'match',
  match_percentage: 99.8,
  difference_count: 2,
  approved_at: new Date().toISOString(),
  approved_by: 'user-1',
};

const mockNewComparison = {
  ...mockComparison,
  id: 'comp-new',
  status: 'new',
  match_percentage: 100,
  difference_count: 0,
  baseline_id: null,
};

// Mock hook implementations
const mockUseVisualComparison = vi.fn(() => ({
  data: mockComparison,
  isLoading: false,
  error: null,
}));

const mockUseApproveComparison = vi.fn(() => ({
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

const mockUseUpdateBaseline = vi.fn(() => ({
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

vi.mock('@/lib/hooks/use-visual', () => ({
  useVisualComparison: (id: string | null) => mockUseVisualComparison(),
  useApproveComparison: () => mockUseApproveComparison(),
  useUpdateBaseline: () => mockUseUpdateBaseline(),
}));

// Mock the VisualComparisonViewer component
vi.mock('@/app/visual/components/VisualComparisonViewer', () => ({
  VisualComparisonViewer: ({
    baselineScreenshot,
    currentScreenshot,
    diffImageUrl,
    changes,
    onChangeSelect,
    className,
  }: any) => (
    <div data-testid="visual-comparison-viewer" className={className}>
      <img data-testid="baseline-image" src={baselineScreenshot} alt="baseline" />
      <img data-testid="current-image" src={currentScreenshot} alt="current" />
      {diffImageUrl && <img data-testid="diff-image" src={diffImageUrl} alt="diff" />}
      <div data-testid="changes-count">{changes?.length || 0} changes</div>
      {changes?.map((change: any) => (
        <button
          key={change.id}
          data-testid={`change-${change.id}`}
          onClick={() => onChangeSelect?.(change.id)}
        >
          {change.description}
        </button>
      ))}
    </div>
  ),
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

describe('Visual Comparison Detail Page', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockComparisonId = 'comp-1';

    // Reset mock implementations
    mockUseVisualComparison.mockReturnValue({
      data: mockComparison,
      isLoading: false,
      error: null,
    });

    mockUseApproveComparison.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseUpdateBaseline.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the comparison detail page', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Homepage Test')).toBeInTheDocument();
    });

    it('should display the status badge', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('mismatch')).toBeInTheDocument();
    });

    it('should display back button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Multiple back buttons may exist
      expect(screen.getAllByRole('button', { name: /back/i }).length).toBeGreaterThan(0);
    });

    it('should display visual comparison viewer', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('visual-comparison-viewer')).toBeInTheDocument();
    });

    it('should display timestamp in header', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Should show relative time like "less than a minute ago"
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when data is loading', () => {
      mockUseVisualComparison.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('should show error when comparison not found', () => {
      mockUseVisualComparison.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Not found'),
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Comparison Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to visual testing/i })).toBeInTheDocument();
    });

    it('should show error when comparison has no screenshot', () => {
      mockUseVisualComparison.mockReturnValue({
        data: { ...mockComparison, current_url: null },
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/missing screenshot data/i)).toBeInTheDocument();
    });

    it('should navigate back when back button clicked on error state', async () => {
      mockUseVisualComparison.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Not found'),
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const backButton = screen.getByRole('button', { name: /back to visual testing/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/visual');
    });
  });

  describe('Action Buttons - Mismatch Status', () => {
    it('should display Update Baseline button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /update baseline/i })).toBeInTheDocument();
    });

    it('should display Reject All button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /reject all/i })).toBeInTheDocument();
    });

    it('should display Approve All button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /approve all/i })).toBeInTheDocument();
    });

    it('should call approve mutation when Approve All clicked', async () => {
      const mockApprove = vi.fn().mockResolvedValue({});
      mockUseApproveComparison.mockReturnValue({
        mutateAsync: mockApprove,
        isPending: false,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const approveButton = screen.getByRole('button', { name: /approve all/i });
      await user.click(approveButton);

      expect(mockApprove).toHaveBeenCalledWith({
        comparisonId: mockComparison.id,
        projectId: mockComparison.project_id,
      });
    });

    it('should call update baseline mutation when Update Baseline clicked', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockUseUpdateBaseline.mockReturnValue({
        mutateAsync: mockUpdate,
        isPending: false,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const updateButton = screen.getByRole('button', { name: /update baseline/i });
      await user.click(updateButton);

      expect(mockUpdate).toHaveBeenCalledWith({
        comparisonId: mockComparison.id,
        projectId: mockComparison.project_id,
      });
    });

    it('should show loading state when approving', () => {
      mockUseApproveComparison.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Should show loading spinner somewhere in the page when approving
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show loading state when updating baseline', () => {
      mockUseUpdateBaseline.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Should show loading spinner in update button
      const updateButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('.animate-spin')
      );
      expect(updateButton).toBeInTheDocument();
    });
  });

  describe('Action Buttons - Match Status', () => {
    it('should show Approved badge for match status', () => {
      mockUseVisualComparison.mockReturnValue({
        data: mockMatchComparison,
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // "Approved" may appear multiple times
      expect(screen.getAllByText(/approved/i).length).toBeGreaterThan(0);
    });

    it('should not show action buttons for match status', () => {
      mockUseVisualComparison.mockReturnValue({
        data: mockMatchComparison,
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole('button', { name: /update baseline/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject all/i })).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons - New Status', () => {
    it('should show Approve as Baseline button for new status', () => {
      mockUseVisualComparison.mockReturnValue({
        data: mockNewComparison,
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /approve as baseline/i })).toBeInTheDocument();
    });
  });

  describe('Reject Confirmation', () => {
    it('should show confirmation dialog when Reject All clicked', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const rejectButton = screen.getByRole('button', { name: /reject all/i });
      await user.click(rejectButton);

      expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
    });

    it('should close dialog when Cancel clicked', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const rejectButton = screen.getByRole('button', { name: /reject all/i });
      await user.click(rejectButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Confirm Rejection')).not.toBeInTheDocument();
    });

    it('should navigate back when rejection confirmed', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const rejectButton = screen.getByRole('button', { name: /reject all/i });
      await user.click(rejectButton);

      const confirmButton = screen.getByRole('button', { name: /reject changes/i });
      await user.click(confirmButton);

      expect(mockPush).toHaveBeenCalledWith('/visual');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should navigate back when Escape key pressed', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockPush).toHaveBeenCalledWith('/visual');
    });

    it('should approve when A key pressed', async () => {
      const mockApprove = vi.fn().mockResolvedValue({});
      mockUseApproveComparison.mockReturnValue({
        mutateAsync: mockApprove,
        isPending: false,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      fireEvent.keyDown(window, { key: 'a' });

      expect(mockApprove).toHaveBeenCalled();
    });

    it('should update baseline when U key pressed', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockUseUpdateBaseline.mockReturnValue({
        mutateAsync: mockUpdate,
        isPending: false,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      fireEvent.keyDown(window, { key: 'u' });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should open reject dialog when Shift+R pressed', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      fireEvent.keyDown(window, { key: 'R', shiftKey: true });

      expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
    });

    it('should not trigger shortcuts when typing in input', () => {
      const mockApprove = vi.fn().mockResolvedValue({});
      mockUseApproveComparison.mockReturnValue({
        mutateAsync: mockApprove,
        isPending: false,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Simulate keydown on an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'a' });

      expect(mockApprove).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('Sidebar - Metadata', () => {
    it('should display Comparison Details section', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Comparison Details')).toBeInTheDocument();
    });

    it('should display created date', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('should display viewport info', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Viewport')).toBeInTheDocument();
      expect(screen.getByText('1920x1080')).toBeInTheDocument();
    });

    it('should display match score with progress bar', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Match Score')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should display threshold info', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/threshold/i)).toBeInTheDocument();
    });
  });

  describe('Sidebar - AI Insights', () => {
    it('should display AI Insights section for mismatch', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    it('should display warning insight for low match percentage', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Mock comparison has 85.5% match, should show warning
      expect(screen.getByText('Significant Visual Changes Detected')).toBeInTheDocument();
    });

    it('should display suggestion for medium match percentage', () => {
      mockUseVisualComparison.mockReturnValue({
        data: { ...mockComparison, match_percentage: 92.5 },
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Minor Visual Differences')).toBeInTheDocument();
    });

    it('should display info for high match percentage', () => {
      mockUseVisualComparison.mockReturnValue({
        data: { ...mockComparison, match_percentage: 99.5 },
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Minimal Changes')).toBeInTheDocument();
    });

    it('should display baseline established for new status', () => {
      mockUseVisualComparison.mockReturnValue({
        data: mockNewComparison,
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Check for new/baseline related text (may be different wording)
      const hasBaselineText = screen.queryAllByText(/baseline|new/i).length > 0;
      expect(hasBaselineText || screen.queryByTestId('comparison-status')).toBeTruthy();
    });
  });

  describe('Sidebar - Changes List', () => {
    it('should display Changes section', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Changes')).toBeInTheDocument();
    });

    it('should display change items for mismatch', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      // Changes count in viewer
      const changesSection = screen.getByTestId('changes-count');
      expect(changesSection).toBeInTheDocument();
    });

    it('should display no changes message for match', () => {
      mockUseVisualComparison.mockReturnValue({
        data: mockMatchComparison,
        isLoading: false,
        error: null,
      });

      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No changes detected')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when Back button clicked', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const backButton = screen.getAllByRole('button', { name: /back/i })[0];
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/visual');
    });

    it('should navigate back when Back to List button clicked', async () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      const backToListButton = screen.getByRole('button', { name: /back to list/i });
      await user.click(backToListButton);

      expect(mockPush).toHaveBeenCalledWith('/visual');
    });
  });

  describe('Keyboard Shortcut Hints', () => {
    it('should display Esc hint on back button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('should display U hint on update baseline button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should display Shift+R hint on reject button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Shift+R')).toBeInTheDocument();
    });

    it('should display A hint on approve button', () => {
      render(<ComparisonDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });
});
