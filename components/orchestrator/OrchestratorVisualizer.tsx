'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AgentNode, AgentNodeDefs } from './AgentNode';
import { ConnectionLine, ConnectionLineDefs } from './ConnectionLine';
import {
  useOrchestratorState,
  type AgentType,
  type OrchestratorState,
  type AgentState,
  type ConnectionStatus,
} from './hooks/useOrchestratorState';

interface OrchestratorVisualizerProps {
  sessionId: string;
  className?: string;
}

// Agent configuration with positions in a neural network layout
interface AgentConfig {
  type: AgentType;
  label: string;
  x: number;
  y: number;
  layer: 'input' | 'hidden' | 'output';
}

// Define agent layout - circular arrangement around the brain
const AGENTS: AgentConfig[] = [
  // Top layer - Analysis agents
  { type: 'code_analyzer', label: 'Code Analyzer', x: 200, y: 80, layer: 'input' },
  { type: 'test_planner', label: 'Test Planner', x: 400, y: 80, layer: 'input' },

  // Middle layer - Execution agents
  { type: 'ui_tester', label: 'UI Tester', x: 120, y: 200, layer: 'hidden' },
  { type: 'api_tester', label: 'API Tester', x: 480, y: 200, layer: 'hidden' },
  { type: 'db_tester', label: 'DB Tester', x: 300, y: 300, layer: 'hidden' },

  // Bottom layer - Post-processing agents
  { type: 'self_healer', label: 'Self Healer', x: 200, y: 380, layer: 'output' },
  { type: 'reporter', label: 'Reporter', x: 400, y: 380, layer: 'output' },
];

// Center position for orchestrator
const CENTER = { x: 300, y: 200 };
const SVG_WIDTH = 600;
const SVG_HEIGHT = 460;

// Connection definitions
interface ConnectionDef {
  from: AgentType;
  to: AgentType;
  bidirectional?: boolean;
}

const CONNECTIONS: ConnectionDef[] = [
  // Orchestrator to all agents
  { from: 'orchestrator', to: 'code_analyzer', bidirectional: true },
  { from: 'orchestrator', to: 'test_planner', bidirectional: true },
  { from: 'orchestrator', to: 'ui_tester', bidirectional: true },
  { from: 'orchestrator', to: 'api_tester', bidirectional: true },
  { from: 'orchestrator', to: 'db_tester', bidirectional: true },
  { from: 'orchestrator', to: 'self_healer', bidirectional: true },
  { from: 'orchestrator', to: 'reporter', bidirectional: true },

  // Inter-agent connections
  { from: 'code_analyzer', to: 'test_planner' },
  { from: 'test_planner', to: 'ui_tester' },
  { from: 'test_planner', to: 'api_tester' },
  { from: 'test_planner', to: 'db_tester' },
  { from: 'ui_tester', to: 'self_healer' },
  { from: 'api_tester', to: 'self_healer' },
  { from: 'db_tester', to: 'self_healer' },
  { from: 'self_healer', to: 'reporter' },
];

// State display labels
const stateLabels: Record<OrchestratorState, { label: string; color: string }> = {
  idle: { label: 'IDLE', color: 'text-muted-foreground' },
  analyzing: { label: 'ANALYZING', color: 'text-blue-500' },
  planning: { label: 'PLANNING', color: 'text-cyan-500' },
  executing: { label: 'EXECUTING', color: 'text-green-500' },
  healing: { label: 'HEALING', color: 'text-rose-500' },
  reporting: { label: 'REPORTING', color: 'text-indigo-500' },
  completed: { label: 'COMPLETED', color: 'text-green-500' },
  failed: { label: 'FAILED', color: 'text-red-500' },
};

// Connection status badge
function ConnectionStatusBadge({
  status,
  onReconnect,
}: {
  status: ConnectionStatus;
  onReconnect?: () => void;
}) {
  const configs: Record<
    ConnectionStatus,
    { icon: typeof Wifi; color: string; bg: string; label: string; animate?: boolean }
  > = {
    connected: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Live' },
    connecting: {
      icon: Loader2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      label: 'Connecting',
      animate: true,
    },
    reconnecting: {
      icon: RefreshCw,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      label: 'Reconnecting',
      animate: true,
    },
    error: { icon: WifiOff, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Error' },
    disconnected: {
      icon: WifiOff,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      label: 'Offline',
    },
  };

  const config = configs[status] || configs.disconnected;
  const Icon = config.icon;

  return (
    <button
      onClick={status === 'error' || status === 'disconnected' ? onReconnect : undefined}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        config.bg,
        (status === 'error' || status === 'disconnected') &&
          onReconnect &&
          'hover:opacity-80 cursor-pointer'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.color, config.animate && 'animate-spin')} />
      <span className={config.color}>{config.label}</span>
    </button>
  );
}

// Background neural network pattern
function NeuralBackground() {
  return (
    <g className="neural-background">
      {/* Animated background gradient */}
      <defs>
        <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
          <motion.stop
            offset="0%"
            animate={{
              stopColor: ['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.25)', 'rgba(139, 92, 246, 0.15)'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
        </radialGradient>

        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/10"
          />
        </pattern>
      </defs>

      {/* Grid pattern */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Central glow */}
      <ellipse
        cx={CENTER.x}
        cy={CENTER.y}
        rx={150}
        ry={150}
        fill="url(#brain-glow)"
      />

      {/* Decorative neurons/dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.circle
          key={i}
          cx={Math.random() * SVG_WIDTH}
          cy={Math.random() * SVG_HEIGHT}
          r={1 + Math.random() * 2}
          className="fill-muted-foreground/20"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </g>
  );
}

// Center brain node with state display
function CenterBrainNode({
  state,
  currentStep,
  totalSteps,
  isActive,
}: {
  state: OrchestratorState;
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
}) {
  const stateConfig = stateLabels[state];

  return (
    <g transform={`translate(${CENTER.x}, ${CENTER.y})`}>
      {/* Outer pulse rings */}
      {isActive && (
        <>
          <motion.circle
            r={70}
            fill="none"
            stroke="url(#brain-gradient)"
            strokeWidth={2}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.circle
            r={85}
            fill="none"
            stroke="url(#brain-gradient)"
            strokeWidth={1}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
          <motion.circle
            r={100}
            fill="none"
            stroke="url(#brain-gradient)"
            strokeWidth={0.5}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </>
      )}

      {/* Main brain circle */}
      <motion.circle
        r={55}
        className="fill-background stroke-2 stroke-violet-500"
        style={{
          filter: isActive ? 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))' : undefined,
        }}
        animate={
          isActive
            ? {
                scale: [1, 1.02, 1],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow */}
      <motion.circle
        r={50}
        className="fill-violet-500/10"
        animate={
          isActive
            ? {
                opacity: [0.1, 0.3, 0.1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Brain icon */}
      <foreignObject x={-20} y={-35} width={40} height={40}>
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={
              isActive
                ? {
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Brain className="h-8 w-8 text-violet-500" />
          </motion.div>
        </div>
      </foreignObject>

      {/* State label */}
      <text y={15} textAnchor="middle" className={cn('text-xs font-bold fill-current', stateConfig.color)}>
        {stateConfig.label}
      </text>

      {/* Step counter */}
      <text y={32} textAnchor="middle" className="text-[10px] fill-muted-foreground">
        Step {currentStep}/{totalSteps || '?'}
      </text>

      {/* Activity indicator */}
      {isActive && (
        <motion.circle
          cx={45}
          cy={-45}
          r={8}
          className="fill-green-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </g>
  );
}

// Main visualizer component
export function OrchestratorVisualizer({ sessionId, className }: OrchestratorVisualizerProps) {
  const {
    logs,
    steps,
    currentAgent,
    currentStep,
    totalSteps,
    orchestratorState,
    agents,
    connectionStatus,
    reconnect,
    isConnected,
  } = useOrchestratorState(sessionId);

  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get agent position (including orchestrator)
  const getAgentPosition = useCallback(
    (type: AgentType) => {
      if (type === 'orchestrator') return CENTER;
      const agent = AGENTS.find((a) => a.type === type);
      return agent ? { x: agent.x, y: agent.y } : CENTER;
    },
    []
  );

  // Check if a connection should be active
  const isConnectionActive = useCallback(
    (from: AgentType, to: AgentType) => {
      const fromStatus = agents[from]?.status || 'idle';
      const toStatus = agents[to]?.status || 'idle';
      return fromStatus === 'active' || toStatus === 'active';
    },
    [agents]
  );

  // Determine if orchestrator is active
  const isOrchestratorActive = orchestratorState !== 'idle' && orchestratorState !== 'completed' && orchestratorState !== 'failed';

  return (
    <div
      className={cn(
        'relative bg-background border rounded-xl overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-5 w-5 text-violet-500" />
            {isOrchestratorActive && (
              <motion.span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">Orchestrator Visualization</h2>
            <p className="text-xs text-muted-foreground">Real-time agent activity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatusBadge status={connectionStatus} onReconnect={reconnect} />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="relative aspect-[4/3] w-full">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Definitions */}
          <defs>
            <radialGradient id="brain-gradient">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <AgentNodeDefs />
          <ConnectionLineDefs />

          {/* Background */}
          <NeuralBackground />

          {/* Connection lines (render before nodes) */}
          <g className="connections">
            {CONNECTIONS.map((conn, index) => {
              const fromPos = getAgentPosition(conn.from);
              const toPos = getAgentPosition(conn.to);
              return (
                <ConnectionLine
                  key={`${conn.from}-${conn.to}`}
                  fromX={fromPos.x}
                  fromY={fromPos.y}
                  toX={toPos.x}
                  toY={toPos.y}
                  fromAgent={conn.from}
                  toAgent={conn.to}
                  fromStatus={agents[conn.from]?.status || 'idle'}
                  toStatus={agents[conn.to]?.status || 'idle'}
                  isActive={isConnectionActive(conn.from, conn.to)}
                  isBidirectional={conn.bidirectional}
                />
              );
            })}
          </g>

          {/* Agent nodes */}
          <g className="agents">
            {AGENTS.map((agent) => (
              <AgentNode
                key={agent.type}
                type={agent.type}
                status={agents[agent.type]?.status || 'idle'}
                label={agent.label}
                x={agent.x}
                y={agent.y}
                lastMessage={agents[agent.type]?.lastMessage}
                onClick={() => setSelectedAgent(agent.type)}
              />
            ))}
          </g>

          {/* Center brain node */}
          <CenterBrainNode
            state={orchestratorState}
            currentStep={currentStep}
            totalSteps={totalSteps}
            isActive={isOrchestratorActive}
          />
        </svg>

        {/* Overlay for loading state */}
        <AnimatePresence>
          {connectionStatus === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Connecting to session...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with active agent info */}
      <div className="px-4 py-3 border-t bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active Agent:</span>
            </div>
            <span
              className={cn(
                'text-sm font-semibold',
                currentAgent === 'orchestrator' && 'text-violet-500',
                currentAgent === 'code_analyzer' && 'text-blue-500',
                currentAgent === 'test_planner' && 'text-cyan-500',
                currentAgent === 'ui_tester' && 'text-green-500',
                currentAgent === 'api_tester' && 'text-orange-500',
                currentAgent === 'db_tester' && 'text-amber-500',
                currentAgent === 'self_healer' && 'text-rose-500',
                currentAgent === 'reporter' && 'text-indigo-500'
              )}
            >
              {AGENTS.find((a) => a.type === currentAgent)?.label || 'Orchestrator'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {Object.values(agents).filter((a) => a.status === 'completed').length} agents completed
            </span>
            <span>
              {logs.length} events logged
            </span>
          </div>
        </div>

        {/* Current agent message */}
        {agents[currentAgent]?.lastMessage && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-muted-foreground italic truncate"
          >
            &quot;{agents[currentAgent].lastMessage}&quot;
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default OrchestratorVisualizer;
