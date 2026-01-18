/**
 * Tests for lib/supabase/client.ts
 *
 * Tests the Supabase client utilities including:
 * - createClient
 * - getSupabaseClient (singleton)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';
import { createClient, getSupabaseClient } from '@/lib/supabase/client';

// Create stable mock client
const mockClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  },
};

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockClient),
}));

describe('supabase/client', () => {
  beforeEach(() => {
    // Set required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createClient', () => {
    it('should create a Supabase client with correct credentials', () => {
      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
    });

    it('should return a client object', () => {
      const client = createClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('from');
    });
  });

  describe('getSupabaseClient', () => {
    it('should return a Supabase client', () => {
      const client = getSupabaseClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('from');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();

      expect(client1).toBe(client2);
    });
  });
});
