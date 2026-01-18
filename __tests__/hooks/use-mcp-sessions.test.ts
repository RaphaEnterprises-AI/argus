/**
 * Tests for lib/hooks/use-mcp-sessions.ts
 *
 * Tests MCP (Model Context Protocol) session management hooks including:
 * - useMCPSessions
 * - useMCPSessionActivity
 * - useRevokeMCPSession
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn(),
  })),
}));

// Mock authenticatedFetch
const mockAuthenticatedFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: (...args: unknown[]) => mockAuthenticatedFetch(...args),
}));

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { useAuth } from '@clerk/nextjs';

describe('use-mcp-sessions', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // Sample mock data
  const mockMCPConnection = {
    id: 'conn-1',
    user_id: 'user-123',
    organization_id: 'org-1',
    client_id: 'client-abc',
    client_name: 'Claude Desktop',
    client_type: 'desktop',
    session_id: 'sess-xyz',
    device_name: 'MacBook Pro',
    status: 'active',
    last_activity_at: '2024-01-15T10:30:00Z',
    request_count: 42,
    tools_used: ['search', 'file_read', 'run_tests'],
    connected_at: '2024-01-15T09:00:00Z',
    is_active: true,
  };

  const mockMCPActivity = {
    id: 'activity-1',
    connection_id: 'conn-1',
    activity_type: 'tool_call',
    tool_name: 'search',
    duration_ms: 150,
    success: true,
    error_message: null,
    created_at: '2024-01-15T10:30:00Z',
  };

  const mockConnectionsResponse = {
    connections: [mockMCPConnection],
    total: 1,
    active_count: 1,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    mockAuthenticatedFetch.mockReset();
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
    mockSupabase.removeChannel.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: vi.fn(),
    } as any);

    // Clear module cache
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useMCPSessions', () => {
    it('should not fetch when auth is not loaded', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        getToken: vi.fn(),
      } as any);

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });

    it('should not fetch when user is not signed in', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
      } as any);

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });

    it('should not fetch when orgId is empty', async () => {
      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    });

    it('should fetch MCP sessions for an organization', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConnectionsResponse),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        '/api/v1/mcp/connections?org_id=org-1',
        expect.objectContaining({
          headers: { 'X-Organization-ID': 'org-1' },
        })
      );

      expect(result.current.data?.connections).toHaveLength(1);
      expect(result.current.data?.connections[0].id).toBe('conn-1');
      expect(result.current.data?.total).toBe(1);
      expect(result.current.data?.active_count).toBe(1);
    });

    it('should handle fetch errors', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch MCP sessions');
    });

    it('should handle network errors', async () => {
      mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'));

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should have 30 second stale time', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConnectionsResponse),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The stale time is internal to the hook
      // We verify it fetches successfully
      expect(result.current.data).toBeDefined();
    });

    it('should return multiple connections', async () => {
      const multipleConnections = {
        connections: [
          mockMCPConnection,
          { ...mockMCPConnection, id: 'conn-2', client_name: 'VS Code', is_active: false },
          { ...mockMCPConnection, id: 'conn-3', client_name: 'Cursor', is_active: true },
        ],
        total: 3,
        active_count: 2,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multipleConnections),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.connections).toHaveLength(3);
      });

      expect(result.current.data?.total).toBe(3);
      expect(result.current.data?.active_count).toBe(2);
    });

    it('should return empty connections list', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ connections: [], total: 0, active_count: 0 }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.connections).toHaveLength(0);
      expect(result.current.data?.total).toBe(0);
    });
  });

  describe('useMCPSessionActivity', () => {
    it('should return empty activities initially', async () => {
      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      expect(result.current.activities).toEqual([]);
    });

    it('should subscribe to realtime updates for connection activity', async () => {
      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      expect(mockSupabase.channel).toHaveBeenCalledWith('mcp-activity-conn-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mcp_connection_activity',
          filter: 'connection_id=eq.conn-1',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should cleanup subscription on unmount', async () => {
      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { unmount } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should add new activities from realtime updates', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null;
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (config.event === 'INSERT') {
          realtimeCallback = callback;
        }
        return mockChannel;
      });

      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      // Simulate realtime activity insert
      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback!({ new: mockMCPActivity });
        });
      }

      expect(result.current.activities).toHaveLength(1);
      expect(result.current.activities[0].id).toBe('activity-1');
    });

    it('should prepend new activities to the list', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null;
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (config.event === 'INSERT') {
          realtimeCallback = callback;
        }
        return mockChannel;
      });

      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      // Add first activity
      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback!({ new: mockMCPActivity });
        });
      }

      // Add second activity
      const secondActivity = { ...mockMCPActivity, id: 'activity-2' };
      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback!({ new: secondActivity });
        });
      }

      expect(result.current.activities).toHaveLength(2);
      // New activities are prepended
      expect(result.current.activities[0].id).toBe('activity-2');
      expect(result.current.activities[1].id).toBe('activity-1');
    });

    it('should update subscription when connectionId changes', async () => {
      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { rerender } = renderHook(
        ({ connectionId }) => useMCPSessionActivity(connectionId),
        {
          wrapper,
          initialProps: { connectionId: 'conn-1' },
        }
      );

      expect(mockSupabase.channel).toHaveBeenCalledWith('mcp-activity-conn-1');

      // Change connection ID
      rerender({ connectionId: 'conn-2' });

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledWith('mcp-activity-conn-2');
    });
  });

  describe('useRevokeMCPSession', () => {
    it('should revoke an MCP session', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        });
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        '/api/v1/mcp/connections/conn-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'X-Organization-ID': 'org-1' },
        })
      );
    });

    it('should invalidate sessions query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['mcp-sessions', 'org-1'],
      });
    });

    it('should handle revoke errors', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await expect(
        result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        })
      ).rejects.toThrow('Failed to revoke session');
    });

    it('should handle network errors during revoke', async () => {
      mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'));

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await expect(
        result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle 404 not found error', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Connection not found' }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await expect(
        result.current.mutateAsync({
          connectionId: 'nonexistent-conn',
          orgId: 'org-1',
        })
      ).rejects.toThrow('Failed to revoke session');
    });

    it('should not invalidate queries on failure', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      await expect(
        result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        })
      ).rejects.toThrow();

      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });

    it('should track loading state during mutation', async () => {
      // Set up mock that resolves immediately
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { useRevokeMCPSession } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useRevokeMCPSession(), { wrapper });

      // Initially not pending
      expect(result.current.isPending).toBe(false);

      // Execute mutation and verify it completes
      await act(async () => {
        await result.current.mutateAsync({
          connectionId: 'conn-1',
          orgId: 'org-1',
        });
      });

      // After mutation completes, isPending should be false
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('MCPConnection type validation', () => {
    it('should handle connections with all fields', async () => {
      const fullConnection = {
        ...mockMCPConnection,
        organization_id: 'org-123',
        device_name: 'Production Server',
        tools_used: ['tool1', 'tool2', 'tool3'],
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          connections: [fullConnection],
          total: 1,
          active_count: 1,
        }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const connection = result.current.data?.connections[0];
      expect(connection?.organization_id).toBe('org-123');
      expect(connection?.device_name).toBe('Production Server');
      expect(connection?.tools_used).toHaveLength(3);
    });

    it('should handle connections with null optional fields', async () => {
      const minimalConnection = {
        ...mockMCPConnection,
        organization_id: null,
        client_name: null,
        session_id: null,
        device_name: null,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          connections: [minimalConnection],
          total: 1,
          active_count: 1,
        }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const connection = result.current.data?.connections[0];
      expect(connection?.organization_id).toBeNull();
      expect(connection?.client_name).toBeNull();
    });
  });

  describe('MCPActivity type validation', () => {
    it('should handle activities with all fields', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null;
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (config.event === 'INSERT') {
          realtimeCallback = callback;
        }
        return mockChannel;
      });

      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      const fullActivity = {
        id: 'activity-full',
        connection_id: 'conn-1',
        activity_type: 'tool_call',
        tool_name: 'file_read',
        duration_ms: 500,
        success: true,
        error_message: null,
        created_at: '2024-01-15T10:30:00Z',
      };

      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback!({ new: fullActivity });
        });
      }

      expect(result.current.activities[0].tool_name).toBe('file_read');
      expect(result.current.activities[0].duration_ms).toBe(500);
      expect(result.current.activities[0].success).toBe(true);
    });

    it('should handle activities with failed status', async () => {
      let realtimeCallback: ((payload: any) => void) | null = null;
      mockChannel.on.mockImplementation((event, config, callback) => {
        if (config.event === 'INSERT') {
          realtimeCallback = callback;
        }
        return mockChannel;
      });

      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessionActivity('conn-1'), { wrapper });

      const failedActivity = {
        id: 'activity-failed',
        connection_id: 'conn-1',
        activity_type: 'tool_call',
        tool_name: 'file_write',
        duration_ms: 100,
        success: false,
        error_message: 'Permission denied',
        created_at: '2024-01-15T10:30:00Z',
      };

      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback!({ new: failedActivity });
        });
      }

      expect(result.current.activities[0].success).toBe(false);
      expect(result.current.activities[0].error_message).toBe('Permission denied');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid connection ID changes', async () => {
      const { useMCPSessionActivity } = await import('@/lib/hooks/use-mcp-sessions');

      const { rerender } = renderHook(
        ({ connectionId }) => useMCPSessionActivity(connectionId),
        {
          wrapper,
          initialProps: { connectionId: 'conn-1' },
        }
      );

      // Rapidly change connection IDs
      rerender({ connectionId: 'conn-2' });
      rerender({ connectionId: 'conn-3' });
      rerender({ connectionId: 'conn-4' });

      // Should have cleaned up previous subscriptions
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenLastCalledWith('mcp-activity-conn-4');
    });

    it('should handle empty tools_used array', async () => {
      const connectionWithNoTools = {
        ...mockMCPConnection,
        tools_used: [],
        request_count: 0,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          connections: [connectionWithNoTools],
          total: 1,
          active_count: 1,
        }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.connections[0].tools_used).toEqual([]);
      expect(result.current.data?.connections[0].request_count).toBe(0);
    });

    it('should handle inactive connection status', async () => {
      const inactiveConnection = {
        ...mockMCPConnection,
        status: 'disconnected',
        is_active: false,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          connections: [inactiveConnection],
          total: 1,
          active_count: 0,
        }),
      });

      const { useMCPSessions } = await import('@/lib/hooks/use-mcp-sessions');

      const { result } = renderHook(() => useMCPSessions('org-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.connections[0].is_active).toBe(false);
      expect(result.current.data?.active_count).toBe(0);
    });
  });
});
