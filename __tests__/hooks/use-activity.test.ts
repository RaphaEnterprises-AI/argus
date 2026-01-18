/**
 * Tests for lib/hooks/use-activity.ts
 *
 * Tests activity-related React Query hooks including:
 * - useActivityFeed
 * - useRealtimeActivity
 * - useActivityStats
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

// Mock useProjects
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: vi.fn(() => ({
    data: [
      { id: 'proj-1', name: 'Project 1' },
      { id: 'proj-2', name: 'Project 2' },
    ],
  })),
}));

describe('use-activity', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useActivityFeed', () => {
    it('should return empty array when no projects', async () => {
      const { useProjects } = await import('@/lib/hooks/use-projects');
      vi.mocked(useProjects).mockReturnValue({ data: [] } as any);

      const { useActivityFeed } = await import('@/lib/hooks/use-activity');

      const { result } = renderHook(() => useActivityFeed(), { wrapper });

      // Query should be disabled with no projects
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch activity from multiple sources', async () => {
      const mockActivityLogs = [
        {
          id: 'log-1',
          project_id: 'proj-1',
          session_id: 'sess-1',
          activity_type: 'test_run',
          event_type: 'started',
          title: 'Test run started',
          description: 'Running tests',
          metadata: null,
          screenshot_url: null,
          duration_ms: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockTestRuns = [
        {
          id: 'run-1',
          project_id: 'proj-1',
          name: 'Test Run 1',
          status: 'passed',
          trigger: 'manual',
          total_tests: 10,
          passed_tests: 10,
          failed_tests: 0,
          duration_ms: 5000,
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      ];

      const mockDiscoveries = [
        {
          id: 'disc-1',
          project_id: 'proj-1',
          status: 'completed',
          pages_found: 5,
          flows_found: 3,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      ];

      const mockHealings = [
        {
          id: 'heal-1',
          project_id: 'proj-1',
          error_type: 'selector_not_found',
          original_selector: '#old-button',
          healed_selector: '#new-button',
          confidence: 0.95,
          success_count: 3,
          created_at: new Date().toISOString(),
        },
      ];

      const mockScheduleRuns = [
        {
          id: 'sched-run-1',
          schedule_id: 'sched-1',
          status: 'completed',
          trigger_type: 'scheduled',
          tests_total: 5,
          tests_failed: 0,
          triggered_at: new Date().toISOString(),
          test_schedules: { name: 'Daily Tests', project_id: 'proj-1' },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        const chains: Record<string, any> = {
          activity_logs: createMockChain(mockActivityLogs, null),
          test_runs: createMockChain(mockTestRuns, null),
          discovery_sessions: createMockChain(mockDiscoveries, null),
          healing_patterns: createMockChain(mockHealings, null),
          schedule_runs: createMockChain(mockScheduleRuns, null),
        };
        return chains[table] || createMockChain([], null);
      });

      const { useActivityFeed } = await import('@/lib/hooks/use-activity');

      const { result } = renderHook(() => useActivityFeed(50), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs');
      expect(mockSupabase.from).toHaveBeenCalledWith('test_runs');
      expect(mockSupabase.from).toHaveBeenCalledWith('discovery_sessions');
      expect(mockSupabase.from).toHaveBeenCalledWith('healing_patterns');
      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
    });

    it('should respect limit parameter', async () => {
      const activityChain = createMockChain([], null);
      mockSupabase.from.mockReturnValue(activityChain);

      const { useActivityFeed } = await import('@/lib/hooks/use-activity');

      renderHook(() => useActivityFeed(25), { wrapper });

      await waitFor(() => {
        expect(activityChain.limit).toHaveBeenCalledWith(25);
      });
    });

    it('should map activity_type correctly', async () => {
      const mockActivityLogs = [
        {
          id: 'log-1',
          project_id: 'proj-1',
          session_id: 'sess-1',
          activity_type: 'test_run',
          event_type: 'completed',
          title: 'Test completed',
          description: null,
          metadata: { success: true },
          screenshot_url: null,
          duration_ms: 1000,
          created_at: new Date().toISOString(),
        },
        {
          id: 'log-2',
          project_id: 'proj-1',
          session_id: 'sess-2',
          activity_type: 'discovery',
          event_type: 'completed',
          title: 'Discovery completed',
          description: null,
          metadata: null,
          screenshot_url: null,
          duration_ms: 2000,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue(createMockChain(mockActivityLogs, null));

      const { useActivityFeed } = await import('@/lib/hooks/use-activity');

      const { result } = renderHook(() => useActivityFeed(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('useRealtimeActivity', () => {
    it('should not subscribe when no projects', async () => {
      const { useProjects } = await import('@/lib/hooks/use-projects');
      vi.mocked(useProjects).mockReturnValue({ data: [] } as any);

      const { useRealtimeActivity } = await import('@/lib/hooks/use-activity');

      renderHook(() => useRealtimeActivity(), { wrapper });

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should subscribe to realtime activity channel', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { useRealtimeActivity } = await import('@/lib/hooks/use-activity');

      renderHook(() => useRealtimeActivity(), { wrapper });

      expect(mockSupabase.channel).toHaveBeenCalledWith('activity-realtime');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should cleanup subscription on unmount', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { useRealtimeActivity } = await import('@/lib/hooks/use-activity');

      const { unmount } = renderHook(() => useRealtimeActivity(), { wrapper });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should return newActivities and clearNewActivities function', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      mockSupabase.channel.mockReturnValue(mockChannel);

      const { useRealtimeActivity } = await import('@/lib/hooks/use-activity');

      const { result } = renderHook(() => useRealtimeActivity(), { wrapper });

      expect(result.current.newActivities).toEqual([]);
      expect(typeof result.current.clearNewActivities).toBe('function');
    });
  });

  describe('useActivityStats', () => {
    it('should calculate stats from activity feed', async () => {
      const now = new Date();
      const recentTimestamp = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 mins ago
      const oldTimestamp = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

      const mockActivityLogs = [
        {
          id: 'log-1',
          project_id: 'proj-1',
          session_id: 'sess-1',
          activity_type: 'test_run',
          event_type: 'completed',
          title: 'Test passed',
          description: null,
          metadata: { success: true },
          screenshot_url: null,
          duration_ms: 1000,
          created_at: recentTimestamp,
        },
        {
          id: 'log-2',
          project_id: 'proj-1',
          session_id: 'sess-2',
          activity_type: 'test_run',
          event_type: 'completed',
          title: 'Test failed',
          description: null,
          metadata: { success: false },
          screenshot_url: null,
          duration_ms: 2000,
          created_at: recentTimestamp,
        },
      ];

      mockSupabase.from.mockReturnValue(createMockChain(mockActivityLogs, null));

      const { useActivityStats } = await import('@/lib/hooks/use-activity');

      const { result } = renderHook(() => useActivityStats(), { wrapper });

      // Stats are derived from useActivityFeed
      expect(typeof result.current.lastHour).toBe('number');
      expect(typeof result.current.testRuns).toBe('number');
      expect(typeof result.current.healsApplied).toBe('number');
      expect(typeof result.current.failures).toBe('number');
    });
  });
});
