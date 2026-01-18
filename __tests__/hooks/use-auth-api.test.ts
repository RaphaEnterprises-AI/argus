/**
 * Tests for lib/hooks/use-auth-api.ts
 *
 * Tests the authentication-related hooks including:
 * - useAuthApi
 * - usePermissions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

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

// Mock auth-api
vi.mock('@/lib/auth-api', () => ({
  createAuthenticatedClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(new Response('{}')),
    post: vi.fn().mockResolvedValue(new Response('{}')),
    put: vi.fn().mockResolvedValue(new Response('{}')),
    patch: vi.fn().mockResolvedValue(new Response('{}')),
    delete: vi.fn().mockResolvedValue(new Response('{}')),
  })),
}));

import { useAuth } from '@clerk/nextjs';

describe('use-auth-api', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isLoaded: true,
      isSignedIn: true,
      userId: 'user-123',
      orgId: 'org-123',
      orgRole: 'org:admin',
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuthApi', () => {
    it('should return auth state and API helpers', async () => {
      const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() => useAuthApi());

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.userId).toBe('user-123');
      expect(result.current.orgId).toBe('org-123');
      expect(result.current.api).toBeDefined();
      expect(result.current.fetchJson).toBeDefined();
      expect(result.current.fetchStream).toBeDefined();
      expect(result.current.getToken).toBeDefined();
      expect(result.current.backendUrl).toBeDefined();
    });

    describe('fetchJson', () => {
      it('should return data on successful response', async () => {
        const mockData = { id: 1, name: 'Test' };
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockData),
        });

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());

        let response: any;
        await act(async () => {
          response = await result.current.fetchJson('/api/test');
        });

        expect(response.data).toEqual(mockData);
        expect(response.error).toBeNull();
        expect(response.status).toBe(200);
      });

      it('should return error on failed response', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Not found'),
        });

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());

        let response: any;
        await act(async () => {
          response = await result.current.fetchJson('/api/test');
        });

        expect(response.data).toBeNull();
        expect(response.error).toBe('Not found');
        expect(response.status).toBe(404);
      });

      it('should return error on network failure', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());

        let response: any;
        await act(async () => {
          response = await result.current.fetchJson('/api/test');
        });

        expect(response.data).toBeNull();
        expect(response.error).toBe('Network error');
        expect(response.status).toBe(0);
      });

      it('should include Authorization header when token is available', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());

        await act(async () => {
          await result.current.fetchJson('/api/test');
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token',
            }),
          })
        );
      });
    });

    describe('fetchStream', () => {
      it('should handle SSE stream correctly', async () => {
        const mockReader = {
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"message":"hello"}\n\n'),
            })
            .mockResolvedValueOnce({ done: true }),
        };

        mockFetch.mockResolvedValue({
          ok: true,
          body: {
            getReader: () => mockReader,
          },
        });

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());
        const onMessage = vi.fn();

        await act(async () => {
          await result.current.fetchStream('/api/stream', { data: 'test' }, onMessage);
        });

        expect(onMessage).toHaveBeenCalledWith('message', { message: 'hello' });
      });

      it('should throw error on failed stream request', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        });

        const { useAuthApi } = await import('@/lib/hooks/use-auth-api');

        const { result } = renderHook(() => useAuthApi());

        await expect(
          result.current.fetchStream('/api/stream', {}, vi.fn())
        ).rejects.toThrow('Stream request failed: 500');
      });
    });
  });

  describe('usePermissions', () => {
    it('should return all permissions for org:admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        orgRole: 'org:admin',
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() =>
        usePermissions(['tests:read', 'tests:write', 'admin:manage'])
      );

      expect(result.current.hasAllPermissions).toBe(true);
      expect(result.current.hasAnyPermission).toBe(true);
      expect(result.current.permissions['tests:read']).toBe(true);
      expect(result.current.permissions['tests:write']).toBe(true);
      expect(result.current.permissions['admin:manage']).toBe(true);
    });

    it('should return limited permissions for org:member', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        orgRole: 'org:member',
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() =>
        usePermissions(['tests:read', 'tests:write', 'admin:manage'])
      );

      expect(result.current.permissions['tests:read']).toBe(true);
      expect(result.current.permissions['tests:write']).toBe(true);
      expect(result.current.permissions['admin:manage']).toBe(false);
      expect(result.current.hasAllPermissions).toBe(false);
      expect(result.current.hasAnyPermission).toBe(true);
    });

    it('should return read-only permissions for org:viewer', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        orgRole: 'org:viewer',
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() =>
        usePermissions(['tests:read', 'tests:write', 'tests:execute'])
      );

      expect(result.current.permissions['tests:read']).toBe(true);
      expect(result.current.permissions['tests:write']).toBe(false);
      expect(result.current.permissions['tests:execute']).toBe(false);
      expect(result.current.hasAllPermissions).toBe(false);
    });

    it('should return false when not signed in', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        orgRole: undefined,
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() => usePermissions(['tests:read']));

      expect(result.current.permissions['tests:read']).toBe(false);
      expect(result.current.hasAllPermissions).toBe(false);
      expect(result.current.hasAnyPermission).toBe(false);
    });

    it('should return false when not loaded', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        orgRole: undefined,
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() => usePermissions(['tests:read']));

      expect(result.current.permissions['tests:read']).toBe(false);
      expect(result.current.isLoaded).toBe(false);
    });

    it('should provide hasPermission helper function', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        orgRole: 'org:admin',
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() => usePermissions([]));

      expect(result.current.hasPermission('tests:read')).toBe(true);
      expect(result.current.hasPermission('any:permission')).toBe(true);
    });

    it('should return role information', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        orgRole: 'org:member',
      } as any);

      const { usePermissions } = await import('@/lib/hooks/use-auth-api');

      const { result } = renderHook(() => usePermissions([]));

      expect(result.current.role).toBe('org:member');
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isSignedIn).toBe(true);
    });
  });
});
