'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Agent types in the orchestrator
export type AgentType =
  | 'orchestrator'
  | 'code_analyzer'
  | 'test_planner'
  | 'ui_tester'
  | 'api_tester'
  | 'db_tester'
  | 'self_healer'
  | 'reporter';

// Orchestrator state
export type OrchestratorState =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'executing'
  | 'healing'
  | 'reporting'
  | 'completed'
  | 'failed';

// Agent status
export type AgentStatus = 'idle' | 'active' | 'completed' | 'error';

// Log entry from the orchestrator
export interface OrchestratorLog {
  id: string;
  timestamp: string;
  agent: AgentType;
  level: 'info' | 'success' | 'error' | 'thinking' | 'warning';
  message: string;
  metadata?: Record<string, unknown>;
}

// Step in the execution timeline
export interface ExecutionStep {
  id: string;
  index: number;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  agent: AgentType;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
}

// Agent state
export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  lastMessage?: string;
  startTime?: string;
  endTime?: string;
}

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// Orchestrator session data
export interface OrchestratorSession {
  id: string;
  projectId: string;
  state: OrchestratorState;
  currentStep: number;
  totalSteps: number;
  currentAgent: AgentType;
  agents: Record<AgentType, AgentState>;
  startedAt: string;
  completedAt?: string;
}

// Configuration for reconnection
const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

// Default agent states
const createDefaultAgents = (): Record<AgentType, AgentState> => ({
  orchestrator: { type: 'orchestrator', status: 'idle' },
  code_analyzer: { type: 'code_analyzer', status: 'idle' },
  test_planner: { type: 'test_planner', status: 'idle' },
  ui_tester: { type: 'ui_tester', status: 'idle' },
  api_tester: { type: 'api_tester', status: 'idle' },
  db_tester: { type: 'db_tester', status: 'idle' },
  self_healer: { type: 'self_healer', status: 'idle' },
  reporter: { type: 'reporter', status: 'idle' },
});

/**
 * Hook to subscribe to orchestrator state and activity logs
 */
export function useOrchestratorState(sessionId: string | null) {
  const supabase = getSupabaseClient();

  // State
  const [logs, setLogs] = useState<OrchestratorLog[]>([]);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AgentType>('orchestrator');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [orchestratorState, setOrchestratorState] = useState<OrchestratorState>('idle');
  const [agents, setAgents] = useState<Record<AgentType, AgentState>>(createDefaultAgents());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);

  // Refs for reconnection logic
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate backoff delay with jitter
  const getBackoffDelay = useCallback((attempt: number) => {
    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, attempt),
      RECONNECT_CONFIG.maxDelay
    );
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [supabase]);

  // Parse activity log to orchestrator log format
  const parseActivityLog = useCallback((activity: any): OrchestratorLog => {
    // Map event types to log levels
    const levelMap: Record<string, OrchestratorLog['level']> = {
      started: 'info',
      step: 'success',
      thinking: 'thinking',
      action: 'info',
      screenshot: 'info',
      error: 'error',
      completed: 'success',
      cancelled: 'warning',
    };

    // Extract agent from metadata or default to orchestrator
    const agent = (activity.metadata?.agent as AgentType) || 'orchestrator';

    return {
      id: activity.id,
      timestamp: activity.created_at,
      agent,
      level: levelMap[activity.event_type] || 'info',
      message: activity.description || activity.title,
      metadata: activity.metadata,
    };
  }, []);

  // Update agent state based on activity
  const updateAgentFromActivity = useCallback((activity: any) => {
    const agentType = (activity.metadata?.agent as AgentType) || 'orchestrator';

    setAgents((prev) => {
      const newAgents = { ...prev };

      if (activity.event_type === 'started') {
        newAgents[agentType] = {
          ...newAgents[agentType],
          status: 'active',
          startTime: activity.created_at,
          lastMessage: activity.description,
        };
      } else if (activity.event_type === 'completed') {
        newAgents[agentType] = {
          ...newAgents[agentType],
          status: 'completed',
          endTime: activity.created_at,
          lastMessage: activity.description,
        };
      } else if (activity.event_type === 'error') {
        newAgents[agentType] = {
          ...newAgents[agentType],
          status: 'error',
          lastMessage: activity.description,
        };
      } else if (activity.event_type === 'thinking' || activity.event_type === 'action') {
        newAgents[agentType] = {
          ...newAgents[agentType],
          status: 'active',
          lastMessage: activity.description,
        };
      }

      return newAgents;
    });

    // Update current agent
    if (activity.event_type !== 'completed' && activity.event_type !== 'error') {
      setCurrentAgent(agentType);
    }

    // Update orchestrator state based on agent type
    const stateMap: Partial<Record<AgentType, OrchestratorState>> = {
      code_analyzer: 'analyzing',
      test_planner: 'planning',
      ui_tester: 'executing',
      api_tester: 'executing',
      db_tester: 'executing',
      self_healer: 'healing',
      reporter: 'reporting',
    };

    if (stateMap[agentType] && activity.event_type !== 'completed') {
      setOrchestratorState(stateMap[agentType]!);
    }

    // Update step progress
    if (activity.metadata?.step) {
      setCurrentStep(activity.metadata.step as number);
    }
    if (activity.metadata?.totalSteps) {
      setTotalSteps(activity.metadata.totalSteps as number);
    }
  }, []);

  // Subscribe to channel with reconnection logic
  const subscribe = useCallback(async () => {
    if (!sessionId) return;

    cleanup();
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`orchestrator-${sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: sessionId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: unknown) => {
          const typedPayload = payload as { new: any };
          const activity = typedPayload.new;

          // Add to logs
          const log = parseActivityLog(activity);
          setLogs((prev) => [...prev, log]);

          // Update agent state
          updateAgentFromActivity(activity);

          setLastHeartbeat(new Date());
        }
      )
      .on('system', { event: '*' }, (payload: unknown) => {
        const typedPayload = payload as { status?: string };
        if (typedPayload.status === 'ok') {
          setLastHeartbeat(new Date());
        }
      });

    // Subscribe with status callback
    channel.subscribe((status) => {
      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus('connected');
          reconnectAttemptRef.current = 0;
          setLastHeartbeat(new Date());
          break;
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
          setConnectionStatus('error');
          if (reconnectAttemptRef.current < RECONNECT_CONFIG.maxAttempts) {
            const delay = getBackoffDelay(reconnectAttemptRef.current);
            setConnectionStatus('reconnecting');
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptRef.current++;
              subscribe();
            }, delay);
          } else {
            setConnectionStatus('error');
          }
          break;
        case 'CLOSED':
          setConnectionStatus('disconnected');
          break;
      }
    });

    channelRef.current = channel;
  }, [sessionId, supabase, cleanup, getBackoffDelay, parseActivityLog, updateAgentFromActivity]);

  // Initial fetch and subscription
  useEffect(() => {
    if (!sessionId) {
      setLogs([]);
      setSteps([]);
      setCurrentAgent('orchestrator');
      setCurrentStep(0);
      setTotalSteps(0);
      setOrchestratorState('idle');
      setAgents(createDefaultAgents());
      setConnectionStatus('disconnected');
      cleanup();
      return;
    }

    // Fetch existing activities
    const fetchActivities = async () => {
      const { data, error } = await (supabase.from('activity_logs') as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Parse all activities into logs
        const parsedLogs = data.map(parseActivityLog);
        setLogs(parsedLogs);

        // Replay activities to build current state
        data.forEach(updateAgentFromActivity);
      }
    };

    fetchActivities();
    subscribe();

    return cleanup;
  }, [sessionId, supabase, subscribe, cleanup, parseActivityLog, updateAgentFromActivity]);

  return {
    // Logs and state
    logs,
    steps,
    currentAgent,
    currentStep,
    totalSteps,
    orchestratorState,
    agents,

    // Connection
    connectionStatus,
    lastHeartbeat,
    reconnect: subscribe,
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting',
  };
}

export default useOrchestratorState;
