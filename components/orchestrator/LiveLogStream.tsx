'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Brain,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Pause,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { OrchestratorLog, AgentType } from './hooks/useOrchestratorState';

interface LiveLogStreamProps {
  logs: OrchestratorLog[];
  className?: string;
  maxHeight?: string;
}

// Agent display names
const agentDisplayNames: Record<AgentType, string> = {
  orchestrator: 'Orchestrator',
  code_analyzer: 'Code Analyzer',
  test_planner: 'Test Planner',
  ui_tester: 'UI Tester',
  api_tester: 'API Tester',
  db_tester: 'DB Tester',
  self_healer: 'Self Healer',
  reporter: 'Reporter',
};

// Agent colors for log entries
const agentColors: Record<AgentType, string> = {
  orchestrator: 'text-violet-500',
  code_analyzer: 'text-blue-500',
  test_planner: 'text-cyan-500',
  ui_tester: 'text-green-500',
  api_tester: 'text-orange-500',
  db_tester: 'text-amber-500',
  self_healer: 'text-rose-500',
  reporter: 'text-indigo-500',
};

// Log level styling
const logLevelStyles: Record<
  OrchestratorLog['level'],
  { icon: typeof Info; color: string; bg: string }
> = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  thinking: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

// Format timestamp
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Single log entry component
const LogEntry = memo(function LogEntry({
  log,
  isNew,
}: {
  log: OrchestratorLog;
  isNew: boolean;
}) {
  const style = logLevelStyles[log.level];
  const Icon = style.icon;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, height: 0 } : false}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-2 py-2 px-3 border-l-2 hover:bg-muted/30 transition-colors',
        log.level === 'error' && 'border-l-red-500 bg-red-500/5',
        log.level === 'success' && 'border-l-green-500',
        log.level === 'thinking' && 'border-l-purple-500 bg-purple-500/5',
        log.level === 'warning' && 'border-l-yellow-500 bg-yellow-500/5',
        log.level === 'info' && 'border-l-blue-500/50'
      )}
    >
      {/* Timestamp */}
      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Agent badge */}
      <span
        className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap',
          agentColors[log.agent],
          'bg-current/10'
        )}
      >
        {agentDisplayNames[log.agent]}
      </span>

      {/* Level icon */}
      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0 mt-0.5',
          style.color,
          log.level === 'thinking' && 'animate-pulse'
        )}
      />

      {/* Message */}
      <span
        className={cn(
          'text-sm flex-1',
          log.level === 'error' && 'text-red-500',
          log.level === 'thinking' && 'text-purple-500 italic'
        )}
      >
        {log.message}
      </span>
    </motion.div>
  );
});

export function LiveLogStream({ logs, className, maxHeight = '400px' }: LiveLogStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Set<OrchestratorLog['level']>>(
    new Set(['info', 'success', 'error', 'thinking', 'warning'])
  );
  const [selectedAgents, setSelectedAgents] = useState<Set<AgentType>>(
    new Set([
      'orchestrator',
      'code_analyzer',
      'test_planner',
      'ui_tester',
      'api_tester',
      'db_tester',
      'self_healer',
      'reporter',
    ])
  );
  const [copied, setCopied] = useState(false);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

  // Track new logs for animation
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      setNewLogIds((prev) => new Set([...prev, latestLog.id]));

      // Remove from new set after animation
      const timer = setTimeout(() => {
        setNewLogIds((prev) => {
          const next = new Set(prev);
          next.delete(latestLog.id);
          return next;
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [logs]);

  // Auto-scroll to bottom when new logs arrive (unless paused)
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  // Pause on scroll up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isAtBottom && !isPaused) {
      setIsPaused(true);
    }
  }, [isPaused]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (!selectedLevels.has(log.level)) return false;
    if (!selectedAgents.has(log.agent)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        agentDisplayNames[log.agent].toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Copy logs to clipboard
  const handleCopy = async () => {
    const text = filteredLogs
      .map((log) => `[${formatTimestamp(log.timestamp)}] [${agentDisplayNames[log.agent]}] ${log.message}`)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle level filter
  const toggleLevel = (level: OrchestratorLog['level']) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Toggle agent filter
  const toggleAgent = (agent: AgentType) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) {
        next.delete(agent);
      } else {
        next.add(agent);
      }
      return next;
    });
  };

  return (
    <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Live Log Stream</h3>
          <span className="text-xs text-muted-foreground">
            ({filteredLogs.length} / {logs.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Pause/Resume */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Filters toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 w-7 p-0', showFilters && 'bg-muted')}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>

          {/* Copy */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy logs"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
          >
            <div className="p-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Level filters */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Log Levels</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(logLevelStyles).map(([level, style]) => {
                    const isSelected = selectedLevels.has(level as OrchestratorLog['level']);
                    return (
                      <button
                        key={level}
                        onClick={() => toggleLevel(level as OrchestratorLog['level'])}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          isSelected ? style.bg : 'bg-muted',
                          isSelected ? style.color : 'text-muted-foreground'
                        )}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Agent filters */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Agents</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(agentDisplayNames).map(([agent, name]) => {
                    const isSelected = selectedAgents.has(agent as AgentType);
                    return (
                      <button
                        key={agent}
                        onClick={() => toggleAgent(agent as AgentType)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          isSelected
                            ? cn(agentColors[agent as AgentType], 'bg-current/10')
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-500/10 border-b border-yellow-500/20 px-3 py-1.5 flex items-center justify-between"
          >
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Auto-scroll paused
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setIsPaused(false);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
            >
              Resume
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono"
        style={{ maxHeight }}
      >
        {filteredLogs.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <LogEntry key={log.id} log={log} isNew={newLogIds.has(log.id)} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {logs.length === 0 ? 'Waiting for logs...' : 'No logs match filters'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {logs.filter((l) => l.level === 'success').length}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {logs.filter((l) => l.level === 'error').length}
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-purple-500" />
            {logs.filter((l) => l.level === 'thinking').length}
          </span>
        </div>
        {logs.length > 0 && (
          <span>
            Last update: {formatTimestamp(logs[logs.length - 1].timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default LiveLogStream;
