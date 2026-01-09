'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TestRun {
  id: string;
  project_id: string;
  name: string | null;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled';
  trigger: 'manual' | 'scheduled' | 'webhook' | 'ci';
  app_url: string;
  environment: string;
  browser: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: string | null;
  created_at: string;
}

interface UseRealtimeTestsOptions {
  projectId?: string;
  enabled?: boolean;
}

export function useRealtimeTests(options: UseRealtimeTestsOptions = {}) {
  const { projectId, enabled = true } = options;
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInsert = useCallback((payload: RealtimePostgresChangesPayload<TestRun>) => {
    if (payload.eventType === 'INSERT') {
      setTestRuns(prev => [payload.new as TestRun, ...prev].slice(0, 50));
    }
  }, []);

  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<TestRun>) => {
    if (payload.eventType === 'UPDATE') {
      setTestRuns(prev =>
        prev.map(run =>
          run.id === (payload.new as TestRun).id ? (payload.new as TestRun) : run
        )
      );
    }
  }, []);

  const handleDelete = useCallback((payload: RealtimePostgresChangesPayload<TestRun>) => {
    if (payload.eventType === 'DELETE') {
      setTestRuns(prev => prev.filter(run => run.id !== payload.old?.id));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Build the filter
        let channelName = 'realtime:test_runs';
        if (projectId) {
          channelName = `realtime:test_runs:project_id=eq.${projectId}`;
        }

        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'test_runs',
              filter: projectId ? `project_id=eq.${projectId}` : undefined,
            },
            handleInsert
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'test_runs',
              filter: projectId ? `project_id=eq.${projectId}` : undefined,
            },
            handleUpdate
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'test_runs',
              filter: projectId ? `project_id=eq.${projectId}` : undefined,
            },
            handleDelete
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsSubscribed(true);
              setError(null);
            } else if (status === 'CHANNEL_ERROR') {
              setError(new Error('Failed to subscribe to realtime channel'));
              setIsSubscribed(false);
            } else if (status === 'CLOSED') {
              setIsSubscribed(false);
            }
          });

        // Fetch initial data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase.from('test_runs') as any)
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50);

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setTestRuns(data || []);

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsSubscribed(false);
    };
  }, [projectId, enabled, handleInsert, handleUpdate, handleDelete]);

  // Computed values
  const runningTests = testRuns.filter(run => run.status === 'running');
  const recentPassed = testRuns.filter(run => run.status === 'passed').slice(0, 10);
  const recentFailed = testRuns.filter(run => run.status === 'failed').slice(0, 10);

  return {
    testRuns,
    runningTests,
    recentPassed,
    recentFailed,
    isSubscribed,
    error
  };
}

// Hook for subscribing to a single test run
export function useRealtimeTestRun(testRunId: string | null) {
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!testRunId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        channel = supabase
          .channel(`realtime:test_run:${testRunId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'test_runs',
              filter: `id=eq.${testRunId}`,
            },
            (payload) => {
              setTestRun(payload.new as TestRun);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsSubscribed(true);
              setError(null);
            } else if (status === 'CHANNEL_ERROR') {
              setError(new Error('Failed to subscribe to test run updates'));
              setIsSubscribed(false);
            }
          });

        // Fetch initial data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: fetchError } = await (supabase.from('test_runs') as any)
          .select('*')
          .eq('id', testRunId)
          .single();

        if (fetchError) throw fetchError;
        setTestRun(data);

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsSubscribed(false);
    };
  }, [testRunId]);

  return { testRun, isSubscribed, error };
}

// Hook for subscribing to test results of a specific run
export function useRealtimeTestResults(testRunId: string | null) {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!testRunId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:test_results:${testRunId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_results',
          filter: `test_run_id=eq.${testRunId}`,
        },
        (payload) => {
          setTestResults(prev => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'test_results',
          filter: `test_run_id=eq.${testRunId}`,
        },
        (payload) => {
          setTestResults(prev =>
            prev.map(result =>
              result.id === payload.new.id ? payload.new : result
            )
          );
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    // Fetch initial data
    const fetchInitial = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('test_results') as any)
        .select('*')
        .eq('test_run_id', testRunId)
        .order('created_at', { ascending: true });

      if (data) setTestResults(data);
    };

    fetchInitial();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testRunId]);

  return { testResults, isSubscribed };
}
