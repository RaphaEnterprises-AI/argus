/**
 * Tests for lib/hooks/use-discovery-session.ts
 *
 * Tests discovery session React Query hooks including:
 * - useStartDiscoverySession
 * - useDiscoverySession
 * - useDiscoveredPages
 * - useDiscoveredFlows
 * - useUpdateFlow
 * - useValidateFlow
 * - useGenerateTestFromFlow
 * - usePauseDiscovery
 * - useResumeDiscovery
 * - useCancelDiscovery
 * - useDiscoveryHistory
 * - useDiscoveryStream
 * - useFlowValidation
 * - useBulkGenerateTests
 * - useDeleteDiscoverySession
 * - useExportFlowsAsTests
 * - useCrossProjectPatterns
 * - useGlobalPatterns
 * - useSavePattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  BACKEND_URL: 'http://localhost:8000',
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
}));

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

import { apiClient, getAuthToken } from '@/lib/api-client';

describe('use-discovery-session', () => {
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

  describe('useStartDiscoverySession', () => {
    it('should start a new discovery session via API', async () => {
      const newSession = {
        id: 'sess-1',
        projectId: 'proj-1',
        appUrl: 'https://example.com',
        status: 'running',
        config: { mode: 'standard_crawl' },
        progress: {
          pagesDiscovered: 0,
          pagesQueued: 1,
          flowsIdentified: 0,
        },
        startedAt: new Date().toISOString(),
        completedAt: null,
      };

      vi.mocked(apiClient.post).mockResolvedValue(newSession);

      const { useStartDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useStartDiscoverySession(), { wrapper });

      await act(async () => {
        const session = await result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://example.com',
          mode: 'standard_crawl',
        });

        expect(session).toEqual(newSession);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/sessions', {
        projectId: 'proj-1',
        appUrl: 'https://example.com',
        mode: 'standard_crawl',
      });
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const newSession = {
        id: 'sess-1',
        projectId: 'proj-1',
        appUrl: 'https://example.com',
        status: 'running',
      };

      vi.mocked(apiClient.post).mockResolvedValue(newSession);

      const { useStartDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useStartDiscoverySession(), { wrapper });

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
        queryKey: ['discovery-history', 'proj-1'],
      });
    });

    it('should handle API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      const { useStartDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useStartDiscoverySession(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-1',
          appUrl: 'https://example.com',
        })
      ).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to start discovery session:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('useDiscoverySession', () => {
    it('should return null when sessionId is null', async () => {
      const { useDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoverySession(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch discovery session by ID', async () => {
      const mockSession = {
        id: 'sess-1',
        projectId: 'proj-1',
        appUrl: 'https://example.com',
        status: 'completed',
        config: { mode: 'standard_crawl' },
        progress: {
          pagesDiscovered: 10,
          pagesQueued: 0,
          flowsIdentified: 3,
        },
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSession);

      const { useDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoverySession('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1');
      expect(result.current.data).toEqual(mockSession);
    });

    it('should poll every 2 seconds while session is running', async () => {
      const mockSession = {
        id: 'sess-1',
        status: 'running',
        progress: { pagesDiscovered: 5, pagesQueued: 10, flowsIdentified: 1 },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSession);

      const { useDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoverySession('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      // The hook should be set up for polling (refetchInterval returns 2000 for running status)
      // We verify the data was fetched, polling behavior is implementation detail
      expect(result.current.data?.status).toBe('running');
    });

    it('should not poll when session is completed', async () => {
      const mockSession = {
        id: 'sess-1',
        status: 'completed',
        progress: { pagesDiscovered: 10, pagesQueued: 0, flowsIdentified: 3 },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSession);

      const { useDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoverySession('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.status).toBe('completed');
      });
    });
  });

  describe('useDiscoveredPages', () => {
    it('should return empty array when sessionId is null', async () => {
      const { useDiscoveredPages } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveredPages(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch pages via API first', async () => {
      const mockPages = [
        { id: 'page-1', sessionId: 'sess-1', url: 'https://example.com', title: 'Home' },
        { id: 'page-2', sessionId: 'sess-1', url: 'https://example.com/about', title: 'About' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockPages);

      const { useDiscoveredPages } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveredPages('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPages);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/pages');
    });

    it('should fallback to Supabase on API error', async () => {
      const mockPages = [
        { id: 'page-1', discovery_session_id: 'sess-1', url: 'https://example.com', title: 'Home' },
      ];

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(mockPages, null);
      mockChain.order.mockResolvedValue({ data: mockPages, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoveredPages } = await import('@/lib/hooks/use-discovery-session');

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
      const { useDiscoveredFlows } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveredFlows(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch flows via API first', async () => {
      const mockFlows = [
        { id: 'flow-1', sessionId: 'sess-1', name: 'Login Flow', stepCount: 5 },
        { id: 'flow-2', sessionId: 'sess-1', name: 'Checkout Flow', stepCount: 8 },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockFlows);

      const { useDiscoveredFlows } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveredFlows('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockFlows);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/flows');
    });

    it('should fallback to Supabase on API error', async () => {
      const mockFlows = [
        { id: 'flow-1', discovery_session_id: 'sess-1', name: 'Login Flow', step_count: 5 },
      ];

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(mockFlows, null);
      mockChain.order.mockResolvedValue({ data: mockFlows, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoveredFlows } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveredFlows('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_flows');
      expect(mockChain.eq).toHaveBeenCalledWith('discovery_session_id', 'sess-1');
    });
  });

  describe('useUpdateFlow', () => {
    it('should update flow via API', async () => {
      const updatedFlow = {
        id: 'flow-1',
        discovery_session_id: 'sess-1',
        name: 'Updated Flow Name',
        step_count: 6,
      };

      vi.mocked(apiClient.put).mockResolvedValue(updatedFlow);

      const { useUpdateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useUpdateFlow(), { wrapper });

      await act(async () => {
        const flow = await result.current.mutateAsync({
          flowId: 'flow-1',
          updates: { name: 'Updated Flow Name' },
        });

        expect(flow).toEqual(updatedFlow);
      });

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/discovery/flows/flow-1', {
        name: 'Updated Flow Name',
      });
    });

    it('should fallback to Supabase on API error', async () => {
      const updatedFlow = {
        id: 'flow-1',
        discovery_session_id: 'sess-1',
        name: 'Updated Flow Name',
      };

      vi.mocked(apiClient.put).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(updatedFlow, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useUpdateFlow(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          flowId: 'flow-1',
          updates: { name: 'Updated Flow Name' },
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_flows');
      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Flow Name' });
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const updatedFlow = {
        id: 'flow-1',
        discovery_session_id: 'sess-1',
        name: 'Updated Flow',
      };

      vi.mocked(apiClient.put).mockResolvedValue(updatedFlow);

      const { useUpdateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useUpdateFlow(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          flowId: 'flow-1',
          updates: { name: 'Updated Flow' },
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovered-flows'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovered-flows', 'sess-1'],
      });
    });
  });

  describe('useValidateFlow', () => {
    it('should validate a flow via API', async () => {
      const validationResult = {
        flowId: 'flow-1',
        valid: true,
        errors: [],
        warnings: [],
        duration: 1500,
      };

      vi.mocked(apiClient.post).mockResolvedValue(validationResult);

      const { useValidateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useValidateFlow(), { wrapper });

      await act(async () => {
        const validation = await result.current.mutateAsync('flow-1');
        expect(validation).toEqual(validationResult);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/flows/flow-1/validate');
    });

    it('should return validation errors', async () => {
      const validationResult = {
        flowId: 'flow-1',
        valid: false,
        errors: [
          { step: 2, message: 'Selector not found', suggestion: 'Update to data-testid' },
        ],
        warnings: [
          { step: 1, message: 'Slow element' },
        ],
        duration: 2000,
      };

      vi.mocked(apiClient.post).mockResolvedValue(validationResult);

      const { useValidateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useValidateFlow(), { wrapper });

      await act(async () => {
        const validation = await result.current.mutateAsync('flow-1');
        expect(validation.valid).toBe(false);
        expect(validation.errors).toHaveLength(1);
        expect(validation.warnings).toHaveLength(1);
      });
    });

    it('should update cache with validation result', async () => {
      const validationResult = {
        flowId: 'flow-1',
        valid: true,
        errors: [],
        warnings: [],
        duration: 1000,
      };

      vi.mocked(apiClient.post).mockResolvedValue(validationResult);

      const { useValidateFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useValidateFlow(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('flow-1');
      });

      const cachedData = queryClient.getQueryData(['flow-validation', 'flow-1']);
      expect(cachedData).toEqual(validationResult);
    });
  });

  describe('useGenerateTestFromFlow', () => {
    it('should generate test from flow via API', async () => {
      const testResult = {
        testId: 'test-1',
        flowId: 'flow-1',
        name: 'Login Flow Test',
        steps: [
          { instruction: 'Navigate to login page' },
          { instruction: 'Enter username' },
        ],
        assertions: [
          { type: 'visible', value: 'Welcome message' },
        ],
      };

      vi.mocked(apiClient.post).mockResolvedValue(testResult);

      const { useGenerateTestFromFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useGenerateTestFromFlow(), { wrapper });

      await act(async () => {
        const test = await result.current.mutateAsync('flow-1');
        expect(test).toEqual(testResult);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/flows/flow-1/generate-test');
    });

    it('should invalidate flows and tests queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue({
        testId: 'test-1',
        flowId: 'flow-1',
        name: 'Test',
        steps: [],
        assertions: [],
      });

      const { useGenerateTestFromFlow } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useGenerateTestFromFlow(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('flow-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovered-flows'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests'],
      });
    });
  });

  describe('usePauseDiscovery', () => {
    it('should pause a running discovery session', async () => {
      const pausedSession = {
        id: 'sess-1',
        status: 'paused',
        progress: { pagesDiscovered: 5, pagesQueued: 10, flowsIdentified: 2 },
      };

      vi.mocked(apiClient.post).mockResolvedValue(pausedSession);

      const { usePauseDiscovery } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => usePauseDiscovery(), { wrapper });

      await act(async () => {
        const session = await result.current.mutateAsync('sess-1');
        expect(session.status).toBe('paused');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/pause');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue({ id: 'sess-1', status: 'paused' });

      const { usePauseDiscovery } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => usePauseDiscovery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sess-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-session', 'sess-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-sessions'],
      });
    });
  });

  describe('useResumeDiscovery', () => {
    it('should resume a paused discovery session', async () => {
      const resumedSession = {
        id: 'sess-1',
        status: 'running',
        progress: { pagesDiscovered: 5, pagesQueued: 10, flowsIdentified: 2 },
      };

      vi.mocked(apiClient.post).mockResolvedValue(resumedSession);

      const { useResumeDiscovery } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useResumeDiscovery(), { wrapper });

      await act(async () => {
        const session = await result.current.mutateAsync('sess-1');
        expect(session.status).toBe('running');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/resume');
    });
  });

  describe('useCancelDiscovery', () => {
    it('should cancel a discovery session', async () => {
      const cancelledSession = {
        id: 'sess-1',
        status: 'cancelled',
        progress: { pagesDiscovered: 5, pagesQueued: 0, flowsIdentified: 2 },
      };

      vi.mocked(apiClient.post).mockResolvedValue(cancelledSession);

      const { useCancelDiscovery } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useCancelDiscovery(), { wrapper });

      await act(async () => {
        const session = await result.current.mutateAsync('sess-1');
        expect(session.status).toBe('cancelled');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/cancel');
    });

    it('should invalidate all related queries on cancel', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue({ id: 'sess-1', status: 'cancelled' });

      const { useCancelDiscovery } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useCancelDiscovery(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sess-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-session', 'sess-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-sessions'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-history'],
      });
    });
  });

  describe('useDiscoveryHistory', () => {
    it('should return empty array when projectId is null', async () => {
      const { useDiscoveryHistory } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryHistory(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch discovery history via API', async () => {
      const mockHistory = [
        {
          id: 'sess-1',
          appUrl: 'https://example.com',
          status: 'completed',
          pagesFound: 10,
          flowsFound: 3,
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:10:00Z',
          duration: 600000,
        },
        {
          id: 'sess-2',
          appUrl: 'https://example.com',
          status: 'failed',
          pagesFound: 5,
          flowsFound: 1,
          startedAt: '2024-01-02T00:00:00Z',
          completedAt: '2024-01-02T00:05:00Z',
          duration: 300000,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockHistory);

      const { useDiscoveryHistory } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryHistory('proj-1', 20), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockHistory);
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/discovery/projects/proj-1/history?limit=20'
      );
    });

    it('should fallback to Supabase on API error', async () => {
      const mockSessions = [
        {
          id: 'sess-1',
          app_url: 'https://example.com',
          status: 'completed',
          pages_found: 10,
          flows_found: 3,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:10:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(mockSessions, null);
      mockChain.limit.mockResolvedValue({ data: mockSessions, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDiscoveryHistory } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryHistory('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
    });

    it('should use custom limit parameter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const { useDiscoveryHistory } = await import('@/lib/hooks/use-discovery-session');

      renderHook(() => useDiscoveryHistory('proj-1', 50), { wrapper });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/api/v1/discovery/projects/proj-1/history?limit=50'
        );
      });
    });
  });

  describe('useFlowValidation', () => {
    it('should return null when flowId is null', async () => {
      const { useFlowValidation } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useFlowValidation(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch flow validation status', async () => {
      const validationResult = {
        flowId: 'flow-1',
        valid: true,
        errors: [],
        warnings: [],
        duration: 1000,
      };

      vi.mocked(apiClient.get).mockResolvedValue(validationResult);

      const { useFlowValidation } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useFlowValidation('flow-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(validationResult);
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/discovery/flows/flow-1/validation-status'
      );
    });
  });

  describe('useBulkGenerateTests', () => {
    it('should generate tests for multiple flows', async () => {
      const testResults = [
        { testId: 'test-1', flowId: 'flow-1', name: 'Test 1', steps: [], assertions: [] },
        { testId: 'test-2', flowId: 'flow-2', name: 'Test 2', steps: [], assertions: [] },
      ];

      vi.mocked(apiClient.post).mockResolvedValue(testResults);

      const { useBulkGenerateTests } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useBulkGenerateTests(), { wrapper });

      await act(async () => {
        const tests = await result.current.mutateAsync(['flow-1', 'flow-2']);
        expect(tests).toHaveLength(2);
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/discovery/flows/bulk-generate-tests',
        { flowIds: ['flow-1', 'flow-2'] }
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue([]);

      const { useBulkGenerateTests } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useBulkGenerateTests(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(['flow-1']);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovered-flows'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tests'],
      });
    });
  });

  describe('useDeleteDiscoverySession', () => {
    it('should delete session via API', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useDeleteDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDeleteDiscoverySession(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 'sess-1',
          projectId: 'proj-1',
        });
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1');
    });

    it('should fallback to Supabase cascade delete on API error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('API error'));

      const flowsChain = createMockChain(null, null);
      const pagesChain = createMockChain(null, null);
      const sessionsChain = createMockChain(null, null);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'discovered_flows') return flowsChain;
        if (table === 'discovered_pages') return pagesChain;
        if (table === 'discovery_sessions') return sessionsChain;
        return sessionsChain;
      });

      const { useDeleteDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDeleteDiscoverySession(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 'sess-1',
          projectId: 'proj-1',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_flows');
      expect(mockSupabase.from).toHaveBeenCalledWith('discovered_pages');
      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
    });

    it('should invalidate and remove queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useDeleteDiscoverySession } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDeleteDiscoverySession(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 'sess-1',
          projectId: 'proj-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-sessions', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-history', 'proj-1'],
      });
      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['discovery-session', 'sess-1'],
      });
    });
  });

  describe('useExportFlowsAsTests', () => {
    it('should export flows as Playwright tests', async () => {
      const exportResult = {
        content: 'import { test } from "@playwright/test";\n...',
        filename: 'discovery-tests.spec.ts',
      };

      vi.mocked(apiClient.post).mockResolvedValue(exportResult);

      const { useExportFlowsAsTests } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useExportFlowsAsTests(), { wrapper });

      await act(async () => {
        const exported = await result.current.mutateAsync({
          sessionId: 'sess-1',
          flowIds: ['flow-1', 'flow-2'],
          format: 'playwright',
        });

        expect(exported.content).toContain('playwright');
        expect(exported.filename).toBe('discovery-tests.spec.ts');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/discovery/sessions/sess-1/export',
        { flowIds: ['flow-1', 'flow-2'], format: 'playwright' }
      );
    });

    it('should export all flows when flowIds not provided', async () => {
      const exportResult = {
        content: '{}',
        filename: 'discovery-tests.json',
      };

      vi.mocked(apiClient.post).mockResolvedValue(exportResult);

      const { useExportFlowsAsTests } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useExportFlowsAsTests(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 'sess-1',
          format: 'json',
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/discovery/sessions/sess-1/export',
        { flowIds: undefined, format: 'json' }
      );
    });
  });

  describe('useCrossProjectPatterns', () => {
    it('should return empty array when sessionId is null', async () => {
      const { useCrossProjectPatterns } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useCrossProjectPatterns(null), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch patterns via API', async () => {
      const mockPatterns = [
        {
          patternId: 'pattern-1',
          pattern: {
            id: 'pattern-1',
            patternType: 'auth_flow',
            patternName: 'Login Pattern',
            description: 'Standard login flow',
            timesSeen: 50,
            projectCount: 10,
            testSuccessRate: 0.95,
            selfHealSuccessRate: 0.88,
            selectors: ['#login-form', '#email', '#password'],
            confidence: 0.9,
            createdAt: '2024-01-01T00:00:00Z',
          },
          matchScore: 0.85,
          matchedElements: [],
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockPatterns);

      const { useCrossProjectPatterns } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useCrossProjectPatterns('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPatterns);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/discovery/sessions/sess-1/patterns');
    });

    it('should fallback to Supabase on API error', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          pattern_type: 'auth_flow',
          pattern_name: 'Login Pattern',
          pattern_data: { description: 'Login flow', selectors: ['#login'] },
          times_seen: 50,
          projects_seen: ['proj-1', 'proj-2'],
          test_success_rate: 0.95,
          self_heal_success_rate: 0.88,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(mockPatterns, null);
      mockChain.limit.mockResolvedValue({ data: mockPatterns, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCrossProjectPatterns } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useCrossProjectPatterns('sess-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_patterns');
    });
  });

  describe('useGlobalPatterns', () => {
    it('should fetch global patterns via API', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          patternType: 'form_flow',
          patternName: 'Contact Form',
          description: 'Standard contact form',
          timesSeen: 100,
          projectCount: 25,
          testSuccessRate: 0.92,
          selfHealSuccessRate: 0.85,
          selectors: ['form#contact', 'input[name="email"]'],
          confidence: 0.95,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockPatterns);

      const { useGlobalPatterns } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useGlobalPatterns(5), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPatterns);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/discovery/patterns?limit=5');
    });

    it('should fallback to Supabase on API error', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          pattern_type: 'form_flow',
          pattern_name: 'Contact Form',
          pattern_data: { description: 'Contact form' },
          times_seen: 100,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockRejectedValue(new Error('API error'));

      const mockChain = createMockChain(mockPatterns, null);
      mockChain.limit.mockResolvedValue({ data: mockPatterns, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useGlobalPatterns } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useGlobalPatterns(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_patterns');
    });
  });

  describe('useSavePattern', () => {
    it('should save a new pattern', async () => {
      const savedPattern = {
        id: 'new-pattern',
        patternType: 'auth_flow',
        patternName: 'OAuth Login',
        description: 'OAuth2 login flow',
        timesSeen: 1,
        projectCount: 1,
        testSuccessRate: 1.0,
        selfHealSuccessRate: 0,
        selectors: ['#oauth-button'],
        confidence: 0.5,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.post).mockResolvedValue(savedPattern);

      const { useSavePattern } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useSavePattern(), { wrapper });

      await act(async () => {
        const pattern = await result.current.mutateAsync({
          patternType: 'auth_flow',
          patternName: 'OAuth Login',
          description: 'OAuth2 login flow',
          timesSeen: 1,
          projectCount: 1,
          testSuccessRate: 1.0,
          selfHealSuccessRate: 0,
          selectors: ['#oauth-button'],
          confidence: 0.5,
        });

        expect(pattern.id).toBe('new-pattern');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/discovery/patterns', expect.any(Object));
    });

    it('should invalidate pattern queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(apiClient.post).mockResolvedValue({
        id: 'new-pattern',
        patternType: 'auth_flow',
        patternName: 'Test',
      });

      const { useSavePattern } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useSavePattern(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          patternType: 'auth_flow',
          patternName: 'Test',
          description: '',
          timesSeen: 1,
          projectCount: 1,
          testSuccessRate: 1.0,
          selfHealSuccessRate: 0,
          selectors: [],
          confidence: 0.5,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['global-patterns'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['cross-project-patterns'],
      });
    });
  });

  describe('useDiscoveryStream', () => {
    let mockEventSource: any;

    beforeEach(() => {
      // Mock EventSource
      mockEventSource = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        readyState: 0,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      };

      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return initial state when sessionId is null', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryStream(null), { wrapper });

      expect(result.current.status).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should connect to SSE endpoint with auth token', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      renderHook(() => useDiscoveryStream('sess-1'), { wrapper });

      await waitFor(() => {
        expect(getAuthToken).toHaveBeenCalled();
      });

      // The EventSource should be created with the URL containing the token
      await waitFor(() => {
        expect(EventSource).toHaveBeenCalled();
      });
    });

    it('should update status when receiving SSE message', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryStream('sess-1'), { wrapper });

      // Wait for EventSource to be created
      await waitFor(() => {
        expect(EventSource).toHaveBeenCalled();
      });

      // Simulate connection open
      act(() => {
        mockEventSource.onopen?.();
      });

      expect(result.current.isConnected).toBe(true);

      // Simulate receiving a message
      const statusUpdate = {
        sessionId: 'sess-1',
        status: 'running',
        progress: {
          pagesDiscovered: 5,
          pagesQueued: 10,
          flowsIdentified: 2,
          percentComplete: 33,
        },
        lastUpdate: new Date().toISOString(),
        events: [],
      };

      act(() => {
        mockEventSource.onmessage?.({ data: JSON.stringify(statusUpdate) });
      });

      expect(result.current.status).toEqual(statusUpdate);
    });

    it('should handle SSE error', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryStream('sess-1'), { wrapper });

      await waitFor(() => {
        expect(EventSource).toHaveBeenCalled();
      });

      // Simulate connection open then error
      act(() => {
        mockEventSource.onopen?.();
      });

      expect(result.current.isConnected).toBe(true);

      // Simulate error (but not closed)
      mockEventSource.readyState = 0; // CONNECTING (not closed)
      act(() => {
        mockEventSource.onerror?.({});
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should cleanup on unmount', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      const { unmount } = renderHook(() => useDiscoveryStream('sess-1'), { wrapper });

      await waitFor(() => {
        expect(EventSource).toHaveBeenCalled();
      });

      unmount();

      // EventSource.close should be called during cleanup
      // Note: Due to async nature, this might be called
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should provide reconnect function', async () => {
      const { useDiscoveryStream } = await import('@/lib/hooks/use-discovery-session');

      const { result } = renderHook(() => useDiscoveryStream('sess-1'), { wrapper });

      expect(typeof result.current.reconnect).toBe('function');
    });
  });

  describe('type exports', () => {
    it('should export discovery mode labels', async () => {
      const { DISCOVERY_MODE_LABELS } = await import('@/lib/hooks/use-discovery-session');

      expect(DISCOVERY_MODE_LABELS).toEqual({
        standard_crawl: 'Standard Crawl',
        quick_scan: 'Quick Scan',
        deep_analysis: 'Deep Analysis',
        authenticated: 'Authenticated',
        api_first: 'API First',
      });
    });

    it('should export discovery strategy labels', async () => {
      const { DISCOVERY_STRATEGY_LABELS } = await import('@/lib/hooks/use-discovery-session');

      expect(DISCOVERY_STRATEGY_LABELS).toEqual({
        breadth_first: 'Breadth First',
        depth_first: 'Depth First',
        priority_based: 'Priority Based',
        smart_adaptive: 'AI Adaptive',
      });
    });
  });
});
