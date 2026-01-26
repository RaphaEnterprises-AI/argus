'use client';

/**
 * Multi-Tenant API Hook
 *
 * Combines Clerk authentication with organization context to make
 * properly scoped API requests. This is the RECOMMENDED hook for
 * making API calls that need multi-tenant isolation.
 *
 * @example
 * ```tsx
 * function ProjectsList() {
 *   const { fetchJson, currentOrg, isReady } = useOrgApi();
 *
 *   const loadProjects = async () => {
 *     if (!isReady) return;
 *
 *     // Automatically includes X-Organization-ID header with backend UUID
 *     const response = await fetchJson<Project[]>('/api/v1/projects');
 *
 *     // Or use the new org-scoped endpoint pattern
 *     const response = await fetchJson<Project[]>(
 *       `/api/v1/orgs/${currentOrg.id}/projects`
 *     );
 *   };
 * }
 * ```
 */

import { useMemo } from 'react';
import { useCurrentOrg } from '@/lib/contexts/organization-context';
import { useAuthApi, type ApiResponse, type FetchJsonOptions } from './use-auth-api';

export interface UseOrgApiReturn {
  /** Make authenticated JSON request with org context */
  fetchJson: <T>(endpoint: string, options?: FetchJsonOptions) => Promise<ApiResponse<T>>;

  /** Make authenticated streaming request with org context */
  fetchStream: (
    endpoint: string,
    body?: unknown,
    onMessage?: (event: string, data: unknown) => void,
    signal?: AbortSignal
  ) => Promise<void>;

  /** Current organization (null if not loaded or no org selected) */
  currentOrg: ReturnType<typeof useCurrentOrg>['currentOrg'];

  /** All organizations the user belongs to */
  organizations: ReturnType<typeof useCurrentOrg>['organizations'];

  /** Switch to a different organization */
  switchOrganization: ReturnType<typeof useCurrentOrg>['switchOrganization'];

  /** Refresh organizations list */
  refreshOrganizations: ReturnType<typeof useCurrentOrg>['refreshOrganizations'];

  /** True when auth is loaded and org context is ready */
  isReady: boolean;

  /** True while loading auth or org data */
  isLoading: boolean;

  /** Error message if org loading failed */
  error: string | null;

  /** Whether user is signed in */
  isSignedIn: boolean;

  /** Backend URL for direct requests if needed */
  backendUrl: string;

  /**
   * Build a URL path scoped to the current organization
   * @example buildOrgPath('/projects') => '/api/v1/orgs/123/projects'
   */
  buildOrgPath: (path: string) => string;
}

/**
 * Hook for making multi-tenant API requests with proper organization context.
 *
 * This hook:
 * - Automatically includes the current org's backend UUID in X-Organization-ID header
 * - Provides helpers for building org-scoped URL paths
 * - Exposes org switching functionality
 *
 * @returns API methods and organization context
 */
export function useOrgApi(): UseOrgApiReturn {
  const orgContext = useCurrentOrg();
  const { currentOrg, organizations, isLoading: orgLoading, error, switchOrganization, refreshOrganizations } = orgContext;

  // Pass the backend UUID to useAuthApi for proper header
  const authApi = useAuthApi({
    organizationId: currentOrg?.id ?? null,
  });

  const { fetchJson, fetchStream, isLoaded: authLoaded, isSignedIn, backendUrl } = authApi;

  // Ready when auth is loaded, signed in, and we have an org (or finished loading orgs)
  const isReady = !!(authLoaded && isSignedIn && !orgLoading && currentOrg !== null);
  const isLoading = !authLoaded || orgLoading;

  // Helper to build org-scoped paths
  const buildOrgPath = useMemo(() => {
    return (path: string): string => {
      if (!currentOrg) {
        // Return original path if no org - let the API handle it
        return path;
      }

      // Remove leading slash for consistent joining
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;

      // Build org-scoped path
      return `/api/v1/orgs/${currentOrg.id}/${cleanPath}`;
    };
  }, [currentOrg]);

  return {
    fetchJson,
    fetchStream,
    currentOrg,
    organizations,
    switchOrganization,
    refreshOrganizations,
    isReady,
    isLoading,
    error,
    isSignedIn: isSignedIn ?? false,
    backendUrl,
    buildOrgPath,
  };
}

/**
 * Hook that returns only when org context is ready
 * Throws if used outside of proper context
 */
export function useRequiredOrgApi(): UseOrgApiReturn & { currentOrg: NonNullable<UseOrgApiReturn['currentOrg']> } {
  const api = useOrgApi();

  if (!api.isReady || !api.currentOrg) {
    throw new Error(
      'useRequiredOrgApi requires an active organization. ' +
      'Make sure the user has selected an organization before using this hook.'
    );
  }

  return api as UseOrgApiReturn & { currentOrg: NonNullable<UseOrgApiReturn['currentOrg']> };
}
