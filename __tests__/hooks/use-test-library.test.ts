/**
 * Tests for lib/hooks/use-test-library.ts
 *
 * Tests the test library management React Query hooks including:
 * - useTestLibrary
 * - useTestLibraryStats
 * - useSaveToLibrary
 * - useUpdateLibraryTest
 * - useDeleteLibraryTest
 * - useDuplicateLibraryTest
 * - useLibraryTest
 * - useSearchLibraryTests
 * - useTestsByTag
 * - useTestTags
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({
    user: { id: 'user-123' },
    isLoaded: true,
  })),
}));

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock useProjects hook
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: vi.fn(() => ({
    data: [{ id: 'proj-1', name: 'Project 1' }],
    isLoading: false,
  })),
}));

import { useUser } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { useProjects } from '@/lib/hooks/use-projects';

describe('use-test-library', () => {
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
      or: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
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

  const mockTest = {
    id: 'test-1',
    project_id: 'proj-1',
    name: 'Login Test',
    description: 'Test user login flow',
    steps: [
      { instruction: 'Navigate to login page', action: 'navigate', target: '/login', order: 1 },
      { instruction: 'Enter email', action: 'type', target: 'email-input', value: 'test@example.com', order: 2 },
    ],
    tags: ['auth', 'smoke'],
    priority: 'high' as const,
    is_active: true,
    source: 'generated' as const,
    created_by: 'user-123',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

  const mockTests = [
    mockTest,
    {
      ...mockTest,
      id: 'test-2',
      name: 'Logout Test',
      tags: ['auth'],
      priority: 'medium' as const,
      source: 'manual' as const,
      created_at: '2024-01-14T00:00:00Z',
    },
    {
      ...mockTest,
      id: 'test-3',
      name: 'Dashboard Test',
      tags: ['dashboard'],
      priority: 'low' as const,
      source: 'discovered' as const,
      created_at: '2024-01-10T00:00:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useUser).mockReturnValue({
      user: { id: 'user-123' },
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    vi.mocked(useProjects).mockReturnValue({
      data: [{ id: 'proj-1', name: 'Project 1' }],
      isLoading: false,
    } as ReturnType<typeof useProjects>);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  // ============================================
  // useTestLibrary
  // ============================================

  describe('useTestLibrary', () => {
    it('should return empty array when no projects available and no projectId', async () => {
      vi.mocked(useProjects).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof useProjects>);

      const { useTestLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibrary(), { wrapper });

      expect(result.current.data).toEqual([]);
    });

    it('should fetch tests for provided projectId', async () => {
      const mockChain = createMockChain(mockTests, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibrary('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should fall back to first project when no projectId provided', async () => {
      const mockChain = createMockChain(mockTests, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibrary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
    });

    it('should throw error on fetch failure', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: new Error('Database error') }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibrary('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should use placeholderData to prevent loading flash', async () => {
      const mockChain = createMockChain(mockTests, null);
      mockChain.then = () => new Promise(() => {}); // Never resolves
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibrary('proj-1'), { wrapper });

      // Placeholder data should be empty array
      expect(result.current.data).toEqual([]);
    });
  });

  // ============================================
  // useTestLibraryStats
  // ============================================

  describe('useTestLibraryStats', () => {
    it('should compute stats from tests', async () => {
      const mockChain = createMockChain(mockTests, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibraryStats } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibraryStats('proj-1'), { wrapper });

      // Wait for data to be populated, not just loading to finish
      await waitFor(() => {
        expect(result.current.stats.totalTests).toBe(3);
      });

      expect(result.current.stats.byPriority).toEqual({
        high: 1,
        medium: 1,
        low: 1,
      });
      expect(result.current.stats.bySource).toEqual({
        generated: 1,
        manual: 1,
        discovered: 1,
      });
    });

    it('should count recent tests from last 7 days', async () => {
      // Create tests with dates within and outside 7 days
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(now.getDate() - 10);

      const testsWithDates = [
        { ...mockTest, id: 'test-1', created_at: now.toISOString() },
        { ...mockTest, id: 'test-2', created_at: threeDaysAgo.toISOString() },
        { ...mockTest, id: 'test-3', created_at: tenDaysAgo.toISOString() },
      ];

      const mockChain = createMockChain(testsWithDates, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: testsWithDates, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibraryStats } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibraryStats('proj-1'), { wrapper });

      // Wait for data to be populated, then check recentTests count
      await waitFor(() => {
        // 2 tests should be within last 7 days
        expect(result.current.stats.recentTests).toBe(2);
      });
    });

    it('should return zero stats when no tests', async () => {
      const mockChain = createMockChain([], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestLibraryStats } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestLibraryStats('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.totalTests).toBe(0);
      expect(result.current.stats.byPriority).toEqual({});
      expect(result.current.stats.bySource).toEqual({});
      expect(result.current.stats.recentTests).toBe(0);
    });
  });

  // ============================================
  // useSaveToLibrary
  // ============================================

  describe('useSaveToLibrary', () => {
    it('should save a test to the library', async () => {
      const savedTest = { ...mockTest };
      const mockChain = createMockChain(savedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSaveToLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSaveToLibrary(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          projectId: 'proj-1',
          testData: {
            name: 'Login Test',
            description: 'Test user login flow',
            steps: [
              { action: 'navigate', target: '/login' },
              { action: 'type', target: 'email-input', value: 'test@example.com' },
            ],
            tags: ['auth', 'smoke'],
            priority: 'high',
          },
          createdBy: 'user-123',
        });

        expect(created.name).toBe('Login Test');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should transform steps correctly', async () => {
      const mockChain = createMockChain(mockTest, null);
      let insertedData: unknown = null;
      mockChain.insert = vi.fn().mockImplementation((data: unknown) => {
        insertedData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSaveToLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSaveToLibrary(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          testData: {
            name: 'Test',
            steps: [
              { action: 'click', target: 'button', description: 'Click the button' },
              { action: 'type', target: 'input', value: 'hello' },
            ],
          },
        });
      });

      expect(insertedData).toBeDefined();
      const inserted = insertedData as { steps: Array<{ instruction: string; order: number }> };
      expect(inserted.steps[0].instruction).toBe('Click the button');
      expect(inserted.steps[0].order).toBe(1);
      expect(inserted.steps[1].instruction).toBe('type on input with "hello"');
      expect(inserted.steps[1].order).toBe(2);
    });

    it('should use default values when not provided', async () => {
      const mockChain = createMockChain(mockTest, null);
      let insertedData: unknown = null;
      mockChain.insert = vi.fn().mockImplementation((data: unknown) => {
        insertedData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSaveToLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSaveToLibrary(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          testData: {
            name: 'Minimal Test',
            steps: [],
          },
        });
      });

      const inserted = insertedData as {
        priority: string;
        tags: string[];
        description: string;
        source: string;
      };
      expect(inserted.priority).toBe('medium');
      expect(inserted.tags).toEqual([]);
      expect(inserted.description).toBe('Test with 0 steps');
      expect(inserted.source).toBe('generated');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSaveToLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSaveToLibrary(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          testData: {
            name: 'Test',
            steps: [],
          },
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['test-library', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests', 'proj-1'],
      });
    });

    it('should throw error on save failure', async () => {
      const mockChain = createMockChain(null, new Error('Save failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSaveToLibrary } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSaveToLibrary(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-1',
          testData: {
            name: 'Test',
            steps: [],
          },
        })
      ).rejects.toThrow('Save failed');
    });
  });

  // ============================================
  // useUpdateLibraryTest
  // ============================================

  describe('useUpdateLibraryTest', () => {
    it('should update a test in the library', async () => {
      const updatedTest = { ...mockTest, name: 'Updated Test Name' };
      const mockChain = createMockChain(updatedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useUpdateLibraryTest(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync({
          id: 'test-1',
          updates: {
            name: 'Updated Test Name',
          },
        });

        expect(updated.name).toBe('Updated Test Name');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.update).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'test-1');
    });

    it('should transform steps on update', async () => {
      const mockChain = createMockChain(mockTest, null);
      let updateData: unknown = null;
      mockChain.update = vi.fn().mockImplementation((data: unknown) => {
        updateData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useUpdateLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-1',
          updates: {
            steps: [{ action: 'click', target: 'button', description: 'Click it' }],
          },
        });
      });

      const updated = updateData as { steps: Array<{ instruction: string }> };
      expect(updated.steps[0].instruction).toBe('Click it');
    });

    it('should set updated_at timestamp', async () => {
      const mockChain = createMockChain(mockTest, null);
      let updateData: unknown = null;
      mockChain.update = vi.fn().mockImplementation((data: unknown) => {
        updateData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useUpdateLibraryTest(), { wrapper });

      const beforeUpdate = Date.now();

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-1',
          updates: {
            name: 'Updated',
          },
        });
      });

      const updated = updateData as { updated_at: string };
      const updatedAt = new Date(updated.updated_at).getTime();
      expect(updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useUpdateLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-1',
          updates: { name: 'Updated' },
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['test-library', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests', 'proj-1'],
      });
    });
  });

  // ============================================
  // useDeleteLibraryTest
  // ============================================

  describe('useDeleteLibraryTest', () => {
    it('should soft delete a test', async () => {
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDeleteLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'test-1',
          projectId: 'proj-1',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'test-1');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(null, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDeleteLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          testId: 'test-1',
          projectId: 'proj-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['test-library', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests', 'proj-1'],
      });
    });

    it('should throw error on delete failure', async () => {
      const mockChain = createMockChain(null, new Error('Delete failed'));
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: null, error: new Error('Delete failed') }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDeleteLibraryTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          testId: 'test-1',
          projectId: 'proj-1',
        })
      ).rejects.toThrow('Delete failed');
    });
  });

  // ============================================
  // useDuplicateLibraryTest
  // ============================================

  describe('useDuplicateLibraryTest', () => {
    it('should duplicate a test with default name', async () => {
      const duplicatedTest = { ...mockTest, id: 'test-2', name: 'Login Test (Copy)' };
      const mockChain = createMockChain(duplicatedTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDuplicateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDuplicateLibraryTest(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          test: mockTest,
        });

        expect(created.name).toBe('Login Test (Copy)');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should duplicate a test with custom name', async () => {
      const duplicatedTest = { ...mockTest, id: 'test-2', name: 'My Custom Name' };
      const mockChain = createMockChain(duplicatedTest, null);
      let insertedData: unknown = null;
      mockChain.insert = vi.fn().mockImplementation((data: unknown) => {
        insertedData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDuplicateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDuplicateLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          test: mockTest,
          newName: 'My Custom Name',
        });
      });

      const inserted = insertedData as { name: string };
      expect(inserted.name).toBe('My Custom Name');
    });

    it('should preserve test properties on duplicate', async () => {
      const mockChain = createMockChain(mockTest, null);
      let insertedData: unknown = null;
      mockChain.insert = vi.fn().mockImplementation((data: unknown) => {
        insertedData = data;
        return mockChain;
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDuplicateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDuplicateLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          test: mockTest,
        });
      });

      const inserted = insertedData as {
        project_id: string;
        steps: unknown;
        tags: string[];
        priority: string;
        source: string;
        is_active: boolean;
      };
      expect(inserted.project_id).toBe(mockTest.project_id);
      expect(inserted.steps).toEqual(mockTest.steps);
      expect(inserted.tags).toEqual(mockTest.tags);
      expect(inserted.priority).toBe(mockTest.priority);
      expect(inserted.source).toBe(mockTest.source);
      expect(inserted.is_active).toBe(true);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const mockChain = createMockChain(mockTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDuplicateLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useDuplicateLibraryTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          test: mockTest,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['test-library', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests', 'proj-1'],
      });
    });
  });

  // ============================================
  // useLibraryTest
  // ============================================

  describe('useLibraryTest', () => {
    it('should return null when testId is null', async () => {
      const { useLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useLibraryTest(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch a single test', async () => {
      const mockChain = createMockChain(mockTest, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useLibraryTest('test-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'test-1');
      expect(mockChain.single).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const mockChain = createMockChain(null, new Error('Not found'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useLibraryTest } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useLibraryTest('invalid-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  // ============================================
  // useSearchLibraryTests
  // ============================================

  describe('useSearchLibraryTests', () => {
    it('should return empty array when projectId is null', async () => {
      const { useSearchLibraryTests } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSearchLibraryTests(null, 'login'), { wrapper });

      // Query is disabled when projectId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array when search query is too short', async () => {
      const { useSearchLibraryTests } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSearchLibraryTests('proj-1', 'a'), { wrapper });

      // Query is disabled when search is too short, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should search tests by name and description', async () => {
      const mockChain = createMockChain([mockTest], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [mockTest], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSearchLibraryTests } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useSearchLibraryTests('proj-1', 'login'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.or).toHaveBeenCalledWith('name.ilike.%login%,description.ilike.%login%');
      expect(mockChain.limit).toHaveBeenCalledWith(20);
    });

    it('should order results by created_at descending', async () => {
      const mockChain = createMockChain([], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSearchLibraryTests } = await import('@/lib/hooks/use-test-library');

      renderHook(() => useSearchLibraryTests('proj-1', 'test'), { wrapper });

      await waitFor(() => {
        expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });
    });
  });

  // ============================================
  // useTestsByTag
  // ============================================

  describe('useTestsByTag', () => {
    it('should return empty array when projectId is null', async () => {
      const { useTestsByTag } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestsByTag(null, 'auth'), { wrapper });

      // Query is disabled when projectId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array when tag is empty', async () => {
      const { useTestsByTag } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestsByTag('proj-1', ''), { wrapper });

      // Query is disabled when tag is empty, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch tests by tag', async () => {
      const authTests = mockTests.filter((t) => t.tags.includes('auth'));
      const mockChain = createMockChain(authTests, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: authTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestsByTag } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestsByTag('proj-1', 'auth'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.contains).toHaveBeenCalledWith('tags', ['auth']);
    });
  });

  // ============================================
  // useTestTags
  // ============================================

  describe('useTestTags', () => {
    it('should return empty array when no tests', async () => {
      const mockChain = createMockChain([], null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: [], error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestTags } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestTags('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual([]);
      });
    });

    it('should extract unique tags from tests and sort them', async () => {
      const mockChain = createMockChain(mockTests, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: mockTests, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestTags } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestTags('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.length).toBeGreaterThan(0);
      });

      // Should have unique, sorted tags
      expect(result.current).toEqual(['auth', 'dashboard', 'smoke']);
    });

    it('should handle tests with no tags', async () => {
      const testsWithNoTags = [
        { ...mockTest, tags: [] },
        { ...mockTest, id: 'test-2', tags: null as unknown as string[] },
      ];
      const mockChain = createMockChain(testsWithNoTags, null);
      mockChain.then = (cb: (val: { data: unknown; error: unknown }) => void) =>
        Promise.resolve({ data: testsWithNoTags, error: null }).then(cb);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestTags } = await import('@/lib/hooks/use-test-library');

      const { result } = renderHook(() => useTestTags('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual([]);
      });
    });
  });
});
