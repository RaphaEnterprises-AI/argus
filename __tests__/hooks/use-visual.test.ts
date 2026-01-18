/**
 * Tests for lib/hooks/use-visual.ts
 *
 * Tests visual testing React Query hooks including:
 * - useVisualBaselines
 * - useVisualComparisons
 * - useVisualComparison
 * - useApproveComparison
 * - useRunVisualTest
 * - useUpdateBaseline
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

// Mock fetch for worker API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock canvas for image comparison
const mockCanvasContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCanvasContext),
  toDataURL: vi.fn(() => 'data:image/png;base64,mockDiffData'),
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName);
});

// Mock Image constructor
class MockImage {
  width = 100;
  height = 100;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}
global.Image = MockImage as unknown as typeof Image;

describe('use-visual', () => {
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
      limit: vi.fn().mockImplementation(() => chain),
      single: vi.fn().mockResolvedValue(mockResult),
      insert: vi.fn().mockImplementation(() => chain),
      update: vi.fn().mockImplementation(() => chain),
      then: (cb: any) => Promise.resolve(mockResult).then(cb),
    };
    return chain;
  };

  const mockBaselines = [
    {
      id: 'baseline-1',
      project_id: 'proj-123',
      name: 'homepage',
      page_url: 'https://example.com/',
      viewport: '1920x1080',
      screenshot_url: 'data:image/png;base64,baseline1',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'baseline-2',
      project_id: 'proj-123',
      name: 'about',
      page_url: 'https://example.com/about',
      viewport: '1920x1080',
      screenshot_url: 'data:image/png;base64,baseline2',
      is_active: true,
      created_at: '2024-01-14T00:00:00Z',
      updated_at: '2024-01-14T00:00:00Z',
    },
  ];

  const mockComparisons = [
    {
      id: 'comp-1',
      project_id: 'proj-123',
      baseline_id: 'baseline-1',
      name: 'homepage',
      status: 'mismatch',
      match_percentage: 95.5,
      difference_count: 450,
      baseline_url: 'data:image/png;base64,baseline1',
      current_url: 'data:image/png;base64,current1',
      diff_url: 'data:image/png;base64,diff1',
      threshold: 0.1,
      approved_by: null,
      approved_at: null,
      created_at: '2024-01-15T12:00:00Z',
    },
    {
      id: 'comp-2',
      project_id: 'proj-123',
      baseline_id: 'baseline-2',
      name: 'about',
      status: 'match',
      match_percentage: 99.9,
      difference_count: 10,
      baseline_url: 'data:image/png;base64,baseline2',
      current_url: 'data:image/png;base64,current2',
      diff_url: null,
      threshold: 0.1,
      approved_by: null,
      approved_at: null,
      created_at: '2024-01-15T11:00:00Z',
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

    // Reset mocks
    vi.clearAllMocks();

    // Setup default image data for canvas mock
    mockCanvasContext.getImageData.mockReturnValue({
      data: new Uint8ClampedArray(100 * 100 * 4).fill(255),
      width: 100,
      height: 100,
    });
    mockCanvasContext.createImageData.mockReturnValue({
      data: new Uint8ClampedArray(100 * 100 * 4).fill(0),
      width: 100,
      height: 100,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useVisualBaselines', () => {
    it('should fetch baselines for a project', async () => {
      const mockChain = createMockChain(mockBaselines, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualBaselines } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualBaselines('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visual_baselines');
      expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-123');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.current.data).toEqual(mockBaselines);
    });

    it('should return empty array when projectId is null', async () => {
      const { useVisualBaselines } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualBaselines(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const mockChain = createMockChain(null, new Error('Database error'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualBaselines } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualBaselines('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useVisualComparisons', () => {
    it('should fetch comparisons for a project with default limit', async () => {
      const mockChain = createMockChain(mockComparisons, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualComparisons } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparisons('proj-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visual_comparisons');
      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(result.current.data).toEqual(mockComparisons);
    });

    it('should fetch comparisons with custom limit', async () => {
      const mockChain = createMockChain(mockComparisons.slice(0, 1), null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualComparisons } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparisons('proj-123', 1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('should return empty when projectId is null', async () => {
      const { useVisualComparisons } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparisons(null), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useVisualComparison', () => {
    it('should fetch single comparison by id', async () => {
      const mockChain = createMockChain(mockComparisons[0], null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparison('comp-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visual_comparisons');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'comp-1');
      expect(mockChain.single).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockComparisons[0]);
    });

    it('should return null when comparisonId is null', async () => {
      const { useVisualComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparison(null), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const mockChain = createMockChain(null, new Error('Not found'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useVisualComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useVisualComparison('comp-invalid'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useApproveComparison', () => {
    it('should approve a comparison', async () => {
      const approvedComparison = {
        ...mockComparisons[0],
        status: 'match',
        approved_by: 'user-123',
        approved_at: expect.any(String),
      };

      const mockChain = createMockChain(approvedComparison, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useApproveComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useApproveComparison(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
          approvedBy: 'user-123',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('visual_comparisons');
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'match',
        approved_by: 'user-123',
        approved_at: expect.any(String),
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'comp-1');
    });

    it('should approve without approvedBy', async () => {
      const approvedComparison = {
        ...mockComparisons[0],
        status: 'match',
        approved_by: null,
        approved_at: expect.any(String),
      };

      const mockChain = createMockChain(approvedComparison, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useApproveComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useApproveComparison(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'match',
        approved_by: null,
        approved_at: expect.any(String),
      });
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain({ ...mockComparisons[0], status: 'match' }, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useApproveComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useApproveComparison(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-comparisons', 'proj-123'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-comparison', 'comp-1'],
      });
    });

    it('should handle approval errors', async () => {
      const mockChain = createMockChain(null, new Error('Update failed'));
      mockSupabase.from.mockReturnValue(mockChain);

      const { useApproveComparison } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useApproveComparison(), { wrapper });

      await expect(
        result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('useRunVisualTest', () => {
    it('should run visual test and create new baseline when none exists', async () => {
      // Mock worker response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            browsers: [{ screenshot: 'mockScreenshotBase64' }],
          }),
      });

      // First query - check for existing baseline (none)
      const emptyChain = createMockChain([], null);
      // Second query - insert baseline
      const newBaseline = {
        id: 'new-baseline-1',
        project_id: 'proj-123',
        name: 'homepage',
        page_url: 'https://example.com/',
        viewport: '1920x1080',
        screenshot_url: 'data:image/png;base64,mockScreenshotBase64',
        is_active: true,
      };
      const insertBaselineChain = createMockChain(newBaseline, null);
      // Third query - insert comparison
      const newComparison = {
        id: 'new-comp-1',
        project_id: 'proj-123',
        baseline_id: 'new-baseline-1',
        status: 'new',
        match_percentage: 100,
      };
      const insertCompChain = createMockChain(newComparison, null);

      mockSupabase.from
        .mockReturnValueOnce(emptyChain) // Check for baseline
        .mockReturnValueOnce(insertBaselineChain) // Insert baseline
        .mockReturnValueOnce(insertCompChain); // Insert comparison

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        const testResult = await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
        });

        expect(testResult.isNew).toBe(true);
        expect(testResult.baseline).toEqual(newBaseline);
        expect(testResult.comparison.status).toBe('new');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should run visual test with existing baseline and detect match', async () => {
      // Mock worker response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            browsers: [{ screenshot: 'data:image/png;base64,currentScreenshot' }],
          }),
      });

      // Setup canvas to return 100% matching pixels
      mockCanvasContext.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(255),
        width: 100,
        height: 100,
      });

      // First query - check for existing baseline (found)
      const existingBaseline = {
        id: 'baseline-1',
        project_id: 'proj-123',
        page_url: 'https://example.com/',
        viewport: '1920x1080',
        screenshot_url: 'data:image/png;base64,baselineScreenshot',
        is_active: true,
      };
      const findBaselineChain = createMockChain([existingBaseline], null);
      // Second query - insert comparison
      const newComparison = {
        id: 'new-comp-1',
        project_id: 'proj-123',
        baseline_id: 'baseline-1',
        status: 'match',
        match_percentage: 100,
      };
      const insertCompChain = createMockChain(newComparison, null);

      mockSupabase.from
        .mockReturnValueOnce(findBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        const testResult = await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
          viewport: '1920x1080',
          threshold: 0.1,
        });

        expect(testResult.isNew).toBe(false);
        expect(testResult.baseline).toEqual(existingBaseline);
      });
    });

    it('should detect mismatch when screenshots differ', async () => {
      // Mock worker response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            screenshot: 'data:image/png;base64,differentScreenshot',
          }),
      });

      // Setup canvas to return different pixel data
      const baseData = new Uint8ClampedArray(100 * 100 * 4);
      const currData = new Uint8ClampedArray(100 * 100 * 4);
      // Fill with different values to simulate mismatch
      for (let i = 0; i < baseData.length; i += 4) {
        baseData[i] = 255; // Red
        baseData[i + 1] = 255;
        baseData[i + 2] = 255;
        baseData[i + 3] = 255;
        currData[i] = 0; // Different color
        currData[i + 1] = 0;
        currData[i + 2] = 0;
        currData[i + 3] = 255;
      }

      let callCount = 0;
      mockCanvasContext.getImageData.mockImplementation(() => {
        callCount++;
        return {
          data: callCount === 1 ? baseData : currData,
          width: 100,
          height: 100,
        };
      });

      // First query - check for existing baseline (found)
      const existingBaseline = {
        id: 'baseline-1',
        project_id: 'proj-123',
        page_url: 'https://example.com/',
        viewport: '1920x1080',
        screenshot_url: 'data:image/png;base64,baselineScreenshot',
        is_active: true,
      };
      const findBaselineChain = createMockChain([existingBaseline], null);
      // Second query - insert comparison with mismatch
      const newComparison = {
        id: 'new-comp-1',
        project_id: 'proj-123',
        baseline_id: 'baseline-1',
        status: 'mismatch',
        match_percentage: 0,
      };
      const insertCompChain = createMockChain(newComparison, null);

      mockSupabase.from
        .mockReturnValueOnce(findBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        const testResult = await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
        });

        expect(testResult.comparison.status).toBe('mismatch');
      });
    });

    it('should handle worker API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
        })
      ).rejects.toThrow('Worker returned 500: Internal server error');
    });

    it('should handle missing screenshot in worker response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await expect(
        result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
        })
      ).rejects.toThrow('No screenshot captured');
    });

    it('should generate test name from URL when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            screenshot: 'mockScreenshot',
          }),
      });

      const emptyChain = createMockChain([], null);
      const insertBaselineChain = createMockChain(
        { id: 'baseline-1', name: 'about-page' },
        null
      );
      const insertCompChain = createMockChain({ id: 'comp-1', project_id: 'proj-123' }, null);

      mockSupabase.from
        .mockReturnValueOnce(emptyChain)
        .mockReturnValueOnce(insertBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/about-page',
        });
      });

      // Verify that name was generated from URL path
      expect(insertBaselineChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'about-page',
        })
      );
    });

    it('should use custom name when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            screenshot: 'mockScreenshot',
          }),
      });

      const emptyChain = createMockChain([], null);
      const insertBaselineChain = createMockChain(
        { id: 'baseline-1', name: 'My Custom Test' },
        null
      );
      const insertCompChain = createMockChain({ id: 'comp-1', project_id: 'proj-123' }, null);

      mockSupabase.from
        .mockReturnValueOnce(emptyChain)
        .mockReturnValueOnce(insertBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
          name: 'My Custom Test',
        });
      });

      expect(insertBaselineChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Custom Test',
        })
      );
    });

    it('should set device type based on viewport width', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            screenshot: 'mockScreenshot',
          }),
      });

      const emptyChain = createMockChain([], null);
      const insertBaselineChain = createMockChain({ id: 'baseline-1' }, null);
      const insertCompChain = createMockChain({ id: 'comp-1', project_id: 'proj-123' }, null);

      mockSupabase.from
        .mockReturnValueOnce(emptyChain)
        .mockReturnValueOnce(insertBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
          viewport: '375x667', // Mobile viewport
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"device":"mobile"'),
        })
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            screenshot: 'mockScreenshot',
          }),
      });

      const emptyChain = createMockChain([], null);
      const insertBaselineChain = createMockChain(
        { id: 'baseline-1', project_id: 'proj-123' },
        null
      );
      const insertCompChain = createMockChain(
        { id: 'comp-1', project_id: 'proj-123' },
        null
      );

      mockSupabase.from
        .mockReturnValueOnce(emptyChain)
        .mockReturnValueOnce(insertBaselineChain)
        .mockReturnValueOnce(insertCompChain);

      const { useRunVisualTest } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useRunVisualTest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-123',
          url: 'https://example.com/',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-baselines', 'proj-123'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-comparisons', 'proj-123'],
      });
    });
  });

  describe('useUpdateBaseline', () => {
    it('should update baseline with current screenshot from comparison', async () => {
      const comparison = {
        id: 'comp-1',
        baseline_id: 'baseline-1',
        current_url: 'data:image/png;base64,newScreenshot',
      };

      const findCompChain = createMockChain(comparison, null);
      const updateBaselineChain = createMockChain(null, null);
      const updateCompChain = createMockChain(
        { ...comparison, status: 'match' },
        null
      );

      mockSupabase.from
        .mockReturnValueOnce(findCompChain)
        .mockReturnValueOnce(updateBaselineChain)
        .mockReturnValueOnce(updateCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await act(async () => {
        const updateResult = await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });

        expect(updateResult.comparison.status).toBe('match');
      });

      // Verify baseline was updated with current screenshot
      expect(updateBaselineChain.update).toHaveBeenCalledWith({
        screenshot_url: 'data:image/png;base64,newScreenshot',
      });
      expect(updateBaselineChain.eq).toHaveBeenCalledWith('id', 'baseline-1');
    });

    it('should mark comparison as approved', async () => {
      const comparison = {
        id: 'comp-1',
        baseline_id: 'baseline-1',
        current_url: 'data:image/png;base64,newScreenshot',
      };

      const findCompChain = createMockChain(comparison, null);
      const updateBaselineChain = createMockChain(null, null);
      const updateCompChain = createMockChain(
        { ...comparison, status: 'match', approved_at: expect.any(String) },
        null
      );

      mockSupabase.from
        .mockReturnValueOnce(findCompChain)
        .mockReturnValueOnce(updateBaselineChain)
        .mockReturnValueOnce(updateCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });
      });

      expect(updateCompChain.update).toHaveBeenCalledWith({
        status: 'match',
        approved_at: expect.any(String),
      });
    });

    it('should handle comparison not found', async () => {
      const findCompChain = createMockChain(null, new Error('Not found'));
      mockSupabase.from.mockReturnValueOnce(findCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await expect(
        result.current.mutateAsync({
          comparisonId: 'invalid-comp',
          projectId: 'proj-123',
        })
      ).rejects.toThrow();
    });

    it('should handle comparison without baseline_id', async () => {
      // Comparison exists but has no baseline_id (edge case)
      const comparison = {
        id: 'comp-1',
        baseline_id: null, // No baseline
        current_url: 'data:image/png;base64,newScreenshot',
      };

      const findCompChain = createMockChain(comparison, null);
      // Skip baseline update (since baseline_id is null)
      const updateCompChain = createMockChain(
        { ...comparison, status: 'match' },
        null
      );

      mockSupabase.from
        .mockReturnValueOnce(findCompChain)
        .mockReturnValueOnce(updateCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });
      });

      // Should only have called from twice (find + update comparison)
      // Baseline update was skipped
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const comparison = {
        id: 'comp-1',
        baseline_id: 'baseline-1',
        current_url: 'data:image/png;base64,newScreenshot',
      };

      const findCompChain = createMockChain(comparison, null);
      const updateBaselineChain = createMockChain(null, null);
      const updateCompChain = createMockChain(
        { ...comparison, status: 'match' },
        null
      );

      mockSupabase.from
        .mockReturnValueOnce(findCompChain)
        .mockReturnValueOnce(updateBaselineChain)
        .mockReturnValueOnce(updateCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-baselines', 'proj-123'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-comparisons', 'proj-123'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['visual-comparison', 'comp-1'],
      });
    });

    it('should handle update errors', async () => {
      const comparison = {
        id: 'comp-1',
        baseline_id: 'baseline-1',
        current_url: 'data:image/png;base64,newScreenshot',
      };

      const findCompChain = createMockChain(comparison, null);
      const updateBaselineChain = createMockChain(null, null);
      const updateCompChain = createMockChain(null, new Error('Update failed'));

      mockSupabase.from
        .mockReturnValueOnce(findCompChain)
        .mockReturnValueOnce(updateBaselineChain)
        .mockReturnValueOnce(updateCompChain);

      const { useUpdateBaseline } = await import('@/lib/hooks/use-visual');

      const { result } = renderHook(() => useUpdateBaseline(), { wrapper });

      await expect(
        result.current.mutateAsync({
          comparisonId: 'comp-1',
          projectId: 'proj-123',
        })
      ).rejects.toThrow('Update failed');
    });
  });
});
