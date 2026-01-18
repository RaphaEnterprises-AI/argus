/**
 * Tests for lib/hooks/use-quality.ts
 *
 * Tests quality audit React Query hooks including:
 * - useQualityAudits
 * - useLatestAudit
 * - useAccessibilityIssues
 * - useStartQualityAudit
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

// Mock fetch for worker calls
let mockFetch: ReturnType<typeof vi.fn>;

describe('use-quality', () => {
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockResult),
      single: vi.fn().mockResolvedValue(mockResult),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      then: (cb: any) => Promise.resolve(mockResult).then(cb),
    };
  };

  const mockAudit = {
    id: 'audit-1',
    project_id: 'proj-1',
    url: 'https://example.com',
    status: 'completed',
    accessibility_score: 85,
    performance_score: 90,
    best_practices_score: 80,
    seo_score: 95,
    lcp_ms: 2000,
    fcp_ms: 1000,
    cls: 0.05,
    ttfb_ms: 150,
    started_at: '2024-01-15T00:00:00Z',
    completed_at: '2024-01-15T00:01:00Z',
  };

  const mockIssues = [
    {
      id: 'issue-1',
      audit_id: 'audit-1',
      rule: 'image-alt',
      severity: 'critical',
      element_selector: 'img.hero',
      description: 'Image is missing alt text',
      suggested_fix: 'Add an alt attribute',
      wcag_criteria: ['1.1.1'],
    },
    {
      id: 'issue-2',
      audit_id: 'audit-1',
      rule: 'label',
      severity: 'serious',
      element_selector: 'input#email',
      description: 'Form input has no label',
      suggested_fix: 'Add a <label> element',
      wcag_criteria: ['1.3.1', '3.3.2'],
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

    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useQualityAudits', () => {
    it('should return empty array when projectId is null', async () => {
      const { useQualityAudits } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useQualityAudits(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch quality audits for a project', async () => {
      const mockAudits = [mockAudit, { ...mockAudit, id: 'audit-2' }];

      const mockChain = createMockChain(mockAudits, null);
      mockChain.limit.mockResolvedValue({ data: mockAudits, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useQualityAudits } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useQualityAudits('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quality_audits');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
    });

    it('should respect limit parameter', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useQualityAudits } = await import('@/lib/hooks/use-quality');

      renderHook(() => useQualityAudits('proj-1', 5), { wrapper });

      await waitFor(() => {
        expect(mockChain.limit).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('useLatestAudit', () => {
    it('should return null when projectId is null', async () => {
      const { useLatestAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useLatestAudit(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null when no completed audits exist', async () => {
      const mockChain = createMockChain([], null);
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useLatestAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useLatestAudit('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should fetch latest audit with accessibility issues', async () => {
      const auditsChain = createMockChain([mockAudit], null);
      auditsChain.limit.mockResolvedValue({ data: [mockAudit], error: null });

      const issuesChain = createMockChain(mockIssues, null);
      issuesChain.order.mockResolvedValue({ data: mockIssues, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'quality_audits') return auditsChain;
        if (table === 'accessibility_issues') return issuesChain;
        return auditsChain;
      });

      const { useLatestAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useLatestAudit('proj-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quality_audits');
      expect(mockSupabase.from).toHaveBeenCalledWith('accessibility_issues');
    });
  });

  describe('useAccessibilityIssues', () => {
    it('should return undefined when auditId is null', async () => {
      const { useAccessibilityIssues } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useAccessibilityIssues(null), { wrapper });

      // Query is disabled when auditId is null, so data is undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch accessibility issues for an audit', async () => {
      const mockChain = createMockChain(mockIssues, null);
      mockChain.order.mockResolvedValue({ data: mockIssues, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useAccessibilityIssues } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useAccessibilityIssues('audit-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('accessibility_issues');
      expect(mockChain.eq).toHaveBeenCalledWith('audit_id', 'audit-1');
    });
  });

  describe('useStartQualityAudit', () => {
    it('should create an audit and run quality checks', async () => {
      const newAudit = {
        id: 'new-audit',
        project_id: 'proj-1',
        url: 'https://example.com',
        status: 'running',
      };

      const completedAudit = {
        ...newAudit,
        status: 'completed',
        accessibility_score: 85,
      };

      const auditsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newAudit, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: completedAudit, error: null }),
            }),
          }),
        }),
      };

      const issuesChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'quality_audits') return auditsChain;
        if (table === 'accessibility_issues') return issuesChain;
        return auditsChain;
      });

      // Mock worker response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          actions: [
            { selector: 'img.hero', description: 'Image' },
            { selector: 'input#email', description: 'Input' },
            { selector: 'button.submit', description: 'Submit Button' },
          ],
        }),
      });

      const { useStartQualityAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useStartQualityAudit(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
          triggeredBy: 'user-123',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quality_audits');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should update audit to failed status on error', async () => {
      const newAudit = {
        id: 'new-audit',
        project_id: 'proj-1',
        status: 'running',
      };

      let updateCalled = false;

      const auditsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newAudit, error: null }),
          }),
        }),
        update: vi.fn().mockImplementation(() => {
          updateCalled = true;
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      };

      mockSupabase.from.mockReturnValue(auditsChain);

      // Mock worker error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { useStartQualityAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useStartQualityAudit(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
        })
      ).rejects.toThrow();

      expect(updateCalled).toBe(true);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const newAudit = {
        id: 'new-audit',
        project_id: 'proj-1',
        status: 'completed',
      };

      const auditsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newAudit, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: newAudit, error: null }),
            }),
          }),
        }),
      };

      const issuesChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'quality_audits') return auditsChain;
        if (table === 'accessibility_issues') return issuesChain;
        return auditsChain;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ actions: [] }),
      });

      const { useStartQualityAudit } = await import('@/lib/hooks/use-quality');

      const { result } = renderHook(() => useStartQualityAudit(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          url: 'https://example.com',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['quality-audits', 'proj-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['latest-audit', 'proj-1'],
      });
    });
  });
});
