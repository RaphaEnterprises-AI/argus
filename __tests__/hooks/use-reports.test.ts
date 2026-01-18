/**
 * Tests for lib/hooks/use-reports.ts
 *
 * Tests reports hooks including:
 * - useReportsStats
 * - useRecentRuns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

describe('use-reports', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const createMockChain = (finalData: unknown = null, finalError: unknown = null) => {
    const mockResult = {
      data: finalData,
      error: finalError,
    };
    const chain: Record<string, unknown> = {
      select: vi.fn().mockImplementation(() => chain),
      eq: vi.fn().mockImplementation(() => chain),
      gte: vi.fn().mockImplementation(() => chain),
      order: vi.fn().mockImplementation(() => chain),
      limit: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockResolvedValue(mockResult),
      then: (cb: (result: typeof mockResult) => void) => Promise.resolve(mockResult).then(cb),
    };
    return chain;
  };

  // Helper to create test run data
  const createTestRun = (overrides: Partial<{
    id: string;
    project_id: string;
    name: string | null;
    trigger: string;
    status: string;
    app_url: string;
    environment: string;
    browser: string;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    skipped_tests: number;
    duration_ms: number | null;
    started_at: string | null;
    completed_at: string | null;
    triggered_by: string | null;
    ci_metadata: Record<string, unknown>;
    created_at: string;
  }> = {}) => ({
    id: 'run-1',
    project_id: 'proj-123',
    name: 'Test Run',
    trigger: 'manual' as const,
    status: 'passed' as const,
    app_url: 'https://example.com',
    environment: 'staging',
    browser: 'chrome',
    total_tests: 10,
    passed_tests: 8,
    failed_tests: 2,
    skipped_tests: 0,
    duration_ms: 5000,
    started_at: '2024-01-15T10:00:00Z',
    completed_at: '2024-01-15T10:05:00Z',
    triggered_by: 'user-123',
    ci_metadata: {},
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  });

  // Create test runs for various days
  const createTestRunsForDays = (days: number) => {
    const runs = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Add 2 runs per day
      runs.push(
        createTestRun({
          id: `run-${i * 2}`,
          created_at: new Date(date.setHours(10, 0, 0, 0)).toISOString(),
          status: 'passed',
          passed_tests: 10,
          failed_tests: 0,
          duration_ms: 3000,
        }),
        createTestRun({
          id: `run-${i * 2 + 1}`,
          created_at: new Date(date.setHours(14, 0, 0, 0)).toISOString(),
          status: 'failed',
          passed_tests: 5,
          failed_tests: 5,
          duration_ms: 7000,
        })
      );
    }

    return runs;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useReportsStats', () => {
    it('should return null when projectId is null', async () => {
      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch and calculate stats for a project', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          status: 'passed',
          passed_tests: 10,
          failed_tests: 0,
          duration_ms: 5000,
          created_at: new Date().toISOString(),
        }),
        createTestRun({
          id: 'run-2',
          status: 'failed',
          passed_tests: 5,
          failed_tests: 5,
          duration_ms: 10000,
          created_at: new Date().toISOString(),
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-123');
      expect(result.current.data?.totalRuns).toBe(2);
    });

    it('should calculate average pass rate correctly', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          passed_tests: 10,
          failed_tests: 0,
        }),
        createTestRun({
          id: 'run-2',
          passed_tests: 5,
          failed_tests: 5,
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.avgPassRate).toBeDefined();
      });

      // Total passed: 15, Total failed: 5, Total: 20
      // Pass rate: 15/20 = 75%
      expect(result.current.data?.avgPassRate).toBe(75);
    });

    it('should calculate average duration correctly', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          duration_ms: 5000,
        }),
        createTestRun({
          id: 'run-2',
          duration_ms: 10000,
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.avgDuration).toBeDefined();
      });

      // Average: (5000 + 10000) / 2 / 1000 = 7.5 seconds
      expect(result.current.data?.avgDuration).toBe(7.5);
    });

    it('should handle zero tests correctly for pass rate', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          passed_tests: 0,
          failed_tests: 0,
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.avgPassRate).toBeDefined();
      });

      // When total tests is 0, pass rate should be 0
      expect(result.current.data?.avgPassRate).toBe(0);
    });

    it('should calculate daily stats correctly', async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const mockRuns = [
        createTestRun({
          id: 'run-1',
          passed_tests: 10,
          failed_tests: 2,
          created_at: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        }),
        createTestRun({
          id: 'run-2',
          passed_tests: 5,
          failed_tests: 3,
          created_at: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123', 7), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.dailyStats).toBeDefined();
      });

      // Should have 7 days of stats
      expect(result.current.data?.dailyStats).toHaveLength(7);

      // Today should have the combined stats
      const todayStats = result.current.data?.dailyStats?.find(
        d => d.date === todayStr
      );
      if (todayStats) {
        expect(todayStats.passed).toBe(15); // 10 + 5
        expect(todayStats.failed).toBe(5); // 2 + 3
      }
    });

    it('should return empty dailyStats when no runs', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.dailyStats).toBeDefined();
      });

      // All days should have 0 passed and 0 failed
      const allZeros = result.current.data?.dailyStats?.every(
        d => d.passed === 0 && d.failed === 0
      );
      expect(allZeros).toBe(true);
    });

    it('should return recent runs (top 10)', async () => {
      const mockRuns = Array.from({ length: 15 }, (_, i) =>
        createTestRun({
          id: `run-${i}`,
          created_at: new Date(Date.now() - i * 3600000).toISOString(),
        })
      );

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.recentRuns).toBeDefined();
      });

      // Should only return top 10
      expect(result.current.data?.recentRuns).toHaveLength(10);
    });

    it('should return failed runs (top 5)', async () => {
      const mockRuns = [
        createTestRun({ id: 'run-1', status: 'passed' }),
        createTestRun({ id: 'run-2', status: 'failed' }),
        createTestRun({ id: 'run-3', status: 'failed' }),
        createTestRun({ id: 'run-4', status: 'passed' }),
        createTestRun({ id: 'run-5', status: 'failed' }),
        createTestRun({ id: 'run-6', status: 'failed' }),
        createTestRun({ id: 'run-7', status: 'failed' }),
        createTestRun({ id: 'run-8', status: 'failed' }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.failedRuns).toBeDefined();
      });

      // Should only return top 5 failed runs
      expect(result.current.data?.failedRuns).toHaveLength(5);
      expect(result.current.data?.failedRuns?.every(r => r.status === 'failed')).toBe(true);
    });

    it('should use custom days parameter', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      renderHook(() => useReportsStats('proj-123', 30), { wrapper });

      await waitFor(() => {
        expect(mockChain.gte).toHaveBeenCalled();
      });

      // Verify gte was called with a date approximately 30 days ago
      const gteCall = (mockChain.gte as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(gteCall[0]).toBe('created_at');

      const dateArg = new Date(gteCall[1]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 30);

      // Allow 1 second tolerance for test timing
      expect(Math.abs(dateArg.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });

    it('should handle database errors', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle null duration_ms values', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          duration_ms: null,
        }),
        createTestRun({
          id: 'run-2',
          duration_ms: 5000,
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.avgDuration).toBeDefined();
      });

      // (0 + 5000) / 2 / 1000 = 2.5 seconds
      expect(result.current.data?.avgDuration).toBe(2.5);
    });

    it('should return 0 avgDuration when no runs', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.avgDuration).toBe(0);
      });
    });

    it('should order runs by created_at descending', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockChain.order).toHaveBeenCalled();
      });

      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('useRecentRuns', () => {
    it('should return empty array when projectId is null', async () => {
      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useRecentRuns(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch recent runs for a project', async () => {
      const mockRuns = [
        createTestRun({ id: 'run-1' }),
        createTestRun({ id: 'run-2' }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-123');
      expect(result.current.data).toHaveLength(2);
    });

    it('should use default limit of 20', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalled();
      });

      expect(mockChain.limit).toHaveBeenCalledWith(20);
    });

    it('should use custom limit', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      renderHook(() => useRecentRuns('proj-123', 50), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalled();
      });

      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });

    it('should order runs by created_at descending', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockChain.order).toHaveBeenCalled();
      });

      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should return typed TestRun array', async () => {
      const mockRuns = [
        createTestRun({
          id: 'run-1',
          name: 'Test Run 1',
          status: 'passed',
          passed_tests: 10,
          failed_tests: 0,
        }),
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      const firstRun = result.current.data?.[0];
      expect(firstRun?.id).toBe('run-1');
      expect(firstRun?.name).toBe('Test Run 1');
      expect(firstRun?.status).toBe('passed');
      expect(firstRun?.passed_tests).toBe(10);
    });

    it('should not be enabled when projectId is null', async () => {
      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      const { result } = renderHook(() => useRecentRuns(null), { wrapper });

      // The query should not be fetching
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('query keys', () => {
    it('should generate unique keys for different projectIds in useReportsStats', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      // First project
      renderHook(() => useReportsStats('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      // Second project - should make a new request
      renderHook(() => useReportsStats('proj-456'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      });
    });

    it('should generate unique keys for different days in useReportsStats', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useReportsStats } = await import('@/lib/hooks/use-reports');

      // 7 days
      renderHook(() => useReportsStats('proj-123', 7), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      // 30 days - should make a new request
      renderHook(() => useReportsStats('proj-123', 30), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      });
    });

    it('should generate unique keys for different projectIds in useRecentRuns', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      // First project
      renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      // Second project - should make a new request
      renderHook(() => useRecentRuns('proj-456'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      });
    });

    it('should generate unique keys for different limits in useRecentRuns', async () => {
      const mockChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRecentRuns } = await import('@/lib/hooks/use-reports');

      // Default limit
      renderHook(() => useRecentRuns('proj-123'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      // Custom limit - should make a new request
      renderHook(() => useRecentRuns('proj-123', 50), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      });
    });
  });
});
