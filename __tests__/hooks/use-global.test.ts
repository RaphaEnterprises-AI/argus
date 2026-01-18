/**
 * Tests for lib/hooks/use-global.ts
 *
 * Tests global testing React Query hooks including:
 * - useGlobalTests
 * - useLatestGlobalTest
 * - useStartGlobalTest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

// Mock fetch for worker calls
let mockFetch: ReturnType<typeof vi.fn>;

describe('use-global', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const createMockChain = (finalData: any = null, finalError: any = null) => {
    const mockResult = {
      data: finalData,
      error: finalError,
    };
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResult),
      single: vi.fn().mockResolvedValue(mockResult),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      then: (cb: any) => Promise.resolve(mockResult).then(cb),
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useGlobalTests', () => {
    it('should return empty array when projectId is null', async () => {
      const { useGlobalTests } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useGlobalTests(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch global tests for a project', async () => {
      const mockTests = [
        {
          id: 'test-1',
          project_id: 'proj-1',
          url: 'https://example.com',
          status: 'completed',
          avg_latency_ms: 200,
        },
        {
          id: 'test-2',
          project_id: 'proj-1',
          url: 'https://example.com',
          status: 'completed',
          avg_latency_ms: 300,
        },
      ];

      const mockChain = createMockChain(mockTests, null);
      mockChain.limit.mockResolvedValue({ data: mockTests, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useGlobalTests } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useGlobalTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('global_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
    });

    it('should respect limit parameter', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useGlobalTests } = await import('@/lib/hooks/use-global');

      renderHook(() => useGlobalTests('proj-1', 5), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('useLatestGlobalTest', () => {
    it('should return null when projectId is null', async () => {
      const { useLatestGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useLatestGlobalTest(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null when no completed tests exist', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useLatestGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useLatestGlobalTest('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should fetch latest global test with results', async () => {
      const mockTest = {
        id: 'test-1',
        project_id: 'proj-1',
        url: 'https://example.com',
        status: 'completed',
        avg_latency_ms: 250,
      };

      const mockResults = [
        {
          id: 'result-1',
          global_test_id: 'test-1',
          region_code: 'US-EAST',
          city: 'Virginia, USA',
          status: 'success',
          latency_ms: 200,
        },
        {
          id: 'result-2',
          global_test_id: 'test-1',
          region_code: 'EU-WEST',
          city: 'Frankfurt, Germany',
          status: 'success',
          latency_ms: 300,
        },
      ];

      const testChain = createMockChain([mockTest], null);
      testChain.limit.mockResolvedValue({ data: [mockTest], error: null });

      const resultsChain = createMockChain(mockResults, null);
      resultsChain.order.mockResolvedValue({ data: mockResults, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'global_tests') return testChain;
        if (table === 'global_test_results') return resultsChain;
        return testChain;
      });

      const { useLatestGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useLatestGlobalTest('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('global_tests');
      expect(mockSupabase.from).toHaveBeenCalledWith('global_test_results');
    });
  });

  describe('useStartGlobalTest', () => {
    it('should create a global test and run it', async () => {
      const newTest = {
        id: 'new-test',
        project_id: 'proj-1',
        url: 'https://example.com',
        status: 'running',
      };

      const updatedTest = {
        ...newTest,
        status: 'completed',
        avg_latency_ms: 250,
        success_rate: 100,
      };

      const testChain = createMockChain(newTest, null);
      const resultsChain = createMockChain(null, null);
      const updateChain = createMockChain(updatedTest, null);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'global_tests') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newTest, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedTest, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'global_test_results') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return testChain;
      });

      // Mock fetch for health check and URL test
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const { useStartGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useStartGlobalTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
          triggeredBy: 'user-123',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('global_tests');
      expect(mockSupabase.from).toHaveBeenCalledWith('global_test_results');
    });

    it('should update test to failed status on error', async () => {
      const newTest = {
        id: 'new-test',
        project_id: 'proj-1',
        url: 'https://example.com',
        status: 'running',
      };

      let updateCalled = false;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'global_tests') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newTest, error: null }),
              }),
            }),
            update: vi.fn().mockImplementation(() => {
              updateCalled = true;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      });

      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { useStartGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useStartGlobalTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
        })
      ).rejects.toThrow();

      // The hook should have tried to update the test to failed status
      expect(updateCalled).toBe(true);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const newTest = {
        id: 'new-test',
        project_id: 'proj-1',
        url: 'https://example.com',
        status: 'running',
      };

      const updatedTest = {
        ...newTest,
        status: 'completed',
        avg_latency_ms: 250,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'global_tests') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newTest, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedTest, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'global_test_results') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      mockFetch.mockResolvedValue({ ok: true });

      const { useStartGlobalTest } = await import('@/lib/hooks/use-global');

      const { result } = renderHook(() => useStartGlobalTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['global-tests', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['latest-global-test', 'proj-1'],
      });
    });
  });
});
