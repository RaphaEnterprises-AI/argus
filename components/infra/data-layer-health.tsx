'use client';

import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  HelpCircle,
  MessageSquare,
  Monitor,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ComponentHealth, DataLayerHealth, HealthStatus } from '@/lib/hooks/use-infra';

interface DataLayerHealthPanelProps {
  data: DataLayerHealth | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const statusConfig: Record<
  HealthStatus,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  healthy: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Healthy',
  },
  degraded: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Degraded',
  },
  unhealthy: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Unhealthy',
  },
  unknown: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    icon: <HelpCircle className="h-4 w-4" />,
    label: 'Unknown',
  },
};

const componentIcons: Record<string, React.ReactNode> = {
  Redpanda: <MessageSquare className="h-4 w-4" />,
  FalkorDB: <Database className="h-4 w-4" />,
  Valkey: <Zap className="h-4 w-4" />,
  Cognee: <Activity className="h-4 w-4" />,
  'Selenium Grid': <Monitor className="h-4 w-4" />,
  Prometheus: <Server className="h-4 w-4" />,
  Supabase: <Database className="h-4 w-4" />,
};

function ComponentRow({ component }: { component: ComponentHealth }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[component.status] || statusConfig.unknown;
  const icon = componentIcons[component.name] || <Server className="h-4 w-4" />;

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium">{component.name}</span>
          <Badge variant="outline" className={cn('text-xs', status.color, status.bgColor)}>
            <span className="mr-1">{status.icon}</span>
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          {component.latency_ms !== null && (
            <span className="text-sm text-muted-foreground">{component.latency_ms}ms</span>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="ml-7 p-3 bg-muted/30 rounded-md text-sm space-y-2">
            {component.message && (
              <div>
                <span className="text-muted-foreground">Message: </span>
                <span>{component.message}</span>
              </div>
            )}
            {component.details && Object.keys(component.details).length > 0 && (
              <div>
                <span className="text-muted-foreground">Details: </span>
                <pre className="mt-1 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(component.details, null, 2)}
                </pre>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Last checked: {new Date(component.checked_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DataLayerHealthPanel({
  data,
  onRefresh,
  isRefreshing = false,
}: DataLayerHealthPanelProps) {
  if (!data) {
    return <DataLayerHealthPanelSkeleton />;
  }

  const overallStatus = statusConfig[data.overall_status] || statusConfig.unknown;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Data Layer Health</CardTitle>
            <Badge
              variant="outline"
              className={cn('text-sm', overallStatus.color, overallStatus.bgColor)}
            >
              <span className="mr-1">{overallStatus.icon}</span>
              {overallStatus.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {data.healthy_count}/{data.total_count} healthy
            </span>
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-lg divide-y">
          {data.components.map((component) => (
            <ComponentRow key={component.name} component={component} />
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-right">
          Last updated: {new Date(data.checked_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export function DataLayerHealthPanelSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-lg">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact health indicator for the overview page
export function DataLayerHealthIndicator({
  data,
}: {
  data: DataLayerHealth | null;
}) {
  if (!data) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  const status = statusConfig[data.overall_status] || statusConfig.unknown;

  return (
    <div className={cn('flex items-center gap-2', status.color)}>
      {status.icon}
      <span className="text-sm font-medium">
        {data.healthy_count}/{data.total_count} Systems
      </span>
    </div>
  );
}
