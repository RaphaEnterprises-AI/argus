/**
 * Tests for lib/api-client.ts
 *
 * Tests the global authenticated API client including:
 * - Token getter management
 * - Authenticated fetch
 * - JSON fetch with error handling
 * - API client methods (get, post, put, patch, delete)
 * - Discovery API endpoints
 * - Chat API endpoints
 * - Artifacts API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setGlobalTokenGetter,
  clearGlobalTokenGetter,
  isAuthInitialized,
  getAuthToken,
  authenticatedFetch,
  fetchJson,
  apiClient,
  discoveryApi,
  chatApi,
  artifactsApi,
  BACKEND_URL,
} from '@/lib/api-client';

describe('api-client', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset module state
    clearGlobalTokenGetter();

    // Mock fetch
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setGlobalTokenGetter', () => {
    it('should set the token getter function', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('test-token');

      setGlobalTokenGetter(mockGetToken);

      const token = await getAuthToken();
      expect(token).toBe('test-token');
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('should mark auth as initialized', () => {
      const mockGetToken = vi.fn().mockResolvedValue('test-token');

      setGlobalTokenGetter(mockGetToken);

      expect(isAuthInitialized()).toBe(true);
    });
  });

  describe('clearGlobalTokenGetter', () => {
    it('should clear the token getter', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      setGlobalTokenGetter(mockGetToken);

      clearGlobalTokenGetter();

      const token = await getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('getAuthToken', () => {
    it('should return null when no getter is set', async () => {
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    it('should return token from getter when set', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('my-jwt-token');
      setGlobalTokenGetter(mockGetToken);

      const token = await getAuthToken();
      expect(token).toBe('my-jwt-token');
    });

    it('should return null from getter that returns null', async () => {
      const mockGetToken = vi.fn().mockResolvedValue(null);
      setGlobalTokenGetter(mockGetToken);

      const token = await getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('authenticatedFetch', () => {
    it('should add Content-Type header', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('token');
      setGlobalTokenGetter(mockGetToken);
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

    it('should add Authorization header when token is available', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('my-token');
      setGlobalTokenGetter(mockGetToken);
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should not add Authorization header when token is null', async () => {
      clearGlobalTokenGetter();
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });

    it('should prepend BACKEND_URL to relative paths', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BACKEND_URL}/api/test`,
        expect.anything()
      );
    });

    it('should use full URL for absolute paths', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('https://external.api.com/endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external.api.com/endpoint',
        expect.anything()
      );
    });

    it('should merge custom headers', async () => {
      mockFetch.mockResolvedValue(new Response('{}'));

      await authenticatedFetch('/api/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should pass through other fetch options', async () => {
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
  });

  describe('fetchJson', () => {
    it('should parse JSON response on success', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(responseData), { status: 200 })
      );

      const result = await fetchJson('/api/test');

      expect(result).toEqual(responseData);
    });

    it('should throw error on non-ok response', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
      );

      await expect(fetchJson('/api/test')).rejects.toThrow('Not Found');
    });

    it('should throw error with detail field', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Unauthorized access' }), { status: 401 })
      );

      await expect(fetchJson('/api/test')).rejects.toThrow('Unauthorized access');
    });

    it('should throw generic error when no message/detail', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 500 })
      );

      await expect(fetchJson('/api/test')).rejects.toThrow('Request failed with status 500');
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      );

      await expect(fetchJson('/api/test')).rejects.toThrow('Request failed');
    });
  });

  describe('apiClient', () => {
    describe('get', () => {
      it('should make GET request', async () => {
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({ data: 'test' }), { status: 200 })
        );

        const result = await apiClient.get('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual({ data: 'test' });
      });

      it('should pass custom options', async () => {
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({}), { status: 200 })
        );

        await apiClient.get('/api/test', {
          headers: { 'X-Custom': 'value' },
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Custom': 'value',
            }),
          })
        );
      });
    });

    describe('post', () => {
      it('should make POST request with body', async () => {
        const body = { name: 'Test', value: 123 };
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({ id: 1 }), { status: 201 })
        );

        const result = await apiClient.post('/api/test', body);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(body),
          })
        );
        expect(result).toEqual({ id: 1 });
      });

      it('should handle POST without body', async () => {
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({}), { status: 200 })
        );

        await apiClient.post('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: undefined,
          })
        );
      });
    });

    describe('put', () => {
      it('should make PUT request with body', async () => {
        const body = { id: 1, name: 'Updated' };
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify(body), { status: 200 })
        );

        const result = await apiClient.put('/api/test/1', body);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(body),
          })
        );
        expect(result).toEqual(body);
      });
    });

    describe('patch', () => {
      it('should make PATCH request with body', async () => {
        const body = { name: 'Patched' };
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({ id: 1, name: 'Patched' }), { status: 200 })
        );

        const result = await apiClient.patch('/api/test/1', body);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        );
      });
    });

    describe('delete', () => {
      it('should make DELETE request', async () => {
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify({}), { status: 200 })
        );

        await apiClient.delete('/api/test/1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('discoveryApi', () => {
    it('startSession should POST to correct endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 'session-123' }), { status: 201 })
      );

      const result = await discoveryApi.startSession({
        projectId: 'proj-1',
        appUrl: 'https://app.example.com',
        mode: 'full',
        maxPages: 50,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual({ id: 'session-123' });
    });

    it('getSession should GET session by ID', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 'session-123', status: 'running' }), { status: 200 })
      );

      const result = await discoveryApi.getSession('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ id: 'session-123', status: 'running' });
    });

    it('pauseSession should POST to pause endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await discoveryApi.pauseSession('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123/pause'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('resumeSession should POST to resume endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await discoveryApi.resumeSession('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123/resume'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('cancelSession should POST to cancel endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await discoveryApi.cancelSession('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123/cancel'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getPages should GET pages for session', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify([{ url: '/page1' }]), { status: 200 })
      );

      await discoveryApi.getPages('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123/pages'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getFlows should GET flows for session', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify([{ name: 'Login Flow' }]), { status: 200 })
      );

      await discoveryApi.getFlows('session-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/sessions/session-123/flows'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('validateFlow should POST to validate endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ valid: true }), { status: 200 })
      );

      await discoveryApi.validateFlow('flow-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/flows/flow-123/validate'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('generateTest should POST to generate-test endpoint', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ testId: 'test-123' }), { status: 201 })
      );

      await discoveryApi.generateTest('flow-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/discovery/flows/flow-123/generate-test'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('chatApi', () => {
    it('getHistory should GET chat history', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ messages: [] }), { status: 200 })
      );

      await chatApi.getHistory('thread-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/history/thread-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('cancel should DELETE chat thread', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await chatApi.cancel('thread-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/cancel/thread-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('artifactsApi', () => {
    it('get should GET artifact by ID', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 'artifact-123', type: 'screenshot' }), { status: 200 })
      );

      const result = await artifactsApi.get('artifact-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/artifacts/artifact-123'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ id: 'artifact-123', type: 'screenshot' });
    });

    it('resolve should POST artifact refs for resolution', async () => {
      const refs = ['ref-1', 'ref-2', 'ref-3'];
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ resolved: refs }), { status: 200 })
      );

      await artifactsApi.resolve(refs);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/artifacts/resolve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ artifact_refs: refs }),
        })
      );
    });
  });
});
