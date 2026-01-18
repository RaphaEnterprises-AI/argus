/**
 * Tests for lib/supabase/server.ts
 *
 * Tests the server-side Supabase client utilities including:
 * - createServerSupabaseClient
 * - createAdminClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create stable mock client
const mockServerClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
};

// Store the captured cookies config for testing
let capturedCookiesConfig: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  remove: (name: string, options: Record<string, unknown>) => void;
} | null = null;

// Mock @supabase/ssr to capture the cookies config
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url: string, key: string, options: { cookies: typeof capturedCookiesConfig }) => {
    capturedCookiesConfig = options.cookies;
    return mockServerClient;
  }),
}));

// Mock next/headers with a cookie store that works properly
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Import after mocks are set up
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

describe('supabase/server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    capturedCookiesConfig = null;

    // Set required env vars
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };

    // Clear mock call history but keep implementations
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createServerSupabaseClient', () => {
    it('should create a Supabase server client with correct credentials', async () => {
      await createServerSupabaseClient();

      expect(createServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it('should return a client object', async () => {
      const client = await createServerSupabaseClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('from');
      expect(client).toHaveProperty('auth');
    });

    describe('cookie handlers', () => {
      it('should get cookie value correctly', async () => {
        mockCookieStore.get.mockReturnValue({ value: 'cookie-value' });

        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const result = capturedCookiesConfig!.get('test-cookie');

        expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie');
        expect(result).toBe('cookie-value');
      });

      it('should return undefined when cookie does not exist', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const result = capturedCookiesConfig!.get('nonexistent-cookie');

        expect(result).toBeUndefined();
      });

      it('should return undefined when cookie has no value', async () => {
        mockCookieStore.get.mockReturnValue({});

        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const result = capturedCookiesConfig!.get('empty-cookie');

        expect(result).toBeUndefined();
      });

      it('should set cookie correctly', async () => {
        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const options = { path: '/', httpOnly: true };

        capturedCookiesConfig!.set('test-cookie', 'test-value', options);

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'test-cookie',
          value: 'test-value',
          path: '/',
          httpOnly: true,
        });
      });

      it('should silently handle set errors in server components', async () => {
        mockCookieStore.set.mockImplementation(() => {
          throw new Error('Cannot set cookies in Server Component');
        });

        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();

        // Should not throw
        expect(() => {
          capturedCookiesConfig!.set('test-cookie', 'test-value', {});
        }).not.toThrow();
      });

      it('should remove cookie by setting empty value', async () => {
        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const options = { path: '/' };

        capturedCookiesConfig!.remove('test-cookie', options);

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'test-cookie',
          value: '',
          path: '/',
        });
      });

      it('should silently handle remove errors in server components', async () => {
        mockCookieStore.set.mockImplementation(() => {
          throw new Error('Cannot set cookies in Server Component');
        });

        await createServerSupabaseClient();

        expect(capturedCookiesConfig).not.toBeNull();

        // Should not throw
        expect(() => {
          capturedCookiesConfig!.remove('test-cookie', {});
        }).not.toThrow();
      });
    });
  });

  describe('createAdminClient', () => {
    it('should create an admin client with service role key', () => {
      createAdminClient();

      expect(createServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it('should return a client object', () => {
      const client = createAdminClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('from');
      expect(client).toHaveProperty('auth');
    });

    describe('noop cookie handlers', () => {
      it('should return undefined for get', () => {
        createAdminClient();

        expect(capturedCookiesConfig).not.toBeNull();
        const result = capturedCookiesConfig!.get('any-cookie');

        expect(result).toBeUndefined();
      });

      it('should do nothing for set', () => {
        createAdminClient();

        expect(capturedCookiesConfig).not.toBeNull();

        // Should not throw and should not call any external function
        expect(() => {
          capturedCookiesConfig!.set('any-cookie', 'any-value', {});
        }).not.toThrow();
      });

      it('should do nothing for remove', () => {
        createAdminClient();

        expect(capturedCookiesConfig).not.toBeNull();

        // Should not throw and should not call any external function
        expect(() => {
          capturedCookiesConfig!.remove('any-cookie', {});
        }).not.toThrow();
      });
    });
  });

  describe('environment variable handling', () => {
    it('should use custom NEXT_PUBLIC_SUPABASE_URL from environment', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co';

      await createServerSupabaseClient();

      expect(createServerClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use custom NEXT_PUBLIC_SUPABASE_ANON_KEY from environment', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-anon-key';

      await createServerSupabaseClient();

      expect(createServerClient).toHaveBeenCalledWith(
        expect.any(String),
        'custom-anon-key',
        expect.any(Object)
      );
    });

    it('should use custom SUPABASE_SERVICE_ROLE_KEY for admin client', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'different-service-key';

      createAdminClient();

      expect(createServerClient).toHaveBeenCalledWith(
        expect.any(String),
        'different-service-key',
        expect.any(Object)
      );
    });
  });
});
