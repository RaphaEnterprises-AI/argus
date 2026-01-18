/**
 * Tests for lib/hooks/use-team.ts
 *
 * Tests team management React Query hooks including:
 * - useOrganizationDetails
 * - useMembers
 * - usePendingInvitations
 * - useInviteMember
 * - useRemoveMember
 * - useChangeMemberRole
 * - useResendInvitation
 * - useRevokeInvitation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

describe('use-team', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    plan: 'pro',
    member_count: 5,
  };

  const mockMembers = [
    {
      id: 'member-1',
      email: 'owner@example.com',
      role: 'owner' as const,
      status: 'active' as const,
      accepted_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'member-2',
      email: 'admin@example.com',
      role: 'admin' as const,
      status: 'active' as const,
      accepted_at: '2024-01-05T00:00:00Z',
    },
    {
      id: 'member-3',
      email: 'member@example.com',
      role: 'member' as const,
      status: 'pending' as const,
      invited_at: '2024-01-10T00:00:00Z',
    },
  ];

  const mockInvitations = [
    {
      id: 'inv-1',
      email: 'newuser@example.com',
      role: 'member' as const,
      invited_at: '2024-01-15T00:00:00Z',
      expires_at: '2024-01-22T00:00:00Z',
      inviter_email: 'owner@example.com',
      status: 'pending',
    },
    {
      id: 'inv-2',
      email: 'viewer@example.com',
      role: 'viewer' as const,
      invited_at: '2024-01-14T00:00:00Z',
      expires_at: '2024-01-21T00:00:00Z',
      status: 'pending',
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useOrganizationDetails', () => {
    it('should fetch organization details', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrganization);

      const { useOrganizationDetails } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useOrganizationDetails('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/teams/organizations/org-123');
      expect(result.current.data?.name).toBe('Test Organization');
    });

    it('should not fetch when orgId is empty', async () => {
      const { useOrganizationDetails } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useOrganizationDetails(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useMembers', () => {
    it('should fetch organization members', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ members: mockMembers });

      const { useMembers } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useMembers('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/teams/organizations/org-123/members');
      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].email).toBe('owner@example.com');
    });

    it('should handle empty members array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ members: [] });

      const { useMembers } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useMembers('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle missing members key', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({});

      const { useMembers } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useMembers('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('usePendingInvitations', () => {
    it('should fetch pending invitations', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ invitations: mockInvitations });

      const { usePendingInvitations } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => usePendingInvitations('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/invitations/organizations/org-123/invitations');
      expect(result.current.data).toHaveLength(2);
    });

    it('should filter to only pending invitations', async () => {
      const allInvitations = [
        ...mockInvitations,
        { ...mockInvitations[0], id: 'inv-3', status: 'accepted' },
        { ...mockInvitations[0], id: 'inv-4', status: 'expired' },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ invitations: allInvitations });

      const { usePendingInvitations } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => usePendingInvitations('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it('should handle array response format', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvitations);

      const { usePendingInvitations } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => usePendingInvitations('org-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('useInviteMember', () => {
    it('should invite a new member', async () => {
      const newMember = {
        id: 'member-new',
        email: 'new@example.com',
        role: 'member' as const,
        status: 'pending' as const,
      };
      vi.mocked(apiClient.post).mockResolvedValue(newMember);

      const { useInviteMember } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useInviteMember('org-123'), { wrapper });

      await act(async () => {
        const invited = await result.current.mutateAsync({
          email: 'new@example.com',
          role: 'member',
        });
        expect(invited.email).toBe('new@example.com');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/teams/organizations/org-123/members/invite',
        { email: 'new@example.com', role: 'member' }
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'new-member' });

      const { useInviteMember } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useInviteMember('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ email: 'test@example.com', role: 'member' });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'members', 'org-123'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'invitations', 'org-123'],
      });
    });
  });

  describe('useRemoveMember', () => {
    it('should remove a member', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useRemoveMember } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useRemoveMember('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('member-2');
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/v1/teams/organizations/org-123/members/member-2'
      );
    });

    it('should invalidate members query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useRemoveMember } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useRemoveMember('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('member-2');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'members', 'org-123'],
      });
    });
  });

  describe('useChangeMemberRole', () => {
    it('should change a member role', async () => {
      const updatedMember = {
        id: 'member-2',
        email: 'admin@example.com',
        role: 'viewer' as const,
        status: 'active' as const,
      };
      vi.mocked(apiClient.put).mockResolvedValue(updatedMember);

      const { useChangeMemberRole } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useChangeMemberRole('org-123'), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync({
          memberId: 'member-2',
          role: 'viewer',
        });
        expect(updated.role).toBe('viewer');
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/teams/organizations/org-123/members/member-2/role',
        { role: 'viewer' }
      );
    });

    it('should invalidate members query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(apiClient.put).mockResolvedValue({ id: 'member-2', role: 'admin' });

      const { useChangeMemberRole } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useChangeMemberRole('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ memberId: 'member-2', role: 'admin' });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'members', 'org-123'],
      });
    });
  });

  describe('useResendInvitation', () => {
    it('should resend an invitation', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'inv-1' });

      const { useResendInvitation } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useResendInvitation('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          email: 'newuser@example.com',
          role: 'member',
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/teams/organizations/org-123/members/invite',
        { email: 'newuser@example.com', role: 'member' }
      );
    });

    it('should invalidate invitations query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(apiClient.post).mockResolvedValue({ id: 'inv-1' });

      const { useResendInvitation } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useResendInvitation('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ email: 'test@example.com', role: 'member' });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'invitations', 'org-123'],
      });
    });
  });

  describe('useRevokeInvitation', () => {
    it('should revoke an invitation', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useRevokeInvitation } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useRevokeInvitation('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('inv-1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/v1/invitations/organizations/org-123/invitations/inv-1'
      );
    });

    it('should invalidate invitations query on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { useRevokeInvitation } = await import('@/lib/hooks/use-team');

      const { result } = renderHook(() => useRevokeInvitation('org-123'), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('inv-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['team', 'invitations', 'org-123'],
      });
    });
  });
});
