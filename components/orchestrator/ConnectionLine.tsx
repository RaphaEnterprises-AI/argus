'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AgentType, AgentStatus } from './hooks/useOrchestratorState';

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromAgent: AgentType;
  toAgent: AgentType;
  fromStatus: AgentStatus;
  toStatus: AgentStatus;
  isActive?: boolean;
  isBidirectional?: boolean;
  className?: string;
}

// Agent colors for connections
const agentColors: Record<AgentType, string> = {
  orchestrator: '#8b5cf6', // violet
  code_analyzer: '#3b82f6', // blue
  test_planner: '#06b6d4', // cyan
  ui_tester: '#22c55e', // green
  api_tester: '#f97316', // orange
  db_tester: '#f59e0b', // amber
  self_healer: '#f43f5e', // rose
  reporter: '#6366f1', // indigo
};

export const ConnectionLine = memo(function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromAgent,
  toAgent,
  fromStatus,
  toStatus,
  isActive = false,
  isBidirectional = false,
  className,
}: ConnectionLineProps) {
  // Calculate path and animation properties
  const pathData = useMemo(() => {
    // Calculate control point for curved line
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    // Add slight curve based on distance
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular offset for curve
    const curveFactor = distance * 0.15;
    const perpX = -dy / distance;
    const perpY = dx / distance;

    const controlX = midX + perpX * curveFactor;
    const controlY = midY + perpY * curveFactor;

    return {
      path: `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`,
      length: distance * 1.2, // Approximate curved length
      midX: controlX,
      midY: controlY,
    };
  }, [fromX, fromY, toX, toY]);

  // Determine connection state
  const isConnected = fromStatus !== 'idle' || toStatus !== 'idle';
  const hasDataFlow = isActive || fromStatus === 'active' || toStatus === 'active';

  // Get gradient colors
  const fromColor = agentColors[fromAgent];
  const toColor = agentColors[toAgent];
  const gradientId = `gradient-${fromAgent}-${toAgent}`;
  const flowGradientId = `flow-${fromAgent}-${toAgent}`;

  return (
    <g className={cn('connection-line', className)}>
      {/* Gradient definitions */}
      <defs>
        {/* Static gradient for line */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fromColor} stopOpacity={isConnected ? 0.6 : 0.2} />
          <stop offset="100%" stopColor={toColor} stopOpacity={isConnected ? 0.6 : 0.2} />
        </linearGradient>

        {/* Animated flow gradient */}
        <linearGradient id={flowGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <motion.stop
            offset="0%"
            stopColor={fromColor}
            animate={{
              stopOpacity: hasDataFlow ? [0.8, 1, 0.8] : 0.3,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.stop
            offset="50%"
            stopColor="white"
            animate={{
              stopOpacity: hasDataFlow ? [0.4, 0.8, 0.4] : 0.1,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
          <motion.stop
            offset="100%"
            stopColor={toColor}
            animate={{
              stopOpacity: hasDataFlow ? [0.8, 1, 0.8] : 0.3,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow for active connections */}
      {hasDataFlow && (
        <motion.path
          d={pathData.path}
          fill="none"
          stroke={`url(#${flowGradientId})`}
          strokeWidth={6}
          strokeLinecap="round"
          filter={`url(#glow-${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main connection line */}
      <motion.path
        d={pathData.path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={hasDataFlow ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeDasharray={isConnected ? 'none' : '4 4'}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: 1,
          opacity: 1,
        }}
        transition={{
          pathLength: { duration: 0.8, ease: 'easeOut' },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Animated data flow particles */}
      {hasDataFlow && (
        <>
          {/* Forward flow particles */}
          {[0, 0.33, 0.66].map((delay, i) => (
            <motion.circle
              key={`forward-${i}`}
              r={3}
              fill={fromColor}
              filter={`url(#glow-${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                begin={`${delay}s`}
                path={pathData.path}
              />
            </motion.circle>
          ))}

          {/* Backward flow particles for bidirectional */}
          {isBidirectional &&
            [0.15, 0.48, 0.81].map((delay, i) => (
              <motion.circle
                key={`backward-${i}`}
                r={2.5}
                fill={toColor}
                filter={`url(#glow-${gradientId})`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.8, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  begin={`${delay}s`}
                  path={pathData.path}
                  keyPoints="1;0"
                  keyTimes="0;1"
                />
              </motion.circle>
            ))}
        </>
      )}

      {/* Pulse effect at midpoint for active connections */}
      {hasDataFlow && (
        <motion.circle
          cx={pathData.midX}
          cy={pathData.midY}
          r={4}
          fill="white"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </g>
  );
});

// Connection line definitions for SVG
export function ConnectionLineDefs() {
  return (
    <defs>
      <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="blur" operator="over" />
      </filter>
    </defs>
  );
}

export default ConnectionLine;
