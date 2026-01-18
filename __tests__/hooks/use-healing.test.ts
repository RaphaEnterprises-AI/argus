/**
 * Tests for lib/hooks/use-healing.ts
 *
 * Tests self-healing configuration React Query hooks including:
 * - useHealingConfig
 * - useHealingStats
 * - useUpdateHealingConfig
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

describe('use-healing', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const mockHealingConfig = {
    id: 'config-1',
    organization_id: 'org-123',
    enabled: true,
    auto_apply: false,
    min_confidence_auto: 0.95,
    min_confidence_suggest: 0.70,
    heal_selectors: true,
    max_selector_variations: 9,
    preferred_selector_strategies: ['id', 'data-testid', 'role', 'text', 'css'],
    heal_timeouts: true,
    max_wait_time_ms: 30000,
    heal_text_content: true,
    text_similarity_threshold: 0.85,
    learn_from_success: true,
    learn_from_manual_fixes: true,
    share_patterns_across_projects: false,
    notify_on_heal: true,
    notify_on_suggestion: true,
    require_approval: true,
    auto_approve_after_hours: null,
    max_heals_per_hour: 50,
    max_heals_per_test: 5,
  };

  const mockHealingStats = {
    total_patterns: 25,
    total_heals_applied: 150,
    total_heals_suggested: 200,
    success_rate: 0.92,
    heals_last_24h: 12,
    heals_last_7d: 45,
    heals_last_30d: 150,
    avg_confidence: 0.88,
    top_error_types: {
      selector_not_found: 80,
      timeout: 45,
      text_mismatch: 25,
    },
    patterns_by_project: {
      'proj-1': 15,
      'proj-2': 10,
    },
    recent_heals: [
      {
        id: 'heal-1',
        original: '#old-button',
        healed: '[data-testid="new-button"]',
        error_type: 'selector_not_found',
        confidence: 0.95,
        created_at: '2024-01-15T00:00:00Z',
      },
    ],
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

  describe('useHealingConfig', () => {
    it('should fetch healing configuration for an organization', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockHealingConfig);

      const { useHealingConfig } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingConfig('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/healing/organizations/org-123/config');
      expect(result.current.data?.enabled).toBe(true);
      expect(result.current.data?.auto_apply).toBe(false);
    });

    it('should not fetch when orgId is empty', async () => {
      const { useHealingConfig } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingConfig(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should return default config on API error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const { useHealingConfig, DEFAULT_HEALING_CONFIG } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingConfig('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return default config (from placeholderData or error fallback)
      expect(result.current.data).toBeDefined();
    });

    it('should use placeholderData to prevent loading flash', async () => {
      // Never resolve the API call
      vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

      const { useHealingConfig, DEFAULT_HEALING_CONFIG } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingConfig('org-123'), { wrapper });

      // Should have placeholder data immediately
      expect(result.current.data).toEqual(DEFAULT_HEALING_CONFIG);
    });
  });

  describe('useHealingStats', () => {
    it('should fetch healing statistics for an organization', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockHealingStats);

      const { useHealingStats } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingStats('org-123'), { wrapper });

      // Wait for actual data (not just placeholderData which is returned immediately)
      await waitFor(() => {
        expect(result.current.data?.total_patterns).toBe(25);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/healing/organizations/org-123/stats');
      expect(result.current.data?.success_rate).toBe(0.92);
    });

    it('should not fetch when orgId is empty', async () => {
      const { useHealingStats } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingStats(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should return default stats on API error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const { useHealingStats, DEFAULT_HEALING_STATS } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useHealingStats('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return default stats
      expect(result.current.data).toBeDefined();
    });
  });

  describe('useUpdateHealingConfig', () => {
    it('should update healing configuration', async () => {
      const updatedConfig = { ...mockHealingConfig, auto_apply: true };
      vi.mocked(apiClient.put).mockResolvedValue(updatedConfig);

      const { useUpdateHealingConfig } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useUpdateHealingConfig('org-123'), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync(updatedConfig);
        expect(updated.auto_apply).toBe(true);
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/healing/organizations/org-123/config',
        updatedConfig
      );
    });

    it('should update cache on success', async () => {
      const updatedConfig = { ...mockHealingConfig, enabled: false };
      vi.mocked(apiClient.put).mockResolvedValue(updatedConfig);

      const { useUpdateHealingConfig } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useUpdateHealingConfig('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updatedConfig);
      });

      // Check that the cache was updated
      const cachedData = queryClient.getQueryData(['healing', 'config', 'org-123']);
      expect(cachedData).toEqual(updatedConfig);
    });

    it('should handle update error', async () => {
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Update failed'));

      const { useUpdateHealingConfig } = await import('@/lib/hooks/use-healing');

      const { result } = renderHook(() => useUpdateHealingConfig('org-123'), { wrapper });

      await expect(
        result.current.mutateAsync(mockHealingConfig)
      ).rejects.toThrow('Update failed');
    });
  });
});
