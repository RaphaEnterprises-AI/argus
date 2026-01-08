'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Circle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExecutionStep, AgentType } from './hooks/useOrchestratorState';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStep: number;
  totalSteps: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

// Agent colors for step badges
const agentColors: Record<AgentType, { bg: string; text: string; border: string }> = {
  orchestrator: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500' },
  code_analyzer: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' },
  test_planner: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500' },
  ui_tester: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500' },
  api_tester: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500' },
  db_tester: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500' },
  self_healer: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500' },
  reporter: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500' },
};

// Status icon mapping
const statusIcons: Record<ExecutionStep['status'], typeof CheckCircle2> = {
  pending: Circle,
  running: Loader2,
  passed: CheckCircle2,
  failed: XCircle,
  skipped: Circle,
};

// Status colors
const statusColors: Record<ExecutionStep['status'], string> = {
  pending: 'text-muted-foreground',
  running: 'text-blue-500',
  passed: 'text-green-500',
  failed: 'text-red-500',
  skipped: 'text-muted-foreground/50',
};

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

// Single step marker component
const StepMarker = memo(function StepMarker({
  step,
  index,
  isCurrent,
  onClick,
}: {
  step: ExecutionStep;
  index: number;
  isCurrent: boolean;
  onClick?: () => void;
}) {
  const Icon = statusIcons[step.status];
  const color = statusColors[step.status];
  const agentColor = agentColors[step.agent];

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center group',
        onClick && 'cursor-pointer'
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Current step indicator */}
      {isCurrent && step.status === 'running' && (
        <motion.div
          className="absolute -inset-3 rounded-full bg-blue-500/20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Step circle */}
      <div
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
          'border-2 bg-background transition-all duration-300',
          isCurrent && step.status === 'running' && 'border-blue-500 shadow-lg shadow-blue-500/30',
          step.status === 'passed' && 'border-green-500 bg-green-500/10',
          step.status === 'failed' && 'border-red-500 bg-red-500/10',
          step.status === 'pending' && 'border-muted-foreground/30',
          step.status === 'skipped' && 'border-muted-foreground/20 bg-muted/50'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            color,
            step.status === 'running' && 'animate-spin'
          )}
        />
      </div>

      {/* Step number */}
      <span
        className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold',
          'flex items-center justify-center bg-background border',
          isCurrent ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
        )}
      >
        {index + 1}
      </span>

      {/* Step name tooltip */}
      <div
        className={cn(
          'absolute top-full mt-2 px-2 py-1 rounded text-xs',
          'bg-popover border shadow-lg z-20',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'whitespace-nowrap pointer-events-none'
        )}
      >
        <p className="font-medium">{step.name}</p>
        <p className={cn('text-[10px]', agentColor.text)}>{step.agent.replace('_', ' ')}</p>
        {step.durationMs && (
          <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatDuration(step.durationMs)}
          </p>
        )}
      </div>
    </motion.button>
  );
});

// Connection line between steps
const StepConnection = memo(function StepConnection({
  fromStatus,
  toStatus,
  index,
}: {
  fromStatus: ExecutionStep['status'];
  toStatus: ExecutionStep['status'];
  index: number;
}) {
  const isActive = fromStatus === 'passed' || fromStatus === 'running';
  const isComplete = fromStatus === 'passed' && toStatus !== 'pending';

  return (
    <div className="flex-1 h-1 mx-1 relative overflow-hidden">
      {/* Background line */}
      <div className="absolute inset-0 bg-muted rounded-full" />

      {/* Progress line */}
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          isComplete ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-muted'
        )}
        initial={{ width: '0%' }}
        animate={{
          width: isComplete ? '100%' : isActive ? '50%' : '0%',
        }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      />

      {/* Animated pulse for active connection */}
      {isActive && !isComplete && (
        <motion.div
          className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
          animate={{
            x: [0, 80, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
});

export function ExecutionTimeline({
  steps,
  currentStep,
  totalSteps,
  onStepClick,
  className,
}: ExecutionTimelineProps) {
  // Generate placeholder steps if we have totalSteps but not enough step data
  const displaySteps = useMemo(() => {
    if (steps.length >= totalSteps) return steps;

    const placeholders: ExecutionStep[] = [];
    for (let i = steps.length; i < totalSteps; i++) {
      placeholders.push({
        id: `placeholder-${i}`,
        index: i,
        name: `Step ${i + 1}`,
        status: 'pending',
        agent: 'orchestrator',
      });
    }
    return [...steps, ...placeholders];
  }, [steps, totalSteps]);

  // Calculate progress
  const passedSteps = steps.filter((s) => s.status === 'passed').length;
  const failedSteps = steps.filter((s) => s.status === 'failed').length;
  const progress = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Execution Timeline</h3>
          <span className="text-xs text-muted-foreground">
            Step {currentStep}/{totalSteps}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {passedSteps}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="h-3.5 w-3.5" />
              {failedSteps}
            </span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  failedSteps > 0 ? 'bg-red-500' : 'bg-green-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {displaySteps.length > 0 ? (
          <div className="flex items-center overflow-x-auto pb-4">
            {displaySteps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <StepMarker
                  step={step}
                  index={index}
                  isCurrent={index === currentStep - 1}
                  onClick={onStepClick ? () => onStepClick(index) : undefined}
                />
                {index < displaySteps.length - 1 && (
                  <StepConnection
                    fromStatus={step.status}
                    toStatus={displaySteps[index + 1].status}
                    index={index}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm">Waiting for execution to start...</span>
          </div>
        )}
      </div>

      {/* Current step details */}
      {displaySteps.length > 0 && currentStep > 0 && currentStep <= displaySteps.length && (
        <div className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {displaySteps[currentStep - 1]?.name || `Step ${currentStep}`}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {displaySteps[currentStep - 1]?.agent.replace('_', ' ')} -{' '}
                {displaySteps[currentStep - 1]?.status}
              </p>
            </div>
            {displaySteps[currentStep - 1]?.durationMs && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(displaySteps[currentStep - 1].durationMs!)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionTimeline;
