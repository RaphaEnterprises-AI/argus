/**
 * Tests for lib/hooks/use-schedules.ts
 *
 * Tests schedule-related React Query hooks including:
 * - useSchedules
 * - useScheduleRuns
 * - useScheduleStats
 * - useCreateSchedule
 * - useUpdateSchedule
 * - useToggleSchedule
 * - useDeleteSchedule
 * - useTriggerSchedule
 * - useTestsForSchedule
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

// Mock useProjects
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: vi.fn(() => ({
    data: [
      { id: 'proj-1', name: 'Project 1' },
      { id: 'proj-2', name: 'Project 2' },
    ],
  })),
}));

describe('use-schedules', () => {
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
      gte: vi.fn().mockImplementation(() => chain),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useSchedules', () => {
    it('should fetch schedules for all user projects', async () => {
      const mockSchedules = [
        { id: 'sch-1', name: 'Schedule 1', project_id: 'proj-1' },
        { id: 'sch-2', name: 'Schedule 2', project_id: 'proj-2' },
      ];

      const mockChain = createMockChain(mockSchedules, null);
      mockChain.order.mockResolvedValue({ data: mockSchedules, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useSchedules } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useSchedules(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_schedules');
      expect(mockChain.in).toHaveBeenCalledWith('project_id', ['proj-1', 'proj-2']);
    });

    it('should return empty array when no projects', async () => {
      // Override the useProjects mock
      const { useProjects } = await import('@/lib/hooks/use-projects');
      vi.mocked(useProjects).mockReturnValue({ data: [] } as any);

      const { useSchedules } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useSchedules(), { wrapper });

      // Should not make any Supabase calls
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useScheduleRuns', () => {
    it('should return undefined when scheduleId is null', async () => {
      const { useScheduleRuns } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useScheduleRuns(null), { wrapper });

      // Query is disabled when scheduleId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch runs for a schedule', async () => {
      const mockRuns = [
        { id: 'run-1', schedule_id: 'sch-1', status: 'passed' },
        { id: 'run-2', schedule_id: 'sch-1', status: 'failed' },
      ];

      const mockChain = createMockChain(mockRuns, null);
      mockChain.limit.mockResolvedValue({ data: mockRuns, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useScheduleRuns } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useScheduleRuns('sch-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockChain.eq).toHaveBeenCalledWith('schedule_id', 'sch-1');
    });
  });

  describe('useScheduleStats', () => {
    it('should calculate today stats', async () => {
      const mockSchedules = [{ id: 'sch-1' }, { id: 'sch-2' }];
      const mockRuns = [
        { status: 'passed' },
        { status: 'passed' },
        { status: 'failed' },
      ];

      // First call for schedules
      const schedulesChain = createMockChain(mockSchedules, null);
      schedulesChain.select.mockReturnThis();
      schedulesChain.in.mockResolvedValue({ data: mockSchedules, error: null });

      // Second call for runs
      const runsChain = createMockChain(mockRuns, null);
      runsChain.gte.mockResolvedValue({ data: mockRuns, error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'test_schedules') return schedulesChain;
        if (table === 'schedule_runs') return runsChain;
        return schedulesChain;
      });

      const { useScheduleStats } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useScheduleStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.runsToday).toBe(3);
      expect(result.current.data?.failuresToday).toBe(1);
    });

    it('should return zeros when no schedules', async () => {
      const schedulesChain = createMockChain([], null);
      schedulesChain.in.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(schedulesChain);

      const { useScheduleStats } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useScheduleStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({ runsToday: 0, failuresToday: 0 });
      });
    });
  });

  describe('useCreateSchedule', () => {
    it('should create a schedule', async () => {
      const newSchedule = {
        id: 'new-sch',
        name: 'New Schedule',
        project_id: 'proj-1',
      };

      const mockChain = createMockChain(newSchedule, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useCreateSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          data: {
            name: 'New Schedule',
            cron_expression: '0 9 * * *',
            timezone: 'UTC',
            test_ids: [],
            test_filter: {},
            notification_config: { on_failure: true, on_success: false, channels: [] },
            environment: 'staging',
            browser: 'chromium',
            max_parallel_tests: 5,
            timeout_ms: 300000,
            retry_failed_tests: false,
            retry_count: 0,
          },
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_schedules');
      expect(mockChain.insert).toHaveBeenCalled();
    });
  });

  describe('useUpdateSchedule', () => {
    it('should update a schedule', async () => {
      const updatedSchedule = {
        id: 'sch-1',
        name: 'Updated Schedule',
      };

      const mockChain = createMockChain(updatedSchedule, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useUpdateSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'sch-1',
          data: {
            name: 'Updated Schedule',
          },
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({ name: 'Updated Schedule' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'sch-1');
    });
  });

  describe('useToggleSchedule', () => {
    it('should toggle schedule enabled state', async () => {
      const toggledSchedule = {
        id: 'sch-1',
        enabled: false,
      };

      const mockChain = createMockChain(toggledSchedule, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useToggleSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useToggleSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'sch-1',
          enabled: false,
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('useDeleteSchedule', () => {
    it('should delete a schedule', async () => {
      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useDeleteSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sch-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('test_schedules');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'sch-1');
    });

    it('should invalidate schedules query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useDeleteSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sch-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['schedules'],
      });
    });
  });

  describe('useTriggerSchedule', () => {
    it('should trigger a schedule manually', async () => {
      const newRun = {
        id: 'run-1',
        schedule_id: 'sch-1',
        trigger_type: 'manual',
        status: 'queued',
      };

      const mockChain = createMockChain(newRun, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTriggerSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useTriggerSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sch-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('schedule_runs');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule_id: 'sch-1',
          trigger_type: 'manual',
          status: 'queued',
        })
      );
    });

    it('should invalidate schedule runs and stats on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain({ id: 'run-1' }, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTriggerSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useTriggerSchedule(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('sch-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['schedule-runs', 'sch-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['schedule-stats'],
      });
    });
  });

  describe('useTestsForSchedule', () => {
    it('should return undefined when projectId is null', async () => {
      const { useTestsForSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useTestsForSchedule(null), {
        wrapper,
      });

      // Query is disabled when projectId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch active tests for a project', async () => {
      const mockTests = [
        { id: 'test-1', name: 'Test 1', tags: ['smoke'] },
        { id: 'test-2', name: 'Test 2', tags: ['regression'] },
      ];

      const mockChain = createMockChain(mockTests, null);
      mockChain.order.mockResolvedValue({ data: mockTests, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestsForSchedule } = await import('@/lib/hooks/use-schedules');

      const { result } = renderHook(() => useTestsForSchedule('proj-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tests');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });
});
