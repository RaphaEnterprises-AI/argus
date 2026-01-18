/**
 * Tests for lib/hooks/use-discovery.ts
 *
 * Tests discovery-related React Query hooks including:
 * - useDiscoverySessions
 * - useDiscoveredPages
 * - useDiscoveredFlows
 * - useLatestDiscoveryData
 * - useStartDiscovery
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

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

describe('use-discovery', () => {
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
      limit: vi.fn().mockResolvedValue(mockResult),
      single: vi.fn().mockResolvedValue(mockResult),
      insert: vi.fn().mockImplementation(() => chain),
      update: vi.fn().mockImplementation(() => chain),
      upsert: vi.fn().mockImplementation(() => chain),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useDiscoverySessions', () => {
    it('should return empty array when projectId is null', async () => {
      const { useDiscoverySessions } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoverySessions(null), { wrapper });

      // Hook uses placeholderData: [] for immediate empty state
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch discovery sessions for a project', async () => {
      const mockSessions = [
        { id: 'sess-1', project_id: 'proj-1', status: 'completed', pages_found: 5 },
        { id: 'sess-2', project_id: 'proj-1', status: 'running', pages_found: 0 },
      ];

      const mockChain = createMockChain(mockSessions, null);
      mockChain.order.mockResolvedValue({ data: mockSessions, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoverySessions } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoverySessions('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
    });
  });

  describe('useDiscoveredPages', () => {
    it('should return empty array when sessionId is null', async () => {
      const { useDiscoveredPages } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoveredPages(null), { wrapper });

      // Hook uses placeholderData: [] for immediate empty state
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch discovered pages for a session', async () => {
      const mockPages = [
        { id: 'page-1', discovery_session_id: 'sess-1', url: 'https://example.com', title: 'Home' },
        { id: 'page-2', discovery_session_id: 'sess-1', url: 'https://example.com/about', title: 'About' },
      ];

      const mockChain = createMockChain(mockPages, null);
      mockChain.order.mockResolvedValue({ data: mockPages, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoveredPages } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoveredPages('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_pages');
      expect(mockChain.eq).toHaveBeenCalledWith('discovery_session_id', 'sess-1');
    });
  });

  describe('useDiscoveredFlows', () => {
    it('should return empty array when sessionId is null', async () => {
      const { useDiscoveredFlows } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoveredFlows(null), { wrapper });

      // Hook uses placeholderData: [] for immediate empty state
      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch discovered flows for a session', async () => {
      const mockFlows = [
        { id: 'flow-1', discovery_session_id: 'sess-1', name: 'Login Flow', step_count: 5 },
        { id: 'flow-2', discovery_session_id: 'sess-1', name: 'Checkout Flow', step_count: 8 },
      ];

      const mockChain = createMockChain(mockFlows, null);
      mockChain.order.mockResolvedValue({ data: mockFlows, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoveredFlows } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useDiscoveredFlows('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_flows');
      expect(mockChain.eq).toHaveBeenCalledWith('discovery_session_id', 'sess-1');
    });
  });

  describe('useLatestDiscoveryData', () => {
    it('should return null when projectId is null', async () => {
      const { useLatestDiscoveryData } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useLatestDiscoveryData(null), { wrapper });

      // Hook uses placeholderData: null for immediate null state
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null when no sessions exist', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useLatestDiscoveryData } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useLatestDiscoveryData('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should fetch latest session with pages and flows', async () => {
      const mockSession = {
        id: 'sess-1',
        project_id: 'proj-1',
        status: 'completed',
        pages_found: 3,
        flows_found: 2,
      };

      const mockPages = [
        { id: 'page-1', url: 'https://example.com' },
      ];

      const mockFlows = [
        { id: 'flow-1', name: 'Login Flow' },
      ];

      const sessionsChain = createMockChain([mockSession], null);
      sessionsChain.limit.mockResolvedValue({ data: [mockSession], error: null });

      const pagesChain = createMockChain(mockPages, null);
      pagesChain.order.mockResolvedValue({ data: mockPages, error: null });

      const flowsChain = createMockChain(mockFlows, null);
      flowsChain.order.mockResolvedValue({ data: mockFlows, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') return sessionsChain;
        if (table === 'discovered_pages') return pagesChain;
        if (table === 'discovered_flows') return flowsChain;
        return sessionsChain;
      });

      const { useLatestDiscoveryData } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useLatestDiscoveryData('proj-1'), { wrapper });

      // Wait for actual data (not just placeholderData which is null immediately)
      await waitFor(() => {
        expect(result.current.data?.session).toBeDefined();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_pages');
      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_flows');
    });
  });

  describe('useStartDiscovery', () => {
    it('should create a discovery session and run discovery', async () => {
      const newSession = {
        id: 'new-sess',
        project_id: 'proj-1',
        app_url: 'https://example.com',
        status: 'running',
      };

      const newPage = {
        id: 'new-page',
        discovery_session_id: 'new-sess',
        url: 'https://example.com',
        title: 'Example Page',
      };

      const observeResult = {
        actions: [
          { selector: 'a.nav-link', description: 'Click navigation link' },
          { selector: 'button.submit', description: 'Click submit button' },
          { selector: 'input#email', description: 'Enter email address' },
        ],
        pageTitle: 'Example Page',
        screenshot: 'base64screenshot',
      };

      // Mock Supabase chains
      const sessionsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const pagesChain = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newPage, error: null }),
          }),
        }),
      };

      const flowsChain = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'flow-1', name: 'Navigation Flow' }, error: null }),
          }),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') return sessionsChain;
        if (table === 'discovered_pages') return pagesChain;
        if (table === 'discovered_flows') return flowsChain;
        return sessionsChain;
      });

      vi.mocked(apiClient.post).mockResolvedValue(observeResult);

      const { useStartDiscovery } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useStartDiscovery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://example.com',
          triggeredBy: 'user-123',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/observe', expect.objectContaining({
        url: 'https://example.com',
        projectId: 'proj-1',
      }));
    });

    it('should update session to failed status on error', async () => {
      const newSession = {
        id: 'new-sess',
        project_id: 'proj-1',
        status: 'running',
      };

      let updateCalled = false;

      const sessionsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
        update: vi.fn().mockImplementation(() => {
          updateCalled = true;
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      };

      mockSupabase.from.mockReturnValue(sessionsChain);
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Discovery failed'));

      const { useStartDiscovery } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useStartDiscovery(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://example.com',
        })
      ).rejects.toThrow('Discovery failed');

      expect(updateCalled).toBe(true);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const newSession = {
        id: 'new-sess',
        project_id: 'proj-1',
        status: 'completed',
      };

      const sessionsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const pagesChain = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'page-1' }, error: null }),
          }),
        }),
      };

      const flowsChain = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovery_sessions') return sessionsChain;
        if (table === 'discovered_pages') return pagesChain;
        if (table === 'discovered_flows') return flowsChain;
        return sessionsChain;
      });

      vi.mocked(apiClient.post).mockResolvedValue({ actions: [], pageTitle: 'Test' });

      const { useStartDiscovery } = await import('@/lib/hooks/use-discovery');

      const { result } = renderHook(() => useStartDiscovery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://example.com',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-sessions', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['latest-discovery', 'proj-1'],
      });
    });
  });
});
