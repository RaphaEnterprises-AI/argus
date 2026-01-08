'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Search,
  ClipboardList,
  Monitor,
  Globe,
  Database,
  Wrench,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentType, AgentStatus } from './hooks/useOrchestratorState';

interface AgentNodeProps {
  type: AgentType;
  status: AgentStatus;
  label: string;
  x: number;
  y: number;
  size?: number;
  isCenter?: boolean;
  lastMessage?: string;
  onClick?: () => void;
}

// Agent icon mapping
const agentIcons: Record<AgentType, LucideIcon> = {
  orchestrator: Brain,
  code_analyzer: Search,
  test_planner: ClipboardList,
  ui_tester: Monitor,
  api_tester: Globe,
  db_tester: Database,
  self_healer: Wrench,
  reporter: FileText,
};

// Agent colors
const agentColors: Record<AgentType, { bg: string; border: string; text: string; glow: string }> = {
  orchestrator: {
    bg: 'bg-violet-500/20',
    border: 'border-violet-500',
    text: 'text-violet-500',
    glow: 'shadow-violet-500/50',
  },
  code_analyzer: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-500',
    glow: 'shadow-blue-500/50',
  },
  test_planner: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500',
    text: 'text-cyan-500',
    glow: 'shadow-cyan-500/50',
  },
  ui_tester: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-500',
    glow: 'shadow-green-500/50',
  },
  api_tester: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-500',
    glow: 'shadow-orange-500/50',
  },
  db_tester: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/50',
  },
  self_healer: {
    bg: 'bg-rose-500/20',
    border: 'border-rose-500',
    text: 'text-rose-500',
    glow: 'shadow-rose-500/50',
  },
  reporter: {
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-500',
    text: 'text-indigo-500',
    glow: 'shadow-indigo-500/50',
  },
};

// Status to visual style mapping
const getStatusStyles = (status: AgentStatus, colors: typeof agentColors.orchestrator) => {
  switch (status) {
    case 'active':
      return {
        opacity: 1,
        borderColor: colors.border,
        shadow: `shadow-lg ${colors.glow}`,
        scale: 1.05,
      };
    case 'completed':
      return {
        opacity: 1,
        borderColor: 'border-green-500',
        shadow: 'shadow-md shadow-green-500/30',
        scale: 1,
      };
    case 'error':
      return {
        opacity: 1,
        borderColor: 'border-red-500',
        shadow: 'shadow-md shadow-red-500/30',
        scale: 1,
      };
    default:
      return {
        opacity: 0.5,
        borderColor: 'border-muted-foreground/30',
        shadow: '',
        scale: 1,
      };
  }
};

export const AgentNode = memo(function AgentNode({
  type,
  status,
  label,
  x,
  y,
  size = 64,
  isCenter = false,
  lastMessage,
  onClick,
}: AgentNodeProps) {
  const Icon = agentIcons[type];
  const colors = agentColors[type];
  const statusStyles = getStatusStyles(status, colors);

  const nodeSize = isCenter ? size * 1.5 : size;
  const iconSize = isCenter ? 32 : 24;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className={cn('cursor-pointer', onClick && 'hover:opacity-90')}
    >
      {/* Outer pulse ring for active state */}
      {status === 'active' && (
        <>
          <motion.circle
            cx={0}
            cy={0}
            r={nodeSize / 2 + 8}
            fill="none"
            stroke={`url(#pulse-gradient-${type})`}
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.6, 0, 0.6],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.circle
            cx={0}
            cy={0}
            r={nodeSize / 2 + 16}
            fill="none"
            stroke={`url(#pulse-gradient-${type})`}
            strokeWidth={1}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.4, 0, 0.4],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Main node circle */}
      <motion.circle
        cx={0}
        cy={0}
        r={nodeSize / 2}
        className={cn(
          'fill-background stroke-2',
          colors.bg,
          statusStyles.borderColor,
          statusStyles.shadow
        )}
        style={{
          filter:
            status === 'active'
              ? `drop-shadow(0 0 10px ${type === 'orchestrator' ? 'rgb(139, 92, 246)' : colors.glow.replace('shadow-', '').replace('/50', '')})`
              : undefined,
        }}
        initial={{ scale: 0 }}
        animate={{
          scale: statusStyles.scale,
          opacity: statusStyles.opacity,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      />

      {/* Inner glow for active */}
      {status === 'active' && (
        <motion.circle
          cx={0}
          cy={0}
          r={nodeSize / 2 - 4}
          className={cn(colors.bg)}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Icon */}
      <foreignObject
        x={-iconSize / 2}
        y={-iconSize / 2}
        width={iconSize}
        height={iconSize}
        className="pointer-events-none"
      >
        <div className="w-full h-full flex items-center justify-center">
          <motion.div
            animate={
              status === 'active'
                ? {
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon
              className={cn(
                'transition-colors duration-300',
                status === 'active' ? colors.text : 'text-muted-foreground',
                status === 'completed' && 'text-green-500',
                status === 'error' && 'text-red-500'
              )}
              size={iconSize}
            />
          </motion.div>
        </div>
      </foreignObject>

      {/* Label */}
      <text
        y={nodeSize / 2 + 16}
        textAnchor="middle"
        className={cn(
          'text-xs font-medium fill-current',
          status === 'active' ? 'fill-foreground' : 'fill-muted-foreground'
        )}
      >
        {label}
      </text>

      {/* Status indicator dot */}
      <motion.circle
        cx={nodeSize / 2 - 4}
        cy={-nodeSize / 2 + 4}
        r={6}
        className={cn(
          status === 'active' && 'fill-green-500',
          status === 'completed' && 'fill-green-500',
          status === 'error' && 'fill-red-500',
          status === 'idle' && 'fill-muted-foreground/30'
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      />

      {/* Active status pulse */}
      {status === 'active' && (
        <motion.circle
          cx={nodeSize / 2 - 4}
          cy={-nodeSize / 2 + 4}
          r={6}
          className="fill-green-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Tooltip for last message (shown on hover via CSS) */}
      {lastMessage && (
        <title>
          {label}: {lastMessage}
        </title>
      )}
    </g>
  );
});

// Agent node definitions for SVG gradients
export function AgentNodeDefs() {
  return (
    <defs>
      {Object.entries(agentColors).map(([type, colors]) => (
        <radialGradient key={type} id={`pulse-gradient-${type}`}>
          <stop offset="0%" stopColor={colors.text.replace('text-', '')} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.text.replace('text-', '')} stopOpacity="0" />
        </radialGradient>
      ))}
      <radialGradient id="center-glow">
        <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export default AgentNode;
