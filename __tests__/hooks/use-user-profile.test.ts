/**
 * Tests for lib/hooks/use-user-profile.ts
 *
 * Tests user profile React hooks including:
 * - useUserProfile
 * - useUserDisplayName
 * - useUserTheme
 * - useUserTimezone
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch
let mockFetch: ReturnType<typeof vi.fn>;

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isLoaded: true,
    isSignedIn: true,
    userId: 'user-123',
    orgId: 'org-123',
    orgRole: 'org:admin',
  })),
}));

// Mock use-auth-api
vi.mock('@/lib/hooks/use-auth-api', () => ({
  useAuthApi: vi.fn(() => ({
    fetchJson: vi.fn(),
    isLoaded: true,
    isSignedIn: true,
    userId: 'user-123',
  })),
}));

import { useAuthApi } from '@/lib/hooks/use-auth-api';

describe('use-user-profile', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const mockProfile = {
    id: 'user-123',
    display_name: 'John Doe',
    email: 'john@example.com',
    bio: 'A test user',
    avatar_url: 'https://example.com/avatar.png',
    timezone: 'America/New_York',
    language: 'en',
    theme: 'dark' as const,
    default_organization_id: 'org-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  };

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

    // Reset the mock for useAuthApi
    vi.mocked(useAuthApi).mockReturnValue({
      fetchJson: vi.fn().mockResolvedValue({ data: mockProfile, error: null, status: 200 }),
      isLoaded: true,
      isSignedIn: true,
      userId: 'user-123',
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useUserProfile', () => {
    it('should return loading state when auth is not loaded', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: vi.fn(),
        isLoaded: false,
        isSignedIn: false,
        userId: null,
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.profile).toBe(null);
    });

    it('should fetch user profile on mount', async () => {
      const mockFetchJson = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
        status: 200,
      });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me');
    });

    it('should handle fetch error', async () => {
      const mockFetchJson = vi.fn().mockResolvedValue({
        data: null,
        error: 'Failed to fetch profile',
        status: 500,
      });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch profile');
      });
    });

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, display_name: 'Jane Doe' };
      const mockFetchJson = vi
        .fn()
        .mockResolvedValueOnce({ data: mockProfile, error: null, status: 200 })
        .mockResolvedValueOnce({ data: updatedProfile, error: null, status: 200 });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProfile({ display_name: 'Jane Doe' });
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ display_name: 'Jane Doe' }),
      });
    });

    it('should handle update error', async () => {
      const mockFetchJson = vi
        .fn()
        .mockResolvedValueOnce({ data: mockProfile, error: null, status: 200 })
        .mockResolvedValueOnce({ data: null, error: 'Update failed', status: 400 });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.updateProfile({ display_name: 'Jane Doe' })
      ).rejects.toThrow('Update failed');
    });

    it('should provide isUpdating state during update', async () => {
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      const mockFetchJson = vi
        .fn()
        .mockResolvedValueOnce({ data: mockProfile, error: null, status: 200 })
        .mockReturnValueOnce(updatePromise);

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start update (don't await)
      act(() => {
        result.current.updateProfile({ display_name: 'Jane Doe' });
      });

      // Check isUpdating is true
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      // Resolve the update
      await act(async () => {
        resolveUpdate!({ data: { ...mockProfile, display_name: 'Jane Doe' }, error: null });
      });

      // Wait for update to complete
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it('should not fetch when not signed in', async () => {
      const mockFetchJson = vi.fn();

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: false,
        userId: null,
      } as any);

      const { useUserProfile } = await import('@/lib/hooks/use-user-profile');

      renderHook(() => useUserProfile(), { wrapper });

      // Should not make any API calls
      expect(mockFetchJson).not.toHaveBeenCalled();
    });
  });

  describe('useUserDisplayName', () => {
    it('should return display name from profile', async () => {
      const mockFetchJson = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
        status: 200,
      });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserDisplayName } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserDisplayName(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.displayName).toBe('John Doe');
    });

    it('should return null when profile is not loaded', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: vi.fn(),
        isLoaded: false,
        isSignedIn: false,
        userId: null,
      } as any);

      const { useUserDisplayName } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserDisplayName(), { wrapper });

      expect(result.current.displayName).toBe(null);
      expect(result.current.loading).toBe(true);
    });
  });

  describe('useUserTheme', () => {
    it('should return theme from profile', async () => {
      const mockFetchJson = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
        status: 200,
      });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserTheme } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should default to system theme when profile is not loaded', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: vi.fn(),
        isLoaded: false,
        isSignedIn: false,
        userId: null,
      } as any);

      const { useUserTheme } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
    });

    it('should provide setTheme function', async () => {
      const updatedProfile = { ...mockProfile, theme: 'light' as const };
      const mockFetchJson = vi
        .fn()
        .mockResolvedValueOnce({ data: mockProfile, error: null, status: 200 })
        .mockResolvedValueOnce({ data: updatedProfile, error: null, status: 200 });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserTheme } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ theme: 'light' }),
      });
    });
  });

  describe('useUserTimezone', () => {
    it('should return timezone from profile', async () => {
      const mockFetchJson = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
        status: 200,
      });

      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: true,
        userId: 'user-123',
      } as any);

      const { useUserTimezone } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserTimezone(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.timezone).toBe('America/New_York');
    });

    it('should default to browser timezone when profile is not loaded', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: vi.fn(),
        isLoaded: false,
        isSignedIn: false,
        userId: null,
      } as any);

      const { useUserTimezone } = await import('@/lib/hooks/use-user-profile');

      const { result } = renderHook(() => useUserTimezone(), { wrapper });

      // Should return the browser's timezone
      expect(typeof result.current.timezone).toBe('string');
      expect(result.current.timezone.length).toBeGreaterThan(0);
    });
  });
});
