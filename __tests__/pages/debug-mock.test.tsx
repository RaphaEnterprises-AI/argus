/**
 * Debug test to verify mock hoisting works with multiple mocks
 */

import { describe, it, expect, vi } from 'vitest';

// Define mocks in vi.hoisted()
const { mockProjects, mockStats, mockUseProjects, mockUseReportsStats } = vi.hoisted(() => {
  console.log('[HOISTED] Creating mock data');
  const mockProjects = [{ id: '1', name: 'Test Project' }];
  const mockStats = { qualityScore: 85 };

  const mockUseProjects = vi.fn(() => {
    console.log('[MOCK] useProjects called');
    return { data: mockProjects, isLoading: false };
  });

  const mockUseReportsStats = vi.fn(() => {
    console.log('[MOCK] useReportsStats called');
    return { data: mockStats, isLoading: false };
  });

  return { mockProjects, mockStats, mockUseProjects, mockUseReportsStats };
});

// Mock the modules
vi.mock('@/lib/hooks/use-projects', () => {
  console.log('[VI.MOCK FACTORY] Setting up use-projects mock, mockUseProjects:', typeof mockUseProjects);
  return { useProjects: mockUseProjects };
});

vi.mock('@/lib/hooks/use-reports', () => {
  console.log('[VI.MOCK FACTORY] Setting up use-reports mock, mockUseReportsStats:', typeof mockUseReportsStats);
  return {
    useReportsStats: mockUseReportsStats,
    useRecentRuns: vi.fn(() => ({ data: [], isLoading: false })),
  };
});

// Mock tests hooks as well (DashboardPage imports these)
vi.mock('@/lib/hooks/use-tests', () => ({
  useTests: vi.fn(() => ({ data: [], isLoading: false })),
  useTestRuns: vi.fn(() => ({ data: [], isLoading: false })),
  useTestRunSubscription: vi.fn(),
  useRunTest: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: '123', firstName: 'Test' }, isLoaded: true }),
  useAuth: () => ({ isLoaded: true, isSignedIn: true, getToken: vi.fn() }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock components
vi.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => null,
}));
vi.mock('@/components/dashboard', () => ({
  MetricCard: () => null,
  MetricCardSkeleton: () => null,
  TestHealthChart: () => null,
  TestHealthChartSkeleton: () => null,
  ActiveExecutionsWidget: () => null,
  ActiveExecutionsWidgetSkeleton: () => null,
  RecentRunsTable: () => null,
  RecentRunsTableSkeleton: () => null,
  TeamActivityFeed: () => null,
  TeamActivityFeedSkeleton: () => null,
  QuickActions: () => null,
  QuickActionsSkeleton: () => null,
}));
vi.mock('@/components/dashboard/DashboardHero', () => ({
  DashboardHero: () => null,
  DashboardHeroSkeleton: () => null,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.join(' '),
}));

// Import after mocks
import { useProjects } from '@/lib/hooks/use-projects';
import { useReportsStats } from '@/lib/hooks/use-reports';
import DashboardPage from '@/app/dashboard/page';

console.log('[AFTER IMPORT] useProjects:', typeof useProjects);
console.log('[AFTER IMPORT] useReportsStats:', typeof useReportsStats);
console.log('[AFTER IMPORT] DashboardPage:', typeof DashboardPage);

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('Debug Mock Test', () => {
  it('should have working useProjects mock', () => {
    const result = useProjects();
    console.log('[TEST] useProjects result:', result);
    expect(result).toBeDefined();
    expect(result.data).toEqual(mockProjects);
  });

  it('should have working useReportsStats mock', () => {
    const result = useReportsStats();
    console.log('[TEST] useReportsStats result:', result);
    expect(result).toBeDefined();
    expect(result.data).toEqual(mockStats);
  });

  it('should render DashboardPage without errors', () => {
    console.log('[TEST] About to render DashboardPage');
    expect(() => {
      render(<DashboardPage />, { wrapper: AllProviders });
    }).not.toThrow();
    console.log('[TEST] Render completed');
  });
});
