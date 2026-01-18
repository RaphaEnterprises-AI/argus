/**
 * Tests for lib/hooks/use-notifications.ts
 *
 * Tests notification-related React Query hooks including:
 * - useNotificationChannels
 * - useNotificationLogs
 * - useCreateNotificationChannel
 * - useUpdateNotificationChannel
 * - useDeleteNotificationChannel
 * - useTestNotificationChannel
 * - useRetryNotification
 * - useNotificationStats
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

describe('use-notifications', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useNotificationChannels', () => {
    it('should fetch notification channels with rule counts', async () => {
      const mockChannels = [
        { id: 'ch-1', name: 'Slack', channel_type: 'slack', enabled: true },
        { id: 'ch-2', name: 'Email', channel_type: 'email', enabled: true },
      ];
      const mockRules = [
        { channel_id: 'ch-1' },
        { channel_id: 'ch-1' },
        { channel_id: 'ch-2' },
      ];

      // First call for channels
      const channelChain = createMockChain(mockChannels, null);
      channelChain.order.mockResolvedValue({ data: mockChannels, error: null });

      // Second call for rules
      const rulesChain = createMockChain(mockRules, null);
      rulesChain.select.mockResolvedValue({ data: mockRules, error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_channels') return channelChain;
        if (table === 'notification_rules') return rulesChain;
        return channelChain;
      });

      const { useNotificationChannels } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useNotificationChannels(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_channels');
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_rules');
    });
  });

  describe('useNotificationLogs', () => {
    it('should fetch notification logs with channel info', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          channel_id: 'ch-1',
          status: 'sent',
          notification_channels: { name: 'Slack', channel_type: 'slack' },
        },
        {
          id: 'log-2',
          channel_id: 'ch-2',
          status: 'failed',
          notification_channels: { name: 'Email', channel_type: 'email' },
        },
      ];

      const mockChain = createMockChain(mockLogs, null);
      mockChain.limit.mockResolvedValue({ data: mockLogs, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useNotificationLogs } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useNotificationLogs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_logs');
    });

    it('should respect the limit parameter', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useNotificationLogs } = await import(
        '@/lib/hooks/use-notifications'
      );

      renderHook(() => useNotificationLogs(25), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalledWith(25);
      });
    });
  });

  describe('useCreateNotificationChannel', () => {
    it('should create a notification channel', async () => {
      const newChannel = {
        id: 'new-ch',
        name: 'New Channel',
        channel_type: 'slack',
      };

      const mockChain = createMockChain(newChannel, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useCreateNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Channel',
          channel_type: 'slack',
          config: { webhook_url: 'https://hooks.slack.com/test' },
          enabled: true,
          rate_limit_per_hour: 100,
          rules: [],
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_channels');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should create rules when provided', async () => {
      const newChannel = { id: 'new-ch', name: 'New Channel' };

      const channelChain = createMockChain(newChannel, null);
      const rulesChain = createMockChain(null, null);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_channels') return channelChain;
        if (table === 'notification_rules') return rulesChain;
        return channelChain;
      });

      const { useCreateNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useCreateNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Channel',
          channel_type: 'slack',
          config: {},
          enabled: true,
          rate_limit_per_hour: 100,
          rules: [
            { event_type: 'test.failed', priority: 'high' },
            { event_type: 'test.passed' },
          ],
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_rules');
    });
  });

  describe('useUpdateNotificationChannel', () => {
    it('should update a notification channel', async () => {
      const updatedChannel = {
        id: 'ch-1',
        name: 'Updated Channel',
      };

      const mockChain = createMockChain(updatedChannel, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useUpdateNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'ch-1',
          data: {
            name: 'Updated Channel',
            channel_type: 'slack',
            config: {},
            enabled: true,
            rate_limit_per_hour: 50,
            rules: [],
          },
        });
      });

      expect(mockChain.update).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'ch-1');
    });
  });

  describe('useDeleteNotificationChannel', () => {
    it('should delete a notification channel', async () => {
      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useDeleteNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync('ch-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_channels');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'ch-1');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useDeleteNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync('ch-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['notification-channels'],
      });
    });
  });

  describe('useTestNotificationChannel', () => {
    it('should queue a test notification', async () => {
      const testLog = {
        id: 'log-1',
        channel_id: 'ch-1',
        status: 'queued',
      };

      const mockChain = createMockChain(testLog, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useTestNotificationChannel } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useTestNotificationChannel(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync('ch-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_logs');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'ch-1',
          event_type: 'test.notification',
          status: 'queued',
        })
      );
    });
  });

  describe('useRetryNotification', () => {
    it('should retry a failed notification', async () => {
      const retriedLog = {
        id: 'log-1',
        status: 'queued',
      };

      const mockChain = createMockChain(retriedLog, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useRetryNotification } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useRetryNotification(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('log-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notification_logs');
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'queued',
        next_retry_at: null,
      });
    });
  });

  describe('useNotificationStats', () => {
    it('should calculate notification statistics', async () => {
      // Mock channels data
      const mockChannels = [
        { id: 'ch-1', enabled: true, verified: true, sent_today: 10 },
        { id: 'ch-2', enabled: true, verified: false, sent_today: 5 },
        { id: 'ch-3', enabled: false, verified: true, sent_today: 0 },
      ];

      // Mock logs data
      const mockLogs = [
        { status: 'sent' },
        { status: 'delivered' },
        { status: 'failed' },
        { status: 'bounced' },
      ];

      // Setup mock chains
      const channelChain = createMockChain(mockChannels, null);
      channelChain.order.mockResolvedValue({ data: mockChannels, error: null });

      const rulesChain = createMockChain([], null);
      rulesChain.select.mockResolvedValue({ data: [], error: null });

      const logsChain = createMockChain(mockLogs, null);
      logsChain.limit.mockResolvedValue({ data: mockLogs, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_channels') return channelChain;
        if (table === 'notification_rules') return rulesChain;
        if (table === 'notification_logs') return logsChain;
        return channelChain;
      });

      const { useNotificationStats } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useNotificationStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.totalChannels).toBe(3);
      });

      expect(result.current.enabledChannels).toBe(2);
      expect(result.current.verifiedChannels).toBe(2);
      expect(result.current.notificationsSentToday).toBe(15);
      expect(result.current.failedToday).toBe(2);
    });

    it('should calculate success rate correctly', async () => {
      const mockChannels = [
        { id: 'ch-1', enabled: true, verified: true, sent_today: 0 },
      ];

      const mockLogs = [
        { status: 'sent' },
        { status: 'delivered' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'failed' },
      ];

      const channelChain = createMockChain(mockChannels, null);
      channelChain.order.mockResolvedValue({ data: mockChannels, error: null });

      const rulesChain = createMockChain([], null);
      rulesChain.select.mockResolvedValue({ data: [], error: null });

      const logsChain = createMockChain(mockLogs, null);
      logsChain.limit.mockResolvedValue({ data: mockLogs, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_channels') return channelChain;
        if (table === 'notification_rules') return rulesChain;
        if (table === 'notification_logs') return logsChain;
        return channelChain;
      });

      const { useNotificationStats } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useNotificationStats(), { wrapper });

      await waitFor(() => {
        // 4 successful out of 5 total = 80%
        expect(result.current.successRate).toBe(80);
      });
    });

    it('should return 100% success rate when no logs', async () => {
      const mockChannels: any[] = [];
      const mockLogs: any[] = [];

      const channelChain = createMockChain(mockChannels, null);
      channelChain.order.mockResolvedValue({ data: mockChannels, error: null });

      const rulesChain = createMockChain([], null);
      rulesChain.select.mockResolvedValue({ data: [], error: null });

      const logsChain = createMockChain(mockLogs, null);
      logsChain.limit.mockResolvedValue({ data: mockLogs, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_channels') return channelChain;
        if (table === 'notification_rules') return rulesChain;
        if (table === 'notification_logs') return logsChain;
        return channelChain;
      });

      const { useNotificationStats } = await import(
        '@/lib/hooks/use-notifications'
      );

      const { result } = renderHook(() => useNotificationStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.successRate).toBe(100);
      });
    });
  });
});
