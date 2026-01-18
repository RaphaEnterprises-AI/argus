/**
 * Tests for lib/auth-api.ts
 *
 * Tests the authenticated API functions including:
 * - authenticatedFetch
 * - createAuthenticatedClient
 * - serverAuthenticatedFetch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  authenticatedFetch,
  createAuthenticatedClient,
  serverAuthenticatedFetch,
} from '@/lib/auth-api';

describe('auth-api', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticatedFetch', () => {
    it('should add Content-Type header by default', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should add Authorization header when token is provided', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', { token: 'jwt-token-123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer jwt-token-123',
          }),
        })
      );
    });

    it('should add X-API-Key header when apiKey is provided', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', { apiKey: 'api-key-xyz' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'api-key-xyz',
          }),
        })
      );
    });

    it('should prefer apiKey over token when both provided', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', {
        token: 'jwt-token',
        apiKey: 'api-key',
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['X-API-Key']).toBe('api-key');
      expect(calledHeaders['Authorization']).toBeUndefined();
    });

    it('should not add auth header when neither token nor apiKey provided', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test');

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['Authorization']).toBeUndefined();
      expect(calledHeaders['X-API-Key']).toBeUndefined();
    });

    it('should merge custom headers', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', {
        headers: { 'X-Custom': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'custom-value',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should pass through fetch options', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });

    it('should handle full URLs', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('https://external.com/api');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external.com/api',
        expect.anything()
      );
    });
  });

  describe('createAuthenticatedClient', () => {
    it('should create a client with get method', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token-123');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      await client.get('/api/test');

      expect(mockGetToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET', // GET is explicitly set by makeRequest
        })
      );
    });

    it('should create a client with post method that sends body', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token-123');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      const body = { name: 'Test' };
      await client.post('/api/test', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should create a client with put method', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token-123');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      const body = { id: 1, name: 'Updated' };
      await client.put('/api/test/1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });

    it('should create a client with patch method', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token-123');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      const body = { name: 'Patched' };
      await client.patch('/api/test/1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      );
    });

    it('should create a client with delete method', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token-123');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      await client.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle null token from getter', async () => {
      const mockGetToken = vi.fn().mockResolvedValue(null);
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      await client.get('/api/test');

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['Authorization']).toBeUndefined();
    });

    it('should include token in Authorization header', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('my-jwt-token');
      mockFetch.mockResolvedValue(new Response('{}'));

      const client = createAuthenticatedClient(mockGetToken);
      await client.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        })
      );
    });
  });

  describe('serverAuthenticatedFetch', () => {
    it('should create a fetch function with token', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      const fetchFn = serverAuthenticatedFetch('server-token');
      await fetchFn('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer server-token',
          }),
        })
      );
    });

    it('should create a fetch function without token when null', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      const fetchFn = serverAuthenticatedFetch(null);
      await fetchFn('/api/test');

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['Authorization']).toBeUndefined();
    });

    it('should merge options passed to the returned function', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      const fetchFn = serverAuthenticatedFetch('token');
      await fetchFn('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });
  });
});
