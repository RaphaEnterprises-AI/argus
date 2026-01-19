/**
 * Tests for lib/hooks/use-parameterized.ts
 *
 * Tests parameterized testing React Query hooks including:
 * - useParameterizedTests
 * - useParameterizedTest
 * - useCreateParameterizedTest
 * - useUpdateParameterizedTest
 * - useDeleteParameterizedTest
 * - useParameterSets
 * - useCreateParameterSet
 * - useUpdateParameterSet
 * - useDeleteParameterSet
 * - useBulkCreateParameterSets
 * - useParameterizedResults
 * - useParameterizedResultsForTest
 * - useParameterizedResult
 * - useIterationResults
 * - useRunParameterizedTest
 * - useParameterizedResultSubscription
 * - useIterationResultSubscription
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

// Mock fetch for worker calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('use-parameterized', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // Helper to create a Supabase query chain mock
  const createMockChain = (finalData: unknown = null, finalError: unknown = null) => {
    const mockResult = {
      data: finalData,
      error: finalError,
    };
    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockResult),
      then: (cb: (val: typeof mockResult) => void) => Promise.resolve(mockResult).then(cb),
    };
    return chain;
  };

  const mockParameterizedTest = {
    id: 'param-test-1',
    project_id: 'proj-1',
    base_test_id: null,
    name: 'Login Test Suite',
    description: 'Test login with various credentials',
    tags: ['auth', 'login'],
    priority: 'high' as const,
    data_source_type: 'inline' as const,
    data_source_config: {},
    parameter_schema: { email: 'string', password: 'string' },
    steps: [{ instruction: 'Navigate to {{url}}' }, { instruction: 'Enter {{email}}' }],
    assertions: [],
    setup: {},
    teardown: {},
    before_each: {},
    after_each: {},
    iteration_mode: 'sequential' as const,
    max_parallel: 1,
    timeout_per_iteration_ms: 30000,
    stop_on_failure: false,
    retry_failed_iterations: 0,
    is_active: true,
    last_run_at: null,
    last_run_status: null,
    created_by: 'user-1',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  const mockParameterSet = {
    id: 'param-set-1',
    parameterized_test_id: 'param-test-1',
    name: 'Valid User',
    description: 'Valid user credentials',
    values: { email: 'test@example.com', password: 'password123' },
    tags: ['happy-path'],
    category: 'positive',
    skip: false,
    skip_reason: null,
    only: false,
    order_index: 0,
    expected_outcome: 'pass' as const,
    expected_error: null,
    environment_overrides: {},
    source: 'manual' as const,
    source_reference: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  const mockParameterizedResult = {
    id: 'result-1',
    parameterized_test_id: 'param-test-1',
    test_run_id: null,
    schedule_run_id: null,
    total_iterations: 5,
    passed: 4,
    failed: 1,
    skipped: 0,
    error: 0,
    duration_ms: 12500,
    avg_iteration_ms: 2500,
    min_iteration_ms: 1800,
    max_iteration_ms: 3200,
    started_at: '2024-01-15T00:00:00Z',
    completed_at: '2024-01-15T00:01:00Z',
    iteration_mode: 'sequential',
    parallel_workers: 1,
    status: 'passed' as const,
    iteration_results: [],
    failure_summary: {},
    environment: 'staging',
    browser: 'chromium',
    app_url: 'https://app.example.com',
    triggered_by: 'user-1',
    trigger_type: 'manual',
    metadata: {},
    created_at: '2024-01-15T00:00:00Z',
  };

  const mockIterationResult = {
    id: 'iter-1',
    parameterized_result_id: 'result-1',
    parameter_set_id: 'param-set-1',
    iteration_index: 0,
    parameter_values: { email: 'test@example.com', password: 'password123' },
    status: 'passed' as const,
    started_at: '2024-01-15T00:00:00Z',
    completed_at: '2024-01-15T00:00:02Z',
    duration_ms: 2000,
    step_results: [],
    error_message: null,
    error_stack: null,
    error_screenshot_url: null,
    assertions_passed: 3,
    assertions_failed: 0,
    assertion_details: [],
    retry_count: 0,
    is_retry: false,
    original_iteration_id: null,
    metadata: {},
    created_at: '2024-01-15T00:00:00Z',
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
    mockFetch.mockReset();
    // Re-setup mock implementations after clearAllMocks
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
    mockSupabase.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  // ============================================
  // PARAMETERIZED TESTS
  // ============================================

  describe('useParameterizedTests', () => {
    it('should return empty array when projectId is null', async () => {
      const { useParameterizedTests } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTests(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch parameterized tests for a project', async () => {
      const mockTests = [mockParameterizedTest];
      const mockChain = createMockChain(mockTests, null);
      // Override the then to return the data directly
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedTests } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw error on fetch failure', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: new Error('Database error') }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedTests } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTests('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should use placeholderData to prevent loading flash', async () => {
      const mockChain = createMockChain([mockParameterizedTest], null);
      mockChain.then = () => new Promise(() => {}); // Never resolves
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedTests } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTests('proj-1'), { wrapper });

      // Placeholder data should be empty array
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useParameterizedTest', () => {
    it('should return null when testId is null', async () => {
      const { useParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTest(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch a single parameterized test', async () => {
      const mockChain = createMockChain(mockParameterizedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTest('param-test-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_tests');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'param-test-1');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const mockChain = createMockChain(null, new Error('Test not found'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedTest('invalid-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useCreateParameterizedTest', () => {
    it('should create a parameterized test', async () => {
      const newTest = { ...mockParameterizedTest };
      const mockChain = createMockChain(newTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useCreateParameterizedTest(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          project_id: 'proj-1',
          name: 'Login Test Suite',
          description: 'Test login with various credentials',
          tags: ['auth', 'login'],
          priority: 'high',
          data_source_type: 'inline',
          data_source_config: {},
          parameter_schema: { email: 'string', password: 'string' },
          steps: [],
          assertions: [],
          setup: {},
          teardown: {},
          before_each: {},
          after_each: {},
          iteration_mode: 'sequential',
          max_parallel: 1,
          timeout_per_iteration_ms: 30000,
          stop_on_failure: false,
          retry_failed_iterations: 0,
          is_active: true,
          created_by: 'user-1',
        });

        expect(created.name).toBe('Login Test Suite');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_tests');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockParameterizedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useCreateParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          project_id: 'proj-1',
          name: 'New Test',
          tags: [],
          priority: 'medium',
          data_source_type: 'inline',
          data_source_config: {},
          parameter_schema: {},
          steps: [],
          assertions: [],
          setup: {},
          teardown: {},
          before_each: {},
          after_each: {},
          iteration_mode: 'sequential',
          max_parallel: 1,
          timeout_per_iteration_ms: 30000,
          stop_on_failure: false,
          retry_failed_iterations: 0,
          is_active: true,
          created_by: null,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-tests', 'proj-1'],
      });
    });

    it('should throw error on creation failure', async () => {
      const mockChain = createMockChain(null, new Error('Creation failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useCreateParameterizedTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          project_id: 'proj-1',
          name: 'New Test',
          tags: [],
          priority: 'medium',
          data_source_type: 'inline',
          data_source_config: {},
          parameter_schema: {},
          steps: [],
          assertions: [],
          setup: {},
          teardown: {},
          before_each: {},
          after_each: {},
          iteration_mode: 'sequential',
          max_parallel: 1,
          timeout_per_iteration_ms: 30000,
          stop_on_failure: false,
          retry_failed_iterations: 0,
          is_active: true,
          created_by: null,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('useUpdateParameterizedTest', () => {
    it('should update a parameterized test', async () => {
      const updatedTest = { ...mockParameterizedTest, name: 'Updated Test Name' };
      const mockChain = createMockChain(updatedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useUpdateParameterizedTest(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync({
          id: 'param-test-1',
          name: 'Updated Test Name',
        });

        expect(updated.name).toBe('Updated Test Name');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_tests');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Test Name' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'param-test-1');
    });

    it('should invalidate relevant queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockParameterizedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useUpdateParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'param-test-1',
          name: 'Updated',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-tests', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-test', 'param-test-1'],
      });
    });
  });

  describe('useDeleteParameterizedTest', () => {
    it('should soft delete a parameterized test', async () => {
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useDeleteParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_tests');
      expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'param-test-1');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useDeleteParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-tests', 'proj-1'],
      });
    });
  });

  // ============================================
  // PARAMETER SETS
  // ============================================

  describe('useParameterSets', () => {
    it('should return empty array when testId is null', async () => {
      const { useParameterSets } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterSets(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch parameter sets for a test', async () => {
      const mockSets = [mockParameterSet];
      const mockChain = createMockChain(mockSets, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockSets, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterSets } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterSets('param-test-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
      expect(mockChain.eq).toHaveBeenCalledWith('parameterized_test_id', 'param-test-1');
      expect(mockChain.order).toHaveBeenCalledWith('order_index', { ascending: true });
    });
  });

  describe('useCreateParameterSet', () => {
    it('should create a parameter set', async () => {
      const mockChain = createMockChain(mockParameterSet, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateParameterSet } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useCreateParameterSet(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          parameterized_test_id: 'param-test-1',
          name: 'Valid User',
          description: 'Valid user credentials',
          values: { email: 'test@example.com', password: 'password123' },
          tags: ['happy-path'],
          category: 'positive',
          skip: false,
          skip_reason: null,
          only: false,
          order_index: 0,
          expected_outcome: 'pass',
          expected_error: null,
          environment_overrides: {},
          source: 'manual',
          source_reference: null,
        });

        expect(created.name).toBe('Valid User');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockParameterSet, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateParameterSet } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useCreateParameterSet(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          parameterized_test_id: 'param-test-1',
          name: 'New Set',
          values: {},
          tags: [],
          skip: false,
          skip_reason: null,
          only: false,
          order_index: 0,
          expected_outcome: 'pass',
          expected_error: null,
          environment_overrides: {},
          source: 'manual',
          source_reference: null,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameter-sets', 'param-test-1'],
      });
    });
  });

  describe('useUpdateParameterSet', () => {
    it('should update a parameter set', async () => {
      const updatedSet = { ...mockParameterSet, name: 'Updated Set', testId: 'param-test-1' };
      const mockChain = createMockChain(updatedSet, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateParameterSet } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useUpdateParameterSet(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync({
          id: 'param-set-1',
          testId: 'param-test-1',
          name: 'Updated Set',
        });

        expect(updated.name).toBe('Updated Set');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
      expect(mockChain.update).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'param-set-1');
    });
  });

  describe('useDeleteParameterSet', () => {
    it('should delete a parameter set', async () => {
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteParameterSet } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useDeleteParameterSet(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'param-set-1',
          testId: 'param-test-1',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'param-set-1');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteParameterSet } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useDeleteParameterSet(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'param-set-1',
          testId: 'param-test-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameter-sets', 'param-test-1'],
      });
    });
  });

  describe('useBulkCreateParameterSets', () => {
    it('should bulk create parameter sets', async () => {
      const bulkSets = [mockParameterSet, { ...mockParameterSet, id: 'param-set-2', name: 'Invalid User' }];
      const mockChain = createMockChain(bulkSets, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: bulkSets, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useBulkCreateParameterSets } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useBulkCreateParameterSets(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          testId: 'param-test-1',
          paramSets: [
            {
              name: 'Valid User',
              values: { email: 'valid@example.com' },
              tags: [],
              skip: false,
              skip_reason: null,
              only: false,
              order_index: 0,
              expected_outcome: 'pass',
              expected_error: null,
              environment_overrides: {},
              source: 'manual',
              source_reference: null,
            },
            {
              name: 'Invalid User',
              values: { email: 'invalid' },
              tags: [],
              skip: false,
              skip_reason: null,
              only: false,
              order_index: 1,
              expected_outcome: 'fail',
              expected_error: null,
              environment_overrides: {},
              source: 'manual',
              source_reference: null,
            },
          ],
        });

        expect(created).toHaveLength(2);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain([mockParameterSet], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [mockParameterSet], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useBulkCreateParameterSets } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useBulkCreateParameterSets(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          paramSets: [
            {
              name: 'Test',
              values: {},
              tags: [],
              skip: false,
              skip_reason: null,
              only: false,
              order_index: 0,
              expected_outcome: 'pass',
              expected_error: null,
              environment_overrides: {},
              source: 'manual',
              source_reference: null,
            },
          ],
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameter-sets', 'param-test-1'],
      });
    });
  });

  // ============================================
  // PARAMETERIZED RESULTS
  // ============================================

  describe('useParameterizedResults', () => {
    it('should return empty array when projectId is null', async () => {
      const { useParameterizedResults } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResults(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch parameterized results for a project', async () => {
      const mockResults = [mockParameterizedResult];
      const mockChain = createMockChain(mockResults, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockResults, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedResults } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResults('proj-1', 10), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_results');
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 50', async () => {
      const mockChain = createMockChain([], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedResults } = await import('@/lib/hooks/use-parameterized');

      renderHook(() => useParameterizedResults('proj-1'), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalledWith(50);
      });
    });
  });

  describe('useParameterizedResultsForTest', () => {
    it('should return empty array when testId is null', async () => {
      const { useParameterizedResultsForTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResultsForTest(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch results for a specific test', async () => {
      const mockResults = [mockParameterizedResult];
      const mockChain = createMockChain(mockResults, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockResults, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedResultsForTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResultsForTest('param-test-1', 5), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_results');
      expect(mockChain.eq).toHaveBeenCalledWith('parameterized_test_id', 'param-test-1');
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('useParameterizedResult', () => {
    it('should return null when resultId is null', async () => {
      const { useParameterizedResult } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResult(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch a single result', async () => {
      const mockChain = createMockChain(mockParameterizedResult, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useParameterizedResult } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useParameterizedResult('result-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('parameterized_results');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'result-1');
      expect(mockChain.single).toHaveBeenCalled();
    });
  });

  // ============================================
  // ITERATION RESULTS
  // ============================================

  describe('useIterationResults', () => {
    it('should return empty array when resultId is null', async () => {
      const { useIterationResults } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useIterationResults(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch iteration results', async () => {
      const mockIterations = [mockIterationResult];
      const mockChain = createMockChain(mockIterations, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockIterations, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useIterationResults } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useIterationResults('result-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('iteration_results');
      expect(mockChain.eq).toHaveBeenCalledWith('parameterized_result_id', 'result-1');
      expect(mockChain.order).toHaveBeenCalledWith('iteration_index', { ascending: true });
    });
  });

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  describe('useParameterizedResultSubscription', () => {
    it('should not subscribe when testId is null', async () => {
      const { useParameterizedResultSubscription } = await import('@/lib/hooks/use-parameterized');

      renderHook(() => useParameterizedResultSubscription(null), { wrapper });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should subscribe to parameterized results changes', async () => {
      const { useParameterizedResultSubscription } = await import('@/lib/hooks/use-parameterized');

      renderHook(() => useParameterizedResultSubscription('param-test-1'), { wrapper });

      expect(mockSupabase.channel).toHaveBeenCalledWith('parameterized-results-param-test-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'parameterized_results',
          filter: 'parameterized_test_id=eq.param-test-1',
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', async () => {
      const { useParameterizedResultSubscription } = await import('@/lib/hooks/use-parameterized');

      const { unmount } = renderHook(() => useParameterizedResultSubscription('param-test-1'), { wrapper });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('useIterationResultSubscription', () => {
    it('should not subscribe when resultId is null', async () => {
      mockSupabase.channel.mockClear();
      const { useIterationResultSubscription } = await import('@/lib/hooks/use-parameterized');

      renderHook(() => useIterationResultSubscription(null), { wrapper });

      // Channel should not be called for null resultId
      expect(mockSupabase.channel).not.toHaveBeenCalledWith(expect.stringContaining('iteration-results-'));
    });

    it('should subscribe to iteration results changes', async () => {
      mockSupabase.channel.mockClear();
      mockChannel.on.mockClear();
      mockChannel.subscribe.mockClear();

      const { useIterationResultSubscription } = await import('@/lib/hooks/use-parameterized');

      renderHook(() => useIterationResultSubscription('result-1'), { wrapper });

      expect(mockSupabase.channel).toHaveBeenCalledWith('iteration-results-result-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'iteration_results',
          filter: 'parameterized_result_id=eq.result-1',
        }),
        expect.any(Function)
      );
    });
  });

  // ============================================
  // RUN PARAMETERIZED TEST
  // ============================================

  describe('useRunParameterizedTest', () => {
    it('should execute a parameterized test run', async () => {
      // Mock supabase chain for multiple calls
      const resultRecord = {
        ...mockParameterizedResult,
        id: 'new-result-1',
        status: 'running',
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        const mockChain = createMockChain(null, null);

        if (table === 'parameterized_results') {
          if (callCount === 1) {
            // First call - insert
            mockChain.single = vi.fn().mockResolvedValue({ data: resultRecord, error: null });
          } else {
            // Update calls
            mockChain.single = vi.fn().mockResolvedValue({ data: { ...resultRecord, status: 'passed' }, error: null });
          }
        } else if (table === 'parameter_sets') {
          mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
            Promise.resolve({ data: [mockParameterSet], error: null }).then(cb);
        } else if (table === 'parameterized_tests') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockParameterizedTest, error: null });
        } else if (table === 'iteration_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockIterationResult, error: null });
        }

        return mockChain;
      });

      // Mock worker response
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          duration: 2000,
          steps: [{ passed: true }],
        }),
      });

      const { useRunParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useRunParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
          environment: 'staging',
          browser: 'chromium',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const resultRecord = { ...mockParameterizedResult, id: 'new-result-2' };

      mockSupabase.from.mockImplementation((table: string) => {
        const mockChain = createMockChain(null, null);

        if (table === 'parameterized_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: resultRecord, error: null });
        } else if (table === 'parameter_sets') {
          mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
            Promise.resolve({ data: [], error: null }).then(cb);
        } else if (table === 'parameterized_tests') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockParameterizedTest, error: null });
        }

        return mockChain;
      });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const { useRunParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useRunParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-results', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-results-for-test', 'param-test-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['parameterized-tests', 'proj-1'],
      });
    });

    it('should handle selected parameter sets', async () => {
      const resultRecord = { ...mockParameterizedResult, id: 'new-result-3' };

      mockSupabase.from.mockImplementation((table: string) => {
        const mockChain = createMockChain(null, null);

        if (table === 'parameterized_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: resultRecord, error: null });
        } else if (table === 'parameter_sets') {
          mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
            Promise.resolve({ data: [mockParameterSet], error: null }).then(cb);
        } else if (table === 'parameterized_tests') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockParameterizedTest, error: null });
        } else if (table === 'iteration_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockIterationResult, error: null });
        }

        return mockChain;
      });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const { useRunParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useRunParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
          selectedSetIds: ['param-set-1'],
        });
      });

      // Verify that the parameter sets query was filtered
      expect(mockSupabase.from).toHaveBeenCalledWith('parameter_sets');
    });

    it('should handle worker errors gracefully', async () => {
      const resultRecord = { ...mockParameterizedResult, id: 'new-result-4' };

      mockSupabase.from.mockImplementation((table: string) => {
        const mockChain = createMockChain(null, null);

        if (table === 'parameterized_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: resultRecord, error: null });
        } else if (table === 'parameter_sets') {
          mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
            Promise.resolve({ data: [mockParameterSet], error: null }).then(cb);
        } else if (table === 'parameterized_tests') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockParameterizedTest, error: null });
        } else if (table === 'iteration_results') {
          mockChain.single = vi.fn().mockResolvedValue({ data: mockIterationResult, error: null });
        }

        return mockChain;
      });

      // Mock worker failure
      mockFetch.mockRejectedValue(new Error('Worker timeout'));

      const { useRunParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useRunParameterizedTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
        });
      });

      // Test should complete (error count tracked internally)
      expect(mockSupabase.from).toHaveBeenCalledWith('iteration_results');
    });

    it('should throw error if initial result creation fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const mockChain = createMockChain(null, null);

        if (table === 'parameterized_results') {
          mockChain.single = vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          });
        }

        return mockChain;
      });

      const { useRunParameterizedTest } = await import('@/lib/hooks/use-parameterized');

      const { result } = renderHook(() => useRunParameterizedTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          testId: 'param-test-1',
          projectId: 'proj-1',
          appUrl: 'https://app.example.com',
        })
      ).rejects.toBeDefined();
    });
  });
});
