/**
 * Tests for lib/hooks/use-insights.ts
 *
 * Tests AI insights-related React Query hooks including:
 * - useAIInsights
 * - useResolveInsight
 * - useInsightStats
 * - useFailureClusters
 * - useCoverageGaps
 * - useFlakyTests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create stable mock for Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

describe('use-insights', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // Helper to create a chainable mock that returns data
  const createMockChain = (
    finalData: unknown = null,
    finalError: unknown = null
  ) => {
    const mockResult = {
      data: finalData,
      error: finalError,
    };
    const chain: Record<string, unknown> = {
      select: vi.fn().mockImplementation(() => chain),
      eq: vi.fn().mockImplementation(() => chain),
      in: vi.fn().mockImplementation(() => chain),
      order: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockResolvedValue(mockResult),
      update: vi.fn().mockImplementation(() => chain),
      then: (cb: (result: typeof mockResult) => unknown) =>
        Promise.resolve(mockResult).then(cb),
    };
    return chain;
  };

  // Mock data
  const mockInsights = [
    {
      id: 'insight-1',
      project_id: 'proj-1',
      type: 'flaky_test',
      severity: 'high',
      title: 'Flaky test detected',
      description: 'Test login flow is failing intermittently',
      is_resolved: false,
      created_at: '2024-01-15T00:00:00Z',
      resolved_at: null,
      resolved_by: null,
    },
    {
      id: 'insight-2',
      project_id: 'proj-1',
      type: 'coverage_gap',
      severity: 'medium',
      title: 'Coverage gap',
      description: 'Checkout flow has no tests',
      is_resolved: false,
      created_at: '2024-01-14T00:00:00Z',
      resolved_at: null,
      resolved_by: null,
    },
  ];

  const mockAllInsights = [
    ...mockInsights,
    {
      id: 'insight-3',
      project_id: 'proj-1',
      type: 'optimization',
      severity: 'low',
      title: 'Test optimization',
      description: 'Consider parallelizing tests',
      is_resolved: true,
      created_at: '2024-01-10T00:00:00Z',
      resolved_at: '2024-01-12T00:00:00Z',
      resolved_by: 'user-1',
    },
    {
      id: 'insight-4',
      project_id: 'proj-1',
      type: 'failure',
      severity: 'critical',
      title: 'Critical failure',
      description: 'Payment flow broken',
      is_resolved: false,
      created_at: '2024-01-16T00:00:00Z',
      resolved_at: null,
      resolved_by: null,
    },
  ];

  const mockTestRuns = [
    { id: 'run-1' },
    { id: 'run-2' },
  ];

  const mockTestResults = [
    {
      test_run_id: 'run-1',
      test_id: 'test-1',
      status: 'failed',
      error_message: 'Timeout waiting for element',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      test_run_id: 'run-1',
      test_id: 'test-2',
      status: 'failed',
      error_message: 'Element not found: #submit-button',
      created_at: '2024-01-15T10:05:00Z',
    },
    {
      test_run_id: 'run-2',
      test_id: 'test-1',
      status: 'failed',
      error_message: 'Network error: connection refused',
      created_at: '2024-01-15T11:00:00Z',
    },
    {
      test_run_id: 'run-2',
      test_id: 'test-3',
      status: 'failed',
      error_message: 'Assertion failed: expected true to be false',
      created_at: '2024-01-15T11:05:00Z',
    },
    {
      test_run_id: 'run-2',
      test_id: 'test-4',
      status: 'failed',
      error_message: 'Unauthorized: login required',
      created_at: '2024-01-15T11:10:00Z',
    },
  ];

  const mockDiscoverySessions = [{ id: 'session-1' }];

  const mockDiscoveredPages = [
    { id: 'page-1', url: 'https://app.com/checkout', title: 'Checkout' },
    { id: 'page-2', url: 'https://app.com/login', title: 'Login' },
    { id: 'page-3', url: 'https://app.com/settings', title: 'Settings' },
  ];

  const mockDiscoveredFlows = [
    { id: 'flow-1', name: 'Checkout Flow', description: 'User completes purchase' },
    { id: 'flow-2', name: 'Login Flow', description: 'User authentication' },
  ];

  const mockTests = [
    { id: 'test-1', name: 'Login Test', target_url: 'https://app.com/login' },
    { id: 'test-2', name: 'Settings Test', target_url: 'https://app.com/settings' },
  ];

  const mockTestsForFlaky = [
    { id: 'test-1', name: 'Flaky Login Test' },
    { id: 'test-2', name: 'Stable Test' },
    { id: 'test-3', name: 'Another Flaky Test' },
  ];

  const mockTestResultsForFlaky = [
    // test-1: flaky (3 passes, 2 failures)
    { test_id: 'test-1', status: 'passed', error_message: null, created_at: '2024-01-15T10:00:00Z' },
    { test_id: 'test-1', status: 'passed', error_message: null, created_at: '2024-01-15T09:00:00Z' },
    { test_id: 'test-1', status: 'passed', error_message: null, created_at: '2024-01-15T08:00:00Z' },
    { test_id: 'test-1', status: 'failed', error_message: 'Timeout waiting for element', created_at: '2024-01-15T07:00:00Z' },
    { test_id: 'test-1', status: 'failed', error_message: 'Timeout waiting for element', created_at: '2024-01-15T06:00:00Z' },
    // test-2: stable (all passes)
    { test_id: 'test-2', status: 'passed', error_message: null, created_at: '2024-01-15T10:00:00Z' },
    { test_id: 'test-2', status: 'passed', error_message: null, created_at: '2024-01-15T09:00:00Z' },
    // test-3: flaky with element errors
    { test_id: 'test-3', status: 'passed', error_message: null, created_at: '2024-01-15T10:00:00Z' },
    { test_id: 'test-3', status: 'failed', error_message: 'Element not found: #button', created_at: '2024-01-14T10:00:00Z' },
    { test_id: 'test-3', status: 'failed', error_message: 'Selector not found', created_at: '2024-01-13T10:00:00Z' },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockSupabase.from.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useAIInsights', () => {
    it('should fetch AI insights for a project', async () => {
      const mockChain = createMockChain(mockInsights, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useAIInsights } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useAIInsights('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_insights');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_resolved', false);
      expect(result.current.data).toHaveLength(2);
    });

    it('should return empty array when projectId is null', async () => {
      const { useAIInsights } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useAIInsights(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (projectId is null), data is undefined
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useAIInsights } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useAIInsights('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should be disabled when projectId is empty string', async () => {
      const { useAIInsights } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useAIInsights(''), { wrapper });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useResolveInsight', () => {
    it('should resolve an insight', async () => {
      const resolvedInsight = {
        ...mockInsights[0],
        is_resolved: true,
        resolved_at: '2024-01-16T00:00:00Z',
        resolved_by: 'user-1',
      };
      const mockChain = createMockChain(resolvedInsight, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useResolveInsight } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useResolveInsight(), { wrapper });

      await act(async () => {
        const response = await result.current.mutateAsync({
          insightId: 'insight-1',
          projectId: 'proj-1',
          resolvedBy: 'user-1',
        });
        expect(response.insight.is_resolved).toBe(true);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_insights');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_resolved: true,
          resolved_by: 'user-1',
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'insight-1');
    });

    it('should resolve insight without resolvedBy', async () => {
      const resolvedInsight = {
        ...mockInsights[0],
        is_resolved: true,
        resolved_at: '2024-01-16T00:00:00Z',
        resolved_by: null,
      };
      const mockChain = createMockChain(resolvedInsight, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useResolveInsight } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useResolveInsight(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          insightId: 'insight-1',
          projectId: 'proj-1',
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved_by: null,
        })
      );
    });

    it('should invalidate ai-insights query on success', async () => {
      const resolvedInsight = {
        ...mockInsights[0],
        is_resolved: true,
      };
      const mockChain = createMockChain(resolvedInsight, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { useResolveInsight } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useResolveInsight(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          insightId: 'insight-1',
          projectId: 'proj-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['ai-insights', 'proj-1'],
      });
    });

    it('should handle resolve error', async () => {
      const mockChain = createMockChain(null, new Error('Update failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useResolveInsight } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useResolveInsight(), { wrapper });

      await expect(
        result.current.mutateAsync({
          insightId: 'insight-1',
          projectId: 'proj-1',
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('useInsightStats', () => {
    it('should calculate insight statistics', async () => {
      const mockChain = createMockChain(mockAllInsights, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useInsightStats } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useInsightStats('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        total: 4,
        resolved: 1,
        unresolved: 3,
        bySeverity: {
          critical: 1,
          high: 1,
          medium: 1,
          low: 0,
        },
      });
    });

    it('should return null when projectId is null', async () => {
      const { useInsightStats } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useInsightStats(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (projectId is null), data is undefined
      expect(result.current.data).toBeUndefined();
    });

    it('should handle empty insights', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useInsightStats } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useInsightStats('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        total: 0,
        resolved: 0,
        unresolved: 0,
        bySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    });

    it('should handle fetch error', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useInsightStats } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useInsightStats('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useFailureClusters', () => {
    it('should categorize failures by error type', async () => {
      // Setup mock to return different data based on table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain(mockTestResults, null);
        }
        return createMockChain([], null);
      });

      const { useFailureClusters } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFailureClusters('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.clusters).toBeDefined();
      expect(result.current.data?.totalFailures).toBe(5);

      // Check that clusters are categorized correctly
      const clusters = result.current.data?.clusters || [];
      const timeoutCluster = clusters.find(c => c.errorType === 'timeout');
      const elementCluster = clusters.find(c => c.errorType === 'element');
      const networkCluster = clusters.find(c => c.errorType === 'network');
      const assertionCluster = clusters.find(c => c.errorType === 'assertion');
      const authCluster = clusters.find(c => c.errorType === 'auth');

      expect(timeoutCluster?.count).toBe(1);
      expect(elementCluster?.count).toBe(1);
      expect(networkCluster?.count).toBe(1);
      expect(assertionCluster?.count).toBe(1);
      expect(authCluster?.count).toBe(1);
    });

    it('should return empty clusters when no test runs', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'test_runs') {
          return createMockChain([], null);
        }
        return createMockChain([], null);
      });

      const { useFailureClusters } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFailureClusters('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ clusters: [], totalFailures: 0 });
    });

    it('should return empty clusters when projectId is null', async () => {
      const { useFailureClusters } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFailureClusters(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (projectId is null), data is undefined
      expect(result.current.data).toBeUndefined();
    });

    it('should return empty clusters when no failed results', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain([], null);
        }
        return createMockChain([], null);
      });

      const { useFailureClusters } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFailureClusters('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ clusters: [], totalFailures: 0 });
    });

    it('should handle test_runs fetch error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'test_runs') {
          return createMockChain(null, new Error('Database error'));
        }
        return createMockChain([], null);
      });

      const { useFailureClusters } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFailureClusters('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useCoverageGaps', () => {
    it('should identify coverage gaps from discovered pages and flows', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') {
          return createMockChain(mockDiscoverySessions, null);
        }
        if (table === 'discovered_pages') {
          return createMockChain(mockDiscoveredPages, null);
        }
        if (table === 'discovered_flows') {
          return createMockChain(mockDiscoveredFlows, null);
        }
        if (table === 'tests') {
          return createMockChain(mockTests, null);
        }
        return createMockChain([], null);
      });

      const { useCoverageGaps } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useCoverageGaps('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Checkout page should be identified as a gap (no test covers it)
      expect(result.current.data?.gaps).toBeDefined();
      const gaps = result.current.data?.gaps || [];

      // Checkout flow should be a critical gap
      const checkoutPageGap = gaps.find(g => g.area.includes('checkout'));
      expect(checkoutPageGap?.priority).toBe('critical');

      // Login is covered by a test, so it shouldn't be in gaps
      const loginGap = gaps.find(g => g.area.toLowerCase().includes('login') && g.type === 'page');
      expect(loginGap).toBeUndefined();
    });

    it('should return empty data when projectId is null', async () => {
      const { useCoverageGaps } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useCoverageGaps(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (projectId is null), data is undefined
      expect(result.current.data).toBeUndefined();
    });

    it('should handle no discovery sessions', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') {
          return createMockChain([], null);
        }
        if (table === 'tests') {
          return createMockChain(mockTests, null);
        }
        return createMockChain([], null);
      });

      const { useCoverageGaps } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useCoverageGaps('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.gaps).toEqual([]);
      expect(result.current.data?.stats.overallCoverage).toBe(100);
    });

    it('should calculate overall coverage correctly', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') {
          return createMockChain(mockDiscoverySessions, null);
        }
        if (table === 'discovered_pages') {
          return createMockChain(mockDiscoveredPages, null);
        }
        if (table === 'discovered_flows') {
          return createMockChain(mockDiscoveredFlows, null);
        }
        if (table === 'tests') {
          return createMockChain(mockTests, null);
        }
        return createMockChain([], null);
      });

      const { useCoverageGaps } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useCoverageGaps('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 5 total items (3 pages + 2 flows)
      // 2 covered (login page and settings page)
      // Coverage should be 2/5 = 40%
      expect(result.current.data?.stats.overallCoverage).toBe(40);
    });

    it('should handle discovery sessions fetch error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') {
          return createMockChain(null, new Error('Database error'));
        }
        return createMockChain([], null);
      });

      const { useCoverageGaps } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useCoverageGaps('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useFlakyTests', () => {
    it('should identify flaky tests from test results', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(mockTestsForFlaky, null);
        }
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain(mockTestResultsForFlaky, null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.flakyTests).toBeDefined();
      const flakyTests = result.current.data?.flakyTests || [];

      // Should identify 2 flaky tests (test-1 and test-3)
      expect(flakyTests.length).toBe(2);

      // test-1 has timeout issues
      const test1 = flakyTests.find(t => t.id === 'test-1');
      expect(test1?.rootCause).toContain('Timeout');
      expect(test1?.flakinessScore).toBe(40); // 2 failures out of 5 runs

      // test-3 has element/selector issues
      const test3 = flakyTests.find(t => t.id === 'test-3');
      expect(test3?.rootCause).toContain('Element');

      // test-2 should NOT be in flaky tests (all passes)
      const test2 = flakyTests.find(t => t.id === 'test-2');
      expect(test2).toBeUndefined();
    });

    it('should return empty data when projectId is null', async () => {
      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (projectId is null), data is undefined
      expect(result.current.data).toBeUndefined();
    });

    it('should return empty data when no tests', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain([], null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        flakyTests: [],
        stats: { count: 0, totalFailures: 0, autoFixed: 0 },
      });
    });

    it('should return empty data when no test runs', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(mockTestsForFlaky, null);
        }
        if (table === 'test_runs') {
          return createMockChain([], null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        flakyTests: [],
        stats: { count: 0, totalFailures: 0, autoFixed: 0 },
      });
    });

    it('should sort flaky tests by flakiness score', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(mockTestsForFlaky, null);
        }
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain(mockTestResultsForFlaky, null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const flakyTests = result.current.data?.flakyTests || [];
      // Should be sorted by flakiness score descending
      for (let i = 1; i < flakyTests.length; i++) {
        expect(flakyTests[i - 1].flakinessScore).toBeGreaterThanOrEqual(
          flakyTests[i].flakinessScore
        );
      }
    });

    it('should calculate correct stats', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(mockTestsForFlaky, null);
        }
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain(mockTestResultsForFlaky, null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.data?.stats;
      expect(stats?.count).toBe(2); // 2 flaky tests
      expect(stats?.totalFailures).toBe(4); // 2 from test-1 + 2 from test-3
      expect(stats?.autoFixed).toBe(0);
    });

    it('should handle tests fetch error', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(null, new Error('Database error'));
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should suggest appropriate fixes based on error messages', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tests') {
          return createMockChain(mockTestsForFlaky, null);
        }
        if (table === 'test_runs') {
          return createMockChain(mockTestRuns, null);
        }
        if (table === 'test_results') {
          return createMockChain(mockTestResultsForFlaky, null);
        }
        return createMockChain([], null);
      });

      const { useFlakyTests } = await import('@/lib/hooks/use-insights');

      const { result } = renderHook(() => useFlakyTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const flakyTests = result.current.data?.flakyTests || [];

      // test-1 has timeout issues - should suggest timeout increase
      const test1 = flakyTests.find(t => t.id === 'test-1');
      expect(test1?.suggestedFix).toContain('timeout');

      // test-3 has element issues - should suggest stable selectors
      const test3 = flakyTests.find(t => t.id === 'test-3');
      expect(test3?.suggestedFix).toContain('selector');
    });
  });
});
