/**
 * Tests for lib/hooks/use-chat.ts
 *
 * Tests chat-related React Query hooks including:
 * - useConversations
 * - useConversation
 * - useConversationMessages
 * - useCreateConversation
 * - useAddMessage
 * - useDeleteConversation
 * - useUpdateConversation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({
    user: { id: 'user-123' },
    isLoaded: true,
  })),
}));

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

import { useUser } from '@clerk/nextjs';

describe('use-chat', () => {
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

    vi.mocked(useUser).mockReturnValue({
      user: { id: 'user-123' },
      isLoaded: true,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  describe('useConversations', () => {
    it('should return empty array when user is not available', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: true,
      } as any);

      const { useConversations } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversations(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should fetch conversations for a user', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'Conversation 1', user_id: 'user-123' },
        { id: 'conv-2', title: 'Conversation 2', user_id: 'user-123' },
      ];

      const mockChain = createMockChain(mockConversations, null);
      mockChain.order.mockResolvedValue({ data: mockConversations, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useConversations } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_conversations');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should filter by projectId when provided', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'Conversation 1', project_id: 'proj-1' },
      ];

      const mockChain = createMockChain(mockConversations, null);
      mockChain.order.mockReturnThis();
      mockChain.eq.mockReturnThis(); // Chain eq calls
      mockSupabase.from.mockReturnValue(mockChain);

      const { useConversations } = await import('@/lib/hooks/use-chat');

      renderHook(() => useConversations('proj-1'), { wrapper });

      await waitFor(() => {
        // Hook first filters by user_id, then by project_id
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'proj-1');
      });
    });
  });

  describe('useConversation', () => {
    it('should return null when conversationId is null', async () => {
      const { useConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversation(null), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch a single conversation by ID', async () => {
      const mockConversation = {
        id: 'conv-1',
        title: 'Test Conversation',
        user_id: 'user-123',
      };

      const mockChain = createMockChain(mockConversation, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversation('conv-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_conversations');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'conv-1');
    });
  });

  describe('useConversationMessages', () => {
    it('should return empty array when conversationId is null', async () => {
      const { useConversationMessages } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversationMessages(null), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it('should fetch messages for a conversation', async () => {
      const mockMessages = [
        { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', conversation_id: 'conv-1', role: 'assistant', content: 'Hi!' },
      ];

      const mockChain = createMockChain(mockMessages, null);
      mockChain.order.mockResolvedValue({ data: mockMessages, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { useConversationMessages } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useConversationMessages('conv-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_messages');
      expect(mockChain.eq).toHaveBeenCalledWith('conversation_id', 'conv-1');
    });
  });

  describe('useCreateConversation', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: true,
      } as any);

      const { useCreateConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useCreateConversation(), { wrapper });

      await expect(
        result.current.mutateAsync({})
      ).rejects.toThrow('Not authenticated');
    });

    it('should create a conversation', async () => {
      const newConversation = {
        id: 'new-conv',
        title: 'New Conversation',
        user_id: 'user-123',
      };

      const mockChain = createMockChain(newConversation, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useCreateConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          title: 'New Conversation',
        });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_conversations');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should create conversation with projectId', async () => {
      const newConversation = {
        id: 'new-conv',
        title: 'Project Conversation',
        user_id: 'user-123',
        project_id: 'proj-1',
      };

      const mockChain = createMockChain(newConversation, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useCreateConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useCreateConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'proj-1',
          title: 'Project Conversation',
        });
      });

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj-1',
          title: 'Project Conversation',
        })
      );
    });
  });

  describe('useAddMessage', () => {
    it('should validate conversation_id is a valid UUID', async () => {
      const { useAddMessage } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useAddMessage(), { wrapper });

      await expect(
        result.current.mutateAsync({
          conversation_id: 'invalid-id',
          role: 'user',
          content: 'Hello',
        } as any)
      ).rejects.toThrow('Invalid conversation_id');
    });

    it('should add a message to a conversation', async () => {
      const newMessage = {
        id: 'msg-1',
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        role: 'user',
        content: 'Hello',
      };

      const mockChain = createMockChain(newMessage, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useAddMessage } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useAddMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversation_id: '550e8400-e29b-41d4-a716-446655440000',
          role: 'user',
          content: 'Hello',
        } as any);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_messages');
      expect(mockChain.insert).toHaveBeenCalled();
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const newMessage = {
        id: 'msg-1',
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        role: 'user',
        content: 'Hello',
      };

      const mockChain = createMockChain(newMessage, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useAddMessage } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useAddMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversation_id: '550e8400-e29b-41d4-a716-446655440000',
          role: 'user',
          content: 'Hello',
        } as any);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-messages', '550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['conversations'],
      });
    });
  });

  describe('useDeleteConversation', () => {
    it('should delete a conversation', async () => {
      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useDeleteConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('conv-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('chat_conversations');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'conv-1');
    });

    it('should invalidate queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockChain = createMockChain(null, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useDeleteConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useDeleteConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('conv-1');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['conversations'],
      });
    });
  });

  describe('useUpdateConversation', () => {
    it('should update a conversation', async () => {
      const updatedConversation = {
        id: 'conv-1',
        title: 'Updated Title',
      };

      const mockChain = createMockChain(updatedConversation, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useUpdateConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'conv-1',
          title: 'Updated Title',
        });
      });

      expect(mockChain.update).toHaveBeenCalledWith({ title: 'Updated Title' });
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'conv-1');
    });

    it('should invalidate conversation and conversations queries on success', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const updatedConversation = {
        id: 'conv-1',
        title: 'Updated',
      };

      const mockChain = createMockChain(updatedConversation, null);
      mockSupabase.from.mockReturnValue(mockChain);

      const { useUpdateConversation } = await import('@/lib/hooks/use-chat');

      const { result } = renderHook(() => useUpdateConversation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'conv-1',
          title: 'Updated',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['conversations'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['conversation', 'conv-1'],
      });
    });
  });
});
