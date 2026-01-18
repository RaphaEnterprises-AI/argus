/**
 * Tests for lib/hooks/use-user-settings.ts
 *
 * Tests user settings/preferences React Query hooks including:
 * - useUserSettings
 * - useNotificationPreferences
 * - useTestDefaults
 * - useNotificationEnabled
 * - useToggleNotification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useAuthApi hook
const mockFetchJson = vi.fn();
const mockGetToken = vi.fn();

vi.mock('@/lib/hooks/use-auth-api', () => ({
  useAuthApi: vi.fn(() => ({
    fetchJson: mockFetchJson,
    isLoaded: true,
    isSignedIn: true,
    getToken: mockGetToken,
  })),
}));

// Import after mocking
import { useAuthApi } from '@/lib/hooks/use-auth-api';

describe('use-user-settings', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const mockUserProfile = {
    id: 'profile-1',
    user_id: 'user-123',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    timezone: 'America/New_York',
    language: 'en',
    theme: 'dark' as const,
    notification_preferences: {
      email_notifications: true,
      email_test_failures: true,
      email_test_completions: true,
      email_weekly_digest: false,
      slack_notifications: true,
      slack_test_failures: true,
      slack_test_completions: false,
      in_app_notifications: true,
      in_app_test_failures: true,
      in_app_test_completions: true,
      test_failure_alerts: true,
      daily_digest: true,
      weekly_report: false,
      alert_threshold: 90,
    },
    default_organization_id: 'org-123',
    default_project_id: 'proj-123',
    onboarding_completed: true,
    onboarding_step: null,
    last_login_at: '2024-01-15T10:00:00Z',
    last_active_at: '2024-01-15T12:00:00Z',
    login_count: 42,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  };

  const defaultNotificationPrefs = {
    email_notifications: true,
    email_test_failures: true,
    email_test_completions: false,
    email_weekly_digest: true,
    slack_notifications: false,
    slack_test_failures: false,
    slack_test_completions: false,
    in_app_notifications: true,
    in_app_test_failures: true,
    in_app_test_completions: true,
    test_failure_alerts: true,
    daily_digest: false,
    weekly_report: true,
    alert_threshold: 80,
  };

  const defaultTestDefaults = {
    default_browser: 'chromium' as const,
    default_timeout: 30000,
    parallel_execution: true,
    retry_failed_tests: true,
    max_retries: 2,
    screenshot_on_failure: true,
    video_recording: false,
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
    vi.mocked(useAuthApi).mockReturnValue({
      fetchJson: mockFetchJson,
      isLoaded: true,
      isSignedIn: true,
      getToken: mockGetToken,
      api: {} as any,
      fetchStream: vi.fn(),
      userId: 'user-123',
      orgId: 'org-123',
      backendUrl: 'http://localhost:8000',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useUserSettings', () => {
    it('should fetch user settings when signed in', async () => {
      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me');
      expect(result.current.profile).toEqual(mockUserProfile);
      expect(result.current.settings.notifications.email_notifications).toBe(true);
      expect(result.current.settings.notifications.alert_threshold).toBe(90);
    });

    it('should not fetch when not signed in', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: true,
        isSignedIn: false,
        getToken: mockGetToken,
        api: {} as any,
        fetchStream: vi.fn(),
        userId: null,
        orgId: null,
        backendUrl: 'http://localhost:8000',
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockFetchJson).not.toHaveBeenCalled();
    });

    it('should not fetch when auth is not loaded', async () => {
      vi.mocked(useAuthApi).mockReturnValue({
        fetchJson: mockFetchJson,
        isLoaded: false,
        isSignedIn: false,
        getToken: mockGetToken,
        api: {} as any,
        fetchStream: vi.fn(),
        userId: null,
        orgId: null,
        backendUrl: 'http://localhost:8000',
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockFetchJson).not.toHaveBeenCalled();
    });

    it('should merge notification preferences with defaults', async () => {
      // Partial notification preferences from backend
      const partialProfile = {
        ...mockUserProfile,
        notification_preferences: {
          email_notifications: false,
          slack_notifications: true,
        },
      };

      mockFetchJson.mockResolvedValue({
        data: partialProfile,
        error: null,
        status: 200,
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Overridden values
      expect(result.current.settings.notifications.email_notifications).toBe(false);
      expect(result.current.settings.notifications.slack_notifications).toBe(true);
      // Default values (not provided by backend)
      expect(result.current.settings.notifications.email_test_failures).toBe(true);
      expect(result.current.settings.notifications.alert_threshold).toBe(80);
    });

    it('should handle API errors', async () => {
      mockFetchJson.mockResolvedValue({
        data: null,
        error: 'Unauthorized',
        status: 401,
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The hook throws an error when response.error is set
      // React Query catches it and sets result.current.error
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should update notification preferences', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockUserProfile,
            notification_preferences: {
              ...mockUserProfile.notification_preferences,
              email_notifications: false,
            },
          },
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.updateNotificationPreferences({ email_notifications: false });
      });

      await waitFor(() => {
        expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
          method: 'PUT',
          body: JSON.stringify({ email_notifications: false }),
        });
      });
    });

    it('should update test defaults', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.updateTestDefaults({ default_browser: 'firefox' });
      });

      await waitFor(() => {
        expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/test-defaults', {
          method: 'PUT',
          body: JSON.stringify({ default_browser: 'firefox' }),
        });
      });
    });

    it('should update both notification and test defaults with updatePreferences', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePreferences({
          notifications: { email_notifications: false },
          test_defaults: { default_browser: 'webkit' },
        });
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ email_notifications: false }),
      });
      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/test-defaults', {
        method: 'PUT',
        body: JSON.stringify({ default_browser: 'webkit' }),
      });
    });

    it('should handle notification update errors', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: null,
          error: 'Update failed',
          status: 500,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateNotificationPreferencesAsync({ email_notifications: false });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.updateNotificationsError).toBeDefined();
      });
    });

    it('should provide convenience updateNotificationPreference method', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateNotificationPreference('slack_notifications', true);
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ slack_notifications: true }),
      });
    });

    it('should provide convenience updateTestDefault method', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateTestDefault('max_retries', 5);
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/test-defaults', {
        method: 'PUT',
        body: JSON.stringify({ max_retries: 5 }),
      });
    });

    it('should update cache on successful mutation', async () => {
      const updatedProfile = {
        ...mockUserProfile,
        notification_preferences: {
          ...mockUserProfile.notification_preferences,
          email_notifications: false,
        },
      };

      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: updatedProfile,
          error: null,
          status: 200,
        });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateNotificationPreferencesAsync({ email_notifications: false });
      });

      // Check cache was updated
      const cachedData = queryClient.getQueryData(['user-settings']);
      expect(cachedData).toEqual(updatedProfile);
    });

    it('should return default test defaults (not from backend)', async () => {
      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test defaults should be the defaults (not from profile since backend doesn't support yet)
      expect(result.current.testDefaults).toEqual(defaultTestDefaults);
    });

    it('should show isUpdating when mutations are pending', async () => {
      mockFetchJson
        .mockResolvedValueOnce({
          data: mockUserProfile,
          error: null,
          status: 200,
        })
        .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      const { useUserSettings } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateNotificationPreferences({ email_notifications: false });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });
    });
  });

  describe('useNotificationPreferences', () => {
    it('should return notification preferences from useUserSettings', async () => {
      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useNotificationPreferences } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useNotificationPreferences(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preferences.email_notifications).toBe(true);
      expect(result.current.preferences.slack_notifications).toBe(true);
      expect(result.current.updatePreferences).toBeDefined();
    });
  });

  describe('useTestDefaults', () => {
    it('should return test defaults from useUserSettings', async () => {
      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useTestDefaults } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useTestDefaults(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.defaults.default_browser).toBe('chromium');
      expect(result.current.defaults.default_timeout).toBe(30000);
      expect(result.current.updateDefaults).toBeDefined();
    });
  });

  describe('useNotificationEnabled', () => {
    it('should return true for enabled notification types', async () => {
      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useNotificationEnabled } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useNotificationEnabled('email_notifications'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should return false for disabled notification types', async () => {
      mockFetchJson.mockResolvedValue({
        data: {
          ...mockUserProfile,
          notification_preferences: {
            ...mockUserProfile.notification_preferences,
            email_notifications: false,
          },
        },
        error: null,
        status: 200,
      });

      const { useNotificationEnabled } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useNotificationEnabled('email_notifications'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should return default value while loading', async () => {
      // Never resolve
      mockFetchJson.mockImplementation(() => new Promise(() => {}));

      const { useNotificationEnabled } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useNotificationEnabled('email_notifications'), {
        wrapper,
      });

      // Should return default (true for email_notifications)
      expect(result.current).toBe(true);
    });

    it('should return default for slack_notifications while loading', async () => {
      mockFetchJson.mockImplementation(() => new Promise(() => {}));

      const { useNotificationEnabled } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useNotificationEnabled('slack_notifications'), {
        wrapper,
      });

      // slack_notifications default is false
      expect(result.current).toBe(false);
    });
  });

  describe('useToggleNotification', () => {
    it('should toggle notification preference', async () => {
      mockFetchJson.mockResolvedValue({
        data: {
          ...mockUserProfile,
          notification_preferences: {
            ...mockUserProfile.notification_preferences,
            slack_notifications: true,
          },
        },
        error: null,
        status: 200,
      });

      const { useToggleNotification } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useToggleNotification('slack_notifications'), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(true);
      });

      expect(mockFetchJson).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ slack_notifications: true }),
      });
    });

    it('should perform optimistic update', async () => {
      // Set initial cache
      const initialProfile = { ...mockUserProfile };
      queryClient.setQueryData(['user-settings'], initialProfile);

      // Never resolve the mutation to check optimistic update
      mockFetchJson.mockImplementation(() => new Promise(() => {}));

      const { useToggleNotification } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useToggleNotification('email_notifications'), {
        wrapper,
      });

      act(() => {
        result.current.mutate(false);
      });

      // Check that cache was optimistically updated
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<typeof mockUserProfile>(['user-settings']);
        expect(cachedData?.notification_preferences.email_notifications).toBe(false);
      });
    });

    it('should rollback on error', async () => {
      // Set initial cache
      const initialProfile = {
        ...mockUserProfile,
        notification_preferences: {
          ...mockUserProfile.notification_preferences,
          email_notifications: true,
        },
      };
      queryClient.setQueryData(['user-settings'], initialProfile);

      mockFetchJson.mockResolvedValue({
        data: null,
        error: 'Server error',
        status: 500,
      });

      const { useToggleNotification } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useToggleNotification('email_notifications'), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(false);
        } catch {
          // Expected error
        }
      });

      // Cache should be rolled back to original value
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<typeof mockUserProfile>(['user-settings']);
        expect(cachedData?.notification_preferences.email_notifications).toBe(true);
      });
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockFetchJson.mockResolvedValue({
        data: mockUserProfile,
        error: null,
        status: 200,
      });

      const { useToggleNotification } = await import('@/lib/hooks/use-user-settings');

      const { result } = renderHook(() => useToggleNotification('daily_digest'), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['user-settings'] });
    });
  });
});
