/**
 * Tests for lib/hooks/use-invitations.ts
 *
 * Tests the invitation management React Query hooks including:
 * - validateInvitation (standalone function)
 * - useValidateInvitation
 * - useAcceptInvitation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock api-client
const mockAuthenticatedFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  authenticatedFetch: (...args: unknown[]) => mockAuthenticatedFetch(...args),
  BACKEND_URL: 'https://api.example.com',
}));

describe('use-invitations', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // Mock invitation data
  const mockValidInvitation = {
    id: 'inv-123',
    email: 'user@example.com',
    role: 'member' as const,
    organization_id: 'org-456',
    organization_name: 'Acme Corp',
    inviter_email: 'admin@acme.com',
    expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'pending' as const,
  };

  const mockExpiredInvitation = {
    ...mockValidInvitation,
    expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: 'pending' as const,
  };

  const mockAcceptedInvitation = {
    ...mockValidInvitation,
    status: 'accepted' as const,
  };

  const mockRevokedInvitation = {
    ...mockValidInvitation,
    status: 'revoked' as const,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  // ============================================================================
  // validateInvitation function
  // ============================================================================

  describe('validateInvitation', () => {
    it('should return valid result for a valid invitation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidInvitation),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('valid-token-123');

      expect(result).toEqual({
        valid: true,
        invitation: mockValidInvitation,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/invitations/validate/valid-token-123'
      );
    });

    it('should return invalid result for 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Invitation not found' }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('invalid-token');

      expect(result).toEqual({
        valid: false,
        error: 'invalid',
        message: 'Invitation not found',
      });
    });

    it('should return expired result for 410 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 410,
        json: () => Promise.resolve({ detail: 'Invitation has expired' }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('expired-token');

      expect(result).toEqual({
        valid: false,
        error: 'expired',
        message: 'Invitation has expired',
      });
    });

    it('should return expired result when detail contains "expired"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'This invitation has expired and is no longer valid' }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('old-token');

      expect(result).toEqual({
        valid: false,
        error: 'expired',
        message: 'This invitation has expired and is no longer valid',
      });
    });

    it('should return unknown error for other error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Internal server error' }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('some-token');

      expect(result).toEqual({
        valid: false,
        error: 'unknown',
        message: 'Internal server error',
      });
    });

    it('should return default message when response has no detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('bad-token');

      expect(result).toEqual({
        valid: false,
        error: 'invalid',
        message: 'This invitation link is invalid or does not exist.',
      });
    });

    it('should return accepted error when invitation is already accepted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAcceptedInvitation),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('accepted-token');

      expect(result).toEqual({
        valid: false,
        error: 'accepted',
        message: 'This invitation has already been accepted.',
      });
    });

    it('should return expired error when invitation is revoked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRevokedInvitation),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('revoked-token');

      expect(result).toEqual({
        valid: false,
        error: 'expired',
        message: 'This invitation is no longer valid.',
      });
    });

    it('should return expired error when invitation status is expired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockValidInvitation,
            status: 'expired',
          }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('expired-status-token');

      expect(result).toEqual({
        valid: false,
        error: 'expired',
        message: 'This invitation is no longer valid.',
      });
    });

    it('should return expired error when expires_at is in the past', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExpiredInvitation),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('past-date-token');

      expect(result).toEqual({
        valid: false,
        error: 'expired',
        message: 'This invitation has expired.',
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('network-error-token');

      expect(result).toEqual({
        valid: false,
        error: 'unknown',
        message: 'Unable to connect to the server. Please try again later.',
      });
    });

    it('should handle JSON parse errors in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const result = await validateInvitation('json-error-token');

      expect(result).toEqual({
        valid: false,
        error: 'unknown',
        message: 'Unable to validate invitation.',
      });
    });
  });

  // ============================================================================
  // useValidateInvitation hook
  // ============================================================================

  describe('useValidateInvitation', () => {
    it('should not fetch when token is null', async () => {
      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useValidateInvitation(null), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch and return valid invitation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidInvitation),
      });

      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useValidateInvitation('valid-token'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        valid: true,
        invitation: mockValidInvitation,
      });
    });

    it('should fetch and return invalid result for expired invitation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExpiredInvitation),
      });

      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useValidateInvitation('expired-token'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        valid: false,
        error: 'expired',
        message: 'This invitation has expired.',
      });
    });

    it('should not retry on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useValidateInvitation('fail-token'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The hook catches errors and returns a result, so it should succeed
      // with an unknown error result
      expect(result.current.data?.valid).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should use correct query key for caching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidInvitation),
      });

      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      renderHook(() => useValidateInvitation('cache-test-token'), { wrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Check that the data is cached with the right key
      const cachedData = queryClient.getQueryData([
        'invitations',
        'validate',
        'cache-test-token',
      ]);
      expect(cachedData).toBeDefined();
    });
  });

  // ============================================================================
  // useAcceptInvitation hook
  // ============================================================================

  describe('useAcceptInvitation', () => {
    it('should accept an invitation via authenticated endpoint', async () => {
      const mockAcceptResult = {
        success: true,
        organization_id: 'org-456',
        role: 'member',
      };

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAcceptResult),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        const response = await result.current.mutateAsync('accept-token');
        expect(response).toEqual(mockAcceptResult);
      });

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        '/api/v1/invitations/accept/accept-token',
        { method: 'POST' }
      );
    });

    it('should handle acceptance errors', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Invitation already accepted' }),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(result.current.mutateAsync('already-accepted-token')).rejects.toThrow(
        'Invitation already accepted'
      );
    });

    it('should use default error message when detail is not provided', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(result.current.mutateAsync('error-token')).rejects.toThrow(
        'Failed to accept invitation'
      );
    });

    it('should handle JSON parse errors in error response', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(result.current.mutateAsync('json-error-token')).rejects.toThrow(
        'Failed to accept invitation'
      );
    });

    it('should handle network errors', async () => {
      mockAuthenticatedFetch.mockRejectedValueOnce(new Error('Network error'));

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(result.current.mutateAsync('network-error-token')).rejects.toThrow(
        'Network error'
      );
    });

    it('should return parsed response on success', async () => {
      const mockResponse = {
        success: true,
        organization: {
          id: 'org-456',
          name: 'Acme Corp',
        },
        membership: {
          id: 'mem-789',
          role: 'member',
        },
      };

      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        const response = await result.current.mutateAsync('success-token');
        expect(response).toEqual(mockResponse);
      });
    });
  });

  // ============================================================================
  // Edge cases and type safety
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty token string in useValidateInvitation', async () => {
      const { useValidateInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useValidateInvitation(''), { wrapper });

      // Empty string is falsy, so query should be disabled
      expect(result.current.isLoading).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should correctly identify invitation roles', async () => {
      const roles = ['owner', 'admin', 'member', 'viewer'] as const;

      for (const role of roles) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockValidInvitation,
              role,
            }),
        });

        const { validateInvitation } = await import('@/lib/hooks/use-invitations');

        const result = await validateInvitation(`token-${role}`);

        if (result.valid) {
          expect(result.invitation.role).toBe(role);
        }
      }
    });

    it('should handle invitation with all valid statuses', async () => {
      // Test pending status (valid)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockValidInvitation,
            status: 'pending',
          }),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      const pendingResult = await validateInvitation('pending-token');
      expect(pendingResult.valid).toBe(true);

      // Test accepted status (invalid)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockValidInvitation,
            status: 'accepted',
          }),
      });

      const acceptedResult = await validateInvitation('accepted-token');
      expect(acceptedResult.valid).toBe(false);
      if (!acceptedResult.valid) {
        expect(acceptedResult.error).toBe('accepted');
      }

      // Test expired status (invalid)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockValidInvitation,
            status: 'expired',
          }),
      });

      const expiredResult = await validateInvitation('expired-status-token');
      expect(expiredResult.valid).toBe(false);
      if (!expiredResult.valid) {
        expect(expiredResult.error).toBe('expired');
      }

      // Test revoked status (invalid)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockValidInvitation,
            status: 'revoked',
          }),
      });

      const revokedResult = await validateInvitation('revoked-token');
      expect(revokedResult.valid).toBe(false);
      if (!revokedResult.valid) {
        expect(revokedResult.error).toBe('expired');
      }
    });

    it('should properly format the API URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidInvitation),
      });

      const { validateInvitation } = await import('@/lib/hooks/use-invitations');

      await validateInvitation('test-token-abc');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/invitations/validate/test-token-abc'
      );
    });

    it('should use authenticated fetch for accepting invitations', async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { useAcceptInvitation } = await import('@/lib/hooks/use-invitations');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('auth-test-token');
      });

      // Verify authenticatedFetch was used (not regular fetch)
      expect(mockAuthenticatedFetch).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
