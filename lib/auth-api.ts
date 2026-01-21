/**
 * Authenticated API Client for Argus Backend
 *
 * This module provides authenticated fetch calls to the Python backend.
 * It automatically includes the Clerk JWT token in all requests.
 */

// Backend URL with production fallback
// Note: In production, we connect directly to Railway backend; localhost is for development only
const getBackendUrl = () => {
  // Explicit override from environment
  if (process.env.NEXT_PUBLIC_ARGUS_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_ARGUS_BACKEND_URL;
  }
  // Server-side check
  if (typeof window === 'undefined') {
    return process.env.ARGUS_BACKEND_URL || 'http://localhost:8000';
  }
  // Client-side: Production fallback to Railway
  if (window.location.hostname !== 'localhost') {
    return 'https://argus-brain-production.up.railway.app';
  }
  // Local development
  return 'http://localhost:8000';
};
const BACKEND_URL = getBackendUrl();

export interface AuthenticatedFetchOptions extends RequestInit {
  token?: string;
  apiKey?: string;
}

/**
 * Make an authenticated request to the Argus backend
 *
 * @param endpoint - API endpoint (e.g., '/api/v1/tests')
 * @param options - Fetch options including optional token/apiKey
 * @returns Response from the backend
 */
export async function authenticatedFetch(
  endpoint: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { token, apiKey, headers = {}, ...fetchOptions } = options;

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add authentication header
  if (apiKey) {
    authHeaders['X-API-Key'] = apiKey;
  } else if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;

  return fetch(url, {
    ...fetchOptions,
    headers: authHeaders,
  });
}

/**
 * Create an authenticated API client with a session token
 *
 * @param getToken - Function to get the current auth token (from Clerk)
 * @returns API client with authenticated methods
 */
export function createAuthenticatedClient(getToken: () => Promise<string | null>) {
  const makeRequest = async (
    method: string,
    endpoint: string,
    body?: unknown,
    options: Omit<AuthenticatedFetchOptions, 'method' | 'body'> = {}
  ) => {
    const token = await getToken();

    return authenticatedFetch(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      token: token || undefined,
      ...options,
    });
  };

  return {
    get: (endpoint: string, options?: Omit<AuthenticatedFetchOptions, 'method'>) =>
      makeRequest('GET', endpoint, undefined, options),

    post: (endpoint: string, body?: unknown, options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>) =>
      makeRequest('POST', endpoint, body, options),

    put: (endpoint: string, body?: unknown, options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>) =>
      makeRequest('PUT', endpoint, body, options),

    patch: (endpoint: string, body?: unknown, options?: Omit<AuthenticatedFetchOptions, 'method' | 'body'>) =>
      makeRequest('PATCH', endpoint, body, options),

    delete: (endpoint: string, options?: Omit<AuthenticatedFetchOptions, 'method'>) =>
      makeRequest('DELETE', endpoint, undefined, options),
  };
}

/**
 * Hook-compatible function to create authenticated fetch for server components
 *
 * @param token - JWT token from Clerk auth()
 * @returns Fetch function with authentication
 */
export function serverAuthenticatedFetch(token: string | null) {
  return (endpoint: string, options: RequestInit = {}) => {
    return authenticatedFetch(endpoint, {
      ...options,
      token: token || undefined,
    });
  };
}
