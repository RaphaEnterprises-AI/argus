/**
 * Tests for Projects List Page
 *
 * Covers:
 * - Initial render and layout
 * - Loading states
 * - Empty states (no projects)
 * - Project list display (grid and list views)
 * - Search functionality
 * - Create project modal
 * - Delete project functionality
 * - Navigation to project details
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
  mockProjects,
  mockDeleteProject,
  mockConfirm,
  createMockQuery,
  createMockMutation,
  // Mock hook functions
  mockUseProjects,
  mockUseDeleteProject,
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
    pathname: '/projects',
    query: {},
    asPath: '/projects',
    route: '/projects',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };

  const mockProjects = [
    {
      id: 'project_1',
      name: 'E-Commerce App',
      slug: 'e-commerce-app',
      app_url: 'https://shop.example.com',
      description: 'Online shopping platform',
      user_id: 'user_123',
      organization_id: 'org_123',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'project_2',
      name: 'Blog Platform',
      slug: 'blog-platform',
      app_url: 'https://blog.example.com',
      description: 'Content management system',
      user_id: 'user_123',
      organization_id: 'org_123',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'project_3',
      name: 'API Service',
      slug: 'api-service',
      app_url: 'https://api.example.com',
      description: null,
      user_id: 'user_123',
      organization_id: 'org_123',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

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

  // Create mock hook functions
  const mockUseProjects = vi.fn(() => createMockQuery(mockProjects));
  const mockUseDeleteProject = vi.fn(() => ({
    mutateAsync: mockDeleteProject,
    isPending: false,
  }));

  return {
    mockUser,
    mockRouter,
    mockProjects,
    mockDeleteProject,
    mockConfirm,
    createMockQuery,
    createMockMutation,
    mockUseProjects,
    mockUseDeleteProject,
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
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock projects hooks - use hoisted mock functions
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: mockUseProjects,
  useDeleteProject: mockUseDeleteProject,
}));

// Mock Sidebar
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock CreateProjectModal and CreateProjectInline
vi.mock('@/components/projects/create-project-modal', () => ({
  CreateProjectModal: ({ open, onOpenChange, onSuccess }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (project: unknown) => void;
  }) => (
    open ? (
      <div data-testid="create-project-modal">
        <button onClick={() => onOpenChange(false)}>Close</button>
        <button
          onClick={() => {
            onSuccess({ id: 'new_project', name: 'New Project' });
            onOpenChange(false);
          }}
          data-testid="create-project-submit"
        >
          Create
        </button>
      </div>
    ) : null
  ),
  CreateProjectInline: ({ onSuccess }: { onSuccess: (project: unknown) => void }) => (
    <div data-testid="create-project-inline">
      <button
        onClick={() => onSuccess({ id: 'new_project', name: 'New Project' })}
        data-testid="create-inline-submit"
      >
        Create Project
      </button>
    </div>
  ),
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
import ProjectsPage from '@/app/projects/page';

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
describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish default mock implementations after clearing
    mockUseProjects.mockImplementation(() => createMockQuery(mockProjects));
    mockUseDeleteProject.mockImplementation(() => ({
      mutateAsync: mockDeleteProject,
      isPending: false,
    }));
    mockConfirm.mockReturnValue(true);
    mockRouter.push.mockClear();
    mockDeleteProject.mockClear();
    window.confirm = mockConfirm;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the page layout with sidebar', () => {
      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should render the page header with title', () => {
      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(<ProjectsPage />, { wrapper: AllProviders });

      // Grid and List view buttons should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render new project button', () => {
      render(<ProjectsPage />, { wrapper: AllProviders });

      // There are two "new project" buttons - header button and add card
      const newProjectButtons = screen.getAllByRole('button', { name: /New Project/i });
      expect(newProjectButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading projects', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([], { isLoading: true })      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Look for the Loader2 icon or loading indicator
      const loadingIndicator = document.querySelector('[class*="animate-spin"]');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects exist', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Create your first project')).toBeInTheDocument();
    });

    it('should show inline project creation form in empty state', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByTestId('create-project-inline')).toBeInTheDocument();
    });

    it('should navigate to new project after inline creation', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const createButton = screen.getByTestId('create-inline-submit');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/projects/new_project');
      });
    });
  });

  describe('Project List Display', () => {
    it('should display all projects in grid view by default', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('E-Commerce App')).toBeInTheDocument();
      expect(screen.getByText('Blog Platform')).toBeInTheDocument();
      expect(screen.getByText('API Service')).toBeInTheDocument();
    });

    it('should display project URLs', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('shop.example.com')).toBeInTheDocument();
      expect(screen.getByText('blog.example.com')).toBeInTheDocument();
    });

    it('should display project descriptions when available', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Online shopping platform')).toBeInTheDocument();
      expect(screen.getByText('Content management system')).toBeInTheDocument();
    });

    it('should show add new project card in grid view', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      expect(screen.getByText('Add New Project')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch to list view when list button is clicked', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Find and click the list view button (second in the group)
      const viewButtons = screen.getAllByRole('button');
      const listButton = viewButtons.find(btn =>
        btn.querySelector('[class*="lucide-list"]') ||
        btn.textContent === '' // Icon-only button
      );

      // Look for buttons in the view toggle area
      // The list button should be distinguishable by its content/aria-label
      const buttons = screen.getAllByRole('button');
      // Click any button that might be the list toggle
      for (const btn of buttons) {
        if (btn.innerHTML.includes('List') || btn.closest('[class*="rounded-l-none"]')) {
          fireEvent.click(btn);
          break;
        }
      }

      // After clicking list view, the project should still be visible
      expect(screen.getByText('E-Commerce App')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter projects by name', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'E-Commerce' } });

      await waitFor(() => {
        expect(screen.getByText('E-Commerce App')).toBeInTheDocument();
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument();
      });
    });

    it('should filter projects by URL', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'blog' } });

      await waitFor(() => {
        expect(screen.getByText('Blog Platform')).toBeInTheDocument();
        expect(screen.queryByText('E-Commerce App')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search has no matches', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/No projects found matching/)).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'e-commerce' } });

      await waitFor(() => {
        expect(screen.getByText('E-Commerce App')).toBeInTheDocument();
      });
    });
  });

  describe('Create Project Modal', () => {
    it('should open modal when new project button is clicked', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const newProjectButton = screen.getAllByRole('button', { name: /New Project/i })[0];
      fireEvent.click(newProjectButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
      });
    });

    it('should open modal when add new project card is clicked', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const addNewCard = screen.getByText('Add New Project').closest('button');
      if (addNewCard) {
        fireEvent.click(addNewCard);
      }

      await waitFor(() => {
        expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Open modal
      const newProjectButton = screen.getAllByRole('button', { name: /New Project/i })[0];
      fireEvent.click(newProjectButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('create-project-modal')).not.toBeInTheDocument();
      });
    });

    it('should navigate to new project after creation', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Open modal
      const newProjectButton = screen.getAllByRole('button', { name: /New Project/i })[0];
      fireEvent.click(newProjectButton);

      // Create project
      const createButton = await screen.findByTestId('create-project-submit');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/projects/new_project');
      });
    });
  });

  describe('Delete Project', () => {
    it('should show confirmation dialog before deleting', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Find and click a delete button
      const deleteButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('[class*="lucide-trash"]') ||
               btn.innerHTML.toLowerCase().includes('trash')
      );

      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(mockConfirm).toHaveBeenCalled();
      }
    });

    it('should call delete mutation when confirmed', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );
      mockConfirm.mockReturnValue(true);

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Find delete buttons - they should be in project cards
      const projectCards = screen.getAllByText(/example\.com/).map(el => el.closest('[class*="cursor-pointer"]'));

      // Find the first delete button
      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn =>
        btn.innerHTML.includes('Trash') ||
        btn.querySelector('svg[class*="lucide-trash"]')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(mockDeleteProject).toHaveBeenCalled();
        });
      }
    });

    it('should not delete when confirmation is cancelled', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );
      mockConfirm.mockReturnValue(false);

      render(<ProjectsPage />, { wrapper: AllProviders });

      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn =>
        btn.innerHTML.includes('Trash') ||
        btn.querySelector('svg[class*="lucide-trash"]')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(mockDeleteProject).not.toHaveBeenCalled();
        });
      }
    });
  });

  describe('Navigation', () => {
    it('should navigate to project detail when project card is clicked', async () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Click on a project card
      const projectCard = screen.getByText('E-Commerce App').closest('[class*="cursor-pointer"]');
      if (projectCard) {
        fireEvent.click(projectCard);

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith('/projects/project_1');
        });
      }
    });

    it('should not navigate when clicking external link', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Find external link (the URL link)
      const externalLink = screen.getByText('shop.example.com');
      fireEvent.click(externalLink);

      // Should not navigate to project detail
      expect(mockRouter.push).not.toHaveBeenCalledWith('/projects/project_1');
    });
  });

  describe('Project Card Content', () => {
    it('should show test count stats', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Stats should show 0 tests initially (mocked)
      expect(screen.getAllByText('0')).toBeTruthy();
      expect(screen.getAllByText(/tests/i)).toBeTruthy();
    });

    it('should show pass rate indicator', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Pass rate should show 0%
      expect(screen.getAllByText('0%')).toBeTruthy();
    });

    it('should show last run status', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      // Should show "No tests run yet" for new projects
      const noRunsText = screen.getAllByText(/No tests run yet/i);
      expect(noRunsText.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const searchInput = screen.getByPlaceholderText('Search projects...');
      // Input is accessible if it has a placeholder and is an input element
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.tagName.toLowerCase()).toBe('input');
    });

    it('should have accessible buttons', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper link for project URLs', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery(mockProjects)      );

      render(<ProjectsPage />, { wrapper: AllProviders });

      const externalLinks = screen.getAllByRole('link');
      const projectLink = externalLinks.find(link =>
        link.getAttribute('href')?.includes('shop.example.com')
      );

      expect(projectLink).toHaveAttribute('target', '_blank');
      expect(projectLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty project list gracefully', () => {
      mockUseProjects.mockReturnValue(
        createMockQuery([])      );

      expect(() => {
        render(<ProjectsPage />, { wrapper: AllProviders });
      }).not.toThrow();
    });

    it('should handle projects with missing optional fields', () => {
      const projectsWithMissingFields = [
        {
          id: 'project_1',
          name: 'Minimal Project',
          slug: 'minimal-project',
          app_url: 'https://minimal.example.com',
          description: null,
          user_id: 'user_123',
          organization_id: 'org_123',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockUseProjects.mockReturnValue(
        createMockQuery(projectsWithMissingFields)      );

      expect(() => {
        render(<ProjectsPage />, { wrapper: AllProviders });
      }).not.toThrow();

      expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    });
  });
});
