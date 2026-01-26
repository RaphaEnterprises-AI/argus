import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';

// Define types inline since tables may not exist in database yet
export interface PluginEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  session_id: string;
  event_type: 'command' | 'skill' | 'agent' | 'hook' | 'mcp_tool' | 'error' | 'session_start' | 'session_end';
  event_name: string;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  git_branch: string | null;
  git_commit: string | null;
  git_repo: string | null;
  workspace_path: string | null;
  file_paths: string[] | null;
  plugin_version: string | null;
  claude_code_version: string | null;
  os_platform: string | null;
  created_at: string;
  updated_at: string;
}

export interface PluginSession {
  id: string;
  user_id: string;
  project_id: string | null;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  total_events: number;
  commands_executed: number;
  skills_activated: number;
  agents_invoked: number;
  hooks_triggered: number;
  mcp_calls: number;
  errors_count: number;
  git_repo: string | null;
  git_branch: string | null;
  workspace_path: string | null;
  plugin_version: string | null;
  claude_code_version: string | null;
  os_platform: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PLUGIN EVENTS HOOKS
// ============================================================================

export interface PluginEventFilters {
  eventType?: string;
  status?: string;
  sessionId?: string;
  limit?: number;
}

/**
 * Fetch recent plugin events for the current user
 */
export function usePluginEvents(filters: PluginEventFilters = {}) {
  const { userId, isLoaded } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-events', userId, filters],
    queryFn: async () => {
      if (!userId) return [];

      let query = (supabase as any)
        .from('plugin_events')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PluginEvent[];
    },
    enabled: isLoaded && !!userId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });
}

/**
 * Fetch a single plugin event by ID
 */
export function usePluginEvent(eventId: string | null) {
  const { userId, isLoaded } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-event', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await (supabase as any)
        .from('plugin_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as PluginEvent;
    },
    enabled: isLoaded && !!userId && !!eventId,
  });
}

// ============================================================================
// PLUGIN SESSIONS HOOKS
// ============================================================================

/**
 * Fetch plugin sessions for the current user
 */
export function usePluginSessions(limit = 20) {
  const { userId, isLoaded } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-sessions', userId, limit],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from('plugin_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PluginSession[];
    },
    enabled: isLoaded && !!userId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

/**
 * Fetch a single plugin session with its events
 */
export function usePluginSession(sessionId: string | null) {
  const { userId, isLoaded } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data: session, error: sessionError } = await (supabase as any)
        .from('plugin_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: events, error: eventsError } = await (supabase as any)
        .from('plugin_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('started_at', { ascending: true });

      if (eventsError) throw eventsError;

      return {
        session: session as PluginSession,
        events: events as PluginEvent[],
      };
    },
    enabled: isLoaded && !!userId && !!sessionId,
  });
}

// ============================================================================
// PLUGIN USAGE SUMMARY HOOK
// ============================================================================

export interface PluginUsageSummary {
  totalSessions: number;
  totalEvents: number;
  totalCommands: number;
  totalSkills: number;
  totalAgents: number;
  totalErrors: number;
  avgSessionDuration: number;
  mostUsedCommand: string | null;
  mostUsedSkill: string | null;
  recentActivity: PluginEvent[];
}

/**
 * Fetch aggregated plugin usage summary
 */
export function usePluginUsageSummary(daysBack = 7) {
  const { userId, isLoaded } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-usage-summary', userId, daysBack],
    queryFn: async (): Promise<PluginUsageSummary | null> => {
      if (!userId) return null;

      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      // Get all events in the time period
      const { data: events, error: eventsError } = await (supabase as any)
        .from('plugin_events')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });

      if (eventsError) throw eventsError;

      const allEvents = (events || []) as PluginEvent[];

      // Get sessions for duration calculation
      const { data: sessions, error: sessionsError } = await (supabase as any)
        .from('plugin_sessions')
        .select('duration_ms')
        .eq('user_id', userId)
        .gte('started_at', since.toISOString());

      if (sessionsError) throw sessionsError;

      // Calculate aggregations
      const sessionIds = new Set(allEvents.map(e => e.session_id));
      const commands = allEvents.filter(e => e.event_type === 'command');
      const skills = allEvents.filter(e => e.event_type === 'skill');
      const agents = allEvents.filter(e => e.event_type === 'agent');
      const errors = allEvents.filter(e => e.status === 'failed');

      // Find most used command
      const commandCounts = commands.reduce((acc, e) => {
        acc[e.event_name] = (acc[e.event_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostUsedCommand = Object.entries(commandCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Find most used skill
      const skillCounts = skills.reduce((acc, e) => {
        acc[e.event_name] = (acc[e.event_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostUsedSkill = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Calculate average session duration
      const typedSessions = (sessions || []) as Array<{ duration_ms: number | null }>;
      const durations = typedSessions
        .map(s => s.duration_ms)
        .filter((d): d is number => d !== null);
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      return {
        totalSessions: sessionIds.size,
        totalEvents: allEvents.length,
        totalCommands: commands.length,
        totalSkills: skills.length,
        totalAgents: agents.length,
        totalErrors: errors.length,
        avgSessionDuration: avgDuration,
        mostUsedCommand,
        mostUsedSkill,
        recentActivity: allEvents.slice(0, 20),
      };
    },
    enabled: isLoaded && !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// ============================================================================
// REALTIME SUBSCRIPTION HOOK
// ============================================================================

/**
 * Subscribe to realtime plugin events
 */
export function usePluginEventsRealtime(onEvent: (event: PluginEvent) => void) {
  const { userId } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['plugin-events-realtime', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Subscribe to realtime updates
      const channel = supabase
        .channel('plugin-events-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'plugin_events',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            onEvent(payload.new as PluginEvent);
          }
        )
        .subscribe();

      return channel;
    },
    enabled: !!userId,
    staleTime: Infinity, // Never refetch automatically
  });
}

// ============================================================================
// EVENT RECORDING HOOK (for plugin to record events)
// ============================================================================

export interface RecordPluginEventInput {
  sessionId: string;
  eventType: PluginEvent['event_type'];
  eventName: string;
  status?: PluginEvent['status'];
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  durationMs?: number;
  gitBranch?: string;
  gitCommit?: string;
  gitRepo?: string;
  workspacePath?: string;
  filePaths?: string[];
  pluginVersion?: string;
}

/**
 * Record a new plugin event (called by the plugin via API)
 */
export function useRecordPluginEvent() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: RecordPluginEventInput) => {
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('plugin_events')
        .insert({
          user_id: userId,
          session_id: input.sessionId,
          event_type: input.eventType,
          event_name: input.eventName,
          status: input.status || 'completed',
          input_data: input.inputData || {},
          output_data: input.outputData || {},
          error_message: input.errorMessage,
          duration_ms: input.durationMs,
          git_branch: input.gitBranch,
          git_commit: input.gitCommit,
          git_repo: input.gitRepo,
          workspace_path: input.workspacePath,
          file_paths: input.filePaths,
          plugin_version: input.pluginVersion,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PluginEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugin-events'] });
      queryClient.invalidateQueries({ queryKey: ['plugin-usage-summary'] });
    },
  });
}
