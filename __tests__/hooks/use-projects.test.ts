/**
 * Tests for lib/hooks/use-projects.ts
 *
 * Tests the projects-related React Query hooks including:
 * - useProjects
 * - useProject
 * - useCreateProject
 * - useUpdateProject
 * - useDeleteProject
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

import { useUser } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';

describe('use-projects', () => {
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
      order: vi.fn().mockImplementation(() => chain),
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

    vi.mocked(useUser).mockReturnValue({
      user: { id: 'user-123' },
      isLoaded: true,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useProjects', () => {
    it('should return empty array when user is not loaded', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: false,
      } as any);

      const { useProjects } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProjects(), { wrapper });

      expect(result.current.data).toEqual([]);
    });

    it('should return empty array when user is not logged in', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: true,
      } as any);

      const { useProjects } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should fetch projects via API client', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1', app_url: 'https://app1.com' },
        { id: 'proj-2', name: 'Project 2', app_url: 'https://app2.com' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockProjects);

      const { useProjects } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockProjects);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects');
    });

    it('should have placeholder data to prevent loading flash', async () => {
      vi.mocked(apiClient.get).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { useProjects } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProjects(), { wrapper });

      // Placeholder data should be empty array
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useProject', () => {
    it('should return null when projectId is null', async () => {
      const { useProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProject(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch single project from Supabase', async () => {
      const mockProject = {
        id: 'proj-1',
        name: 'My Project',
        app_url: 'https://myapp.com',
      };

      const mockChain = createMockChain(mockProject, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProject('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'proj-1');
    });

    it('should handle fetch errors', async () => {
      const mockChain = createMockChain(null, new Error('Fetch failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useProject('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useCreateProject', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: true,
      } as any);

      const { useCreateProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: 'New Project',
          app_url: 'https://new.com',
        } as any)
      ).rejects.toThrow('Not authenticated');
    });

    it('should create project via API client', async () => {
      const newProject = {
        id: 'new-proj',
        name: 'New Project',
        app_url: 'https://newproject.com',
      };

      vi.mocked(apiClient.post).mockResolvedValue(newProject);

      const { useCreateProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          name: 'New Project',
          app_url: 'https://newproject.com',
        } as any);

        expect(created).toEqual(newProject);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/projects', {
        name: 'New Project',
        app_url: 'https://newproject.com',
      });
    });

    it('should invalidate projects query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue({
        id: 'new-proj',
        name: 'New Project',
      });

      const { useCreateProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Project',
          app_url: 'https://newproject.com',
        } as any);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['projects'],
      });
    });
  });

  describe('useUpdateProject', () => {
    it('should update project via Supabase', async () => {
      const updatedProject = {
        id: 'proj-1',
        name: 'Updated Project',
        app_url: 'https://updated.com',
      };

      const mockChain = createMockChain(updatedProject, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'proj-1',
          name: 'Updated Project',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Project' });
    });

    it('should invalidate both projects and specific project queries', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain(
        { id: 'proj-1', name: 'Updated' },
        null
      );
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'proj-1',
          name: 'Updated',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['projects'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['project', 'proj-1'],
      });
    });
  });

  describe('useDeleteProject', () => {
    it('should delete project via Supabase', async () => {
      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('proj-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'proj-1');
    });

    it('should invalidate projects query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('proj-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['projects'],
      });
    });

    it('should throw error on delete failure', async () => {
      const mockChain = createMockChain(null, new Error('Delete failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteProject } = await import('@/lib/hooks/use-projects');

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await expect(result.current.mutateAsync('proj-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});
