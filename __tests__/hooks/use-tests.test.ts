/**
 * Tests for lib/hooks/use-tests.ts
 *
 * Tests the tests-related React Query hooks including:
 * - useTests
 * - useCreateTest
 * - useUpdateTest
 * - useDeleteTest
 * - useTestRuns
 * - useTestRun
 * - useTestResults
 * - useTestRunSubscription
 * - useRunTest
 * - useRunSingleTest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

// Mock fetch for worker calls
let mockFetch: ReturnType<typeof vi.fn>;

describe('use-tests', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const createMockChain = (finalData: any = null, finalError: any = null) => {
    const mockResult = {
      data: finalData,
      error: finalError,
    };
    const chain: any = {
      select: vi.fn().mockImplementation(() => chain),
      eq: vi.fn().mockImplementation(() => chain),
      in: vi.fn().mockImplementation(() => chain),
      order: vi.fn().mockImplementation(() => chain),
      limit: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockResolvedValue(mockResult),
      insert: vi.fn().mockImplementation(() => chain),
      update: vi.fn().mockImplementation(() => chain),
      delete: vi.fn().mockImplementation(() => chain),
      then: (cb: any) => Promise.resolve(mockResult).then(cb),
    };
    return chain;
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

  describe('useTests', () => {
    it('should return empty array when projectId is null', async () => {
      const { useTests } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTests(null), { wrapper });

      // Hook uses placeholderData: [] for immediate empty state
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch tests for a project', async () => {
      const mockTests = [
        { id: 'test-1', name: 'Test 1', project_id: 'proj-1' },
        { id: 'test-2', name: 'Test 2', project_id: 'proj-1' },
      ];

      const mockChain = createMockChain(mockTests, null);
      mockSupabase.from.mockReturnValue(mockChain);
      // Override the then to resolve immediately with data
      mockChain.order = vi.fn().mockResolvedValue({ data: mockTests, error: null });

      const { useTests } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
    });

    it('should not fetch when projectId is empty string', async () => {
      const { useTests } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTests(''), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });

      // Should use placeholder data, not make actual query
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useCreateTest', () => {
    it('should create a test and invalidate queries', async () => {
      const newTest = {
        id: 'new-test',
        name: 'New Test',
        project_id: 'proj-1',
        steps: [],
      };

      const mockChain = createMockChain(newTest, null);
      mockChain.single.mockResolvedValue({ data: newTest, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateTest } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useCreateTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Test',
          project_id: 'proj-1',
          steps: [],
        } as any);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.insert).toHaveBeenCalled();
    });
  });

  describe('useUpdateTest', () => {
    it('should update a test', async () => {
      const updatedTest = {
        id: 'test-1',
        name: 'Updated Test',
        project_id: 'proj-1',
      };

      const mockChain = createMockChain(updatedTest, null);
      mockChain.single.mockResolvedValue({ data: updatedTest, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateTest } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useUpdateTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-1',
          name: 'Updated Test',
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Test' });
    });
  });

  describe('useDeleteTest', () => {
    it('should soft delete a test by setting is_active to false', async () => {
      const mockChain = createMockChain(null, null);
      mockChain.update.mockReturnThis();
      mockChain.eq.mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteTest } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useDeleteTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'test-1',
          projectId: 'proj-1',
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe('useTestRuns', () => {
    it('should return empty array when projectId is null', async () => {
      const { useTestRuns } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestRuns(null), { wrapper });

      // Hook uses placeholderData: [] for immediate empty state
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch test runs for a project', async () => {
      const mockRuns = [
        { id: 'run-1', project_id: 'proj-1', status: 'passed' },
        { id: 'run-2', project_id: 'proj-1', status: 'failed' },
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockChain.limit.mockResolvedValue({ data: mockRuns, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestRuns } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestRuns('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
    });

    it('should respect the limit parameter', async () => {
      const mockRuns: any[] = [];
      const mockChain = createMockChain(mockRuns, null);
      mockChain.limit.mockResolvedValue({ data: mockRuns, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestRuns } = await import('@/lib/hooks/use-tests');

      renderHook(() => useTestRuns('proj-1', 10), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalledWith(10);
      });
    });
  });

  describe('useTestRun', () => {
    it('should return null when runId is null', async () => {
      const { useTestRun } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestRun(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch a single test run by ID', async () => {
      const mockRun = { id: 'run-1', status: 'passed' };

      const mockChain = createMockChain(mockRun, null);
      mockChain.single.mockResolvedValue({ data: mockRun, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestRun } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestRun('run-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
    });
  });

  describe('useTestResults', () => {
    it('should return undefined when runId is null', async () => {
      const { useTestResults } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestResults(null), { wrapper });

      // Query is disabled when runId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch test results for a run', async () => {
      const mockResults = [
        { id: 'result-1', test_run_id: 'run-1', status: 'passed' },
        { id: 'result-2', test_run_id: 'run-1', status: 'failed' },
      ];

      const mockChain = createMockChain(mockResults, null);
      mockChain.order.mockResolvedValue({ data: mockResults, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestResults } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useTestResults('run-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_results');
    });
  });

  describe('useTestRunSubscription', () => {
    it('should not subscribe when projectId is null', async () => {
      const { useTestRunSubscription } = await import('@/lib/hooks/use-tests');

      renderHook(() => useTestRunSubscription(null), { wrapper });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should subscribe to test runs channel', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { useTestRunSubscription } = await import('@/lib/hooks/use-tests');

      renderHook(() => useTestRunSubscription('proj-1'), { wrapper });

      expect(mockSupabase.channel).toHaveBeenCalledWith('test-runs-proj-1');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should cleanup subscription on unmount', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { useTestRunSubscription } = await import('@/lib/hooks/use-tests');

      const { unmount } = renderHook(() => useTestRunSubscription('proj-1'), {
        wrapper,
      });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('useRunTest', () => {
    it('should create test run and execute tests', async () => {
      const testRun = {
        id: 'run-1',
        project_id: 'proj-1',
        started_at: new Date().toISOString(),
      };

      const mockChain = createMockChain(testRun, null);
      mockChain.single.mockResolvedValue({ data: testRun, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            duration: 1000,
            steps: [],
          }),
      });

      const { useRunTest } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useRunTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
          tests: [
            {
              id: 'test-1',
              name: 'Test 1',
              steps: [{ instruction: 'Click button' }],
            },
          ] as any,
          browser: 'chromium',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
      expect(mockSupabase.from).toHaveBeenCalledWith('test_results');
    });
  });

  describe('useRunSingleTest', () => {
    it('should run a single test', async () => {
      const testRun = {
        id: 'run-1',
        project_id: 'proj-1',
        started_at: new Date().toISOString(),
      };

      const mockChain = createMockChain(testRun, null);
      mockChain.single.mockResolvedValue({ data: testRun, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            duration: 500,
          }),
      });

      const { useRunSingleTest } = await import('@/lib/hooks/use-tests');

      const { result } = renderHook(() => useRunSingleTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
          test: {
            id: 'test-1',
            name: 'Single Test',
            steps: [{ instruction: 'Type hello' }],
          } as any,
        });
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
