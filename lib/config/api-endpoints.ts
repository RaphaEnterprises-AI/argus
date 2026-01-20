/**
 * Centralized API endpoint configuration
 *
 * All API URLs should be imported from this file to ensure:
 * 1. Single source of truth for endpoint configuration
 * 2. Consistent environment variable handling
 * 3. Easy updates when endpoints change
 */

/**
 * Cloudflare Worker URL for browser automation (E2E testing)
 * Used for: test execution, visual testing, quality observations
 */
export const WORKER_URL =
  process.env.NEXT_PUBLIC_E2E_WORKER_URL ||
  process.env.E2E_WORKER_URL ||
  'https://argus-api.samuelvinay-kumar.workers.dev';

/**
 * Backend API URL (Python/LangGraph)
 * Used for: orchestration, AI agents, test planning
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_ARGUS_BACKEND_URL ||
  process.env.ARGUS_BACKEND_URL ||
  'https://argus-brain-production.up.railway.app';

/**
 * Supabase configuration
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
