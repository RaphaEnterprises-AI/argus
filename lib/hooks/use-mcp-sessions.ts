import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { authenticatedFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';

interface MCPConnection {
  id: string;
  user_id: string;
  organization_id: string | null;
  client_id: string;
  client_name: string | null;
  client_type: string;
  session_id: string | null;
  device_name: string | null;
  status: string;
  last_activity_at: string;
  request_count: number;
  tools_used: string[];
  connected_at: string;
  is_active: boolean;
}

interface MCPActivity {
  id: string;
  connection_id: string;
  activity_type: string;
  tool_name: string | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export function useMCPSessions(orgId: string) {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['mcp-sessions', orgId],
    queryFn: async () => {
      // Use global authenticatedFetch which has pre-configured token getter
      const response = await authenticatedFetch(`/api/v1/mcp/connections?org_id=${orgId}`, {
        headers: { 'X-Organization-ID': orgId },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch MCP sessions');
      }
      return response.json() as Promise<{ connections: MCPConnection[]; total: number; active_count: number }>;
    },
    staleTime: 30 * 1000, // 30 seconds
    // Only fetch when auth is loaded, user is signed in, and orgId is set
    enabled: isLoaded && isSignedIn && !!orgId,
  });
}

export function useMCPSessionActivity(connectionId: string) {
  const [activities, setActivities] = useState<MCPActivity[]>([]);

  // Initial fetch
  useEffect(() => {
    // Fetch initial activities
  }, [connectionId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`mcp-activity-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mcp_connection_activity',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setActivities(prev => [payload.new as MCPActivity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  return { activities };
}

export function useRevokeMCPSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, orgId }: { connectionId: string; orgId: string }) => {
      const response = await authenticatedFetch(`/api/v1/mcp/connections/${connectionId}`, {
        method: 'DELETE',
        headers: { 'X-Organization-ID': orgId },
      });
      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }
      return response.json();
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['mcp-sessions', orgId] });
    },
  });
}
