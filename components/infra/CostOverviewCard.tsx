'use client';

import * as React from 'react';
import { DollarSign, Server, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface CostOverviewData {
  currentMonthCost: number;
  projectedMonthCost: number;
  totalNodes: number;
  totalPods: number;
  // Cost breakdown by platform
  vultrCost?: number;
  railwayCost?: number;
  cloudflareCost?: number;
  aiCost?: number;
}

interface CostOverviewCardProps {
  data: CostOverviewData | null;
  isLoading?: boolean;
}

export function CostOverviewCard({ data, isLoading = false }: CostOverviewCardProps) {
  if (isLoading) {
    return <CostOverviewCardSkeleton />;
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Infrastructure Cost Overview
            </CardTitle>
            <CardDescription>
              Real-time costs across Vultr, Railway, and Cloudflare
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Month Cost */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Month</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(data.currentMonthCost)}
            </p>
            <p className="text-xs text-muted-foreground">
              Projected: {formatCurrency(data.projectedMonthCost)}
            </p>
          </div>

          {/* Active Nodes */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active Nodes</p>
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-info/50" />
              <div>
                <p className="text-3xl font-bold">{data.totalNodes}</p>
                <p className="text-xs text-muted-foreground">Vultr K8s nodes</p>
              </div>
            </div>
          </div>

          {/* Browser Pods */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Browser Pods</p>
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-info/50" />
              <div>
                <p className="text-3xl font-bold">{data.totalPods}</p>
                <p className="text-xs text-muted-foreground">KEDA-managed pods</p>
              </div>
            </div>
          </div>

          {/* AI Costs */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">AI Inference</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(data.aiCost || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Claude + embeddings
            </p>
          </div>
        </div>

        {/* Cost Breakdown Bar */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cost Breakdown by Platform</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            {data.vultrCost && data.vultrCost > 0 && (
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(data.vultrCost / data.projectedMonthCost) * 100}%` }}
                title={`Vultr: ${formatCurrency(data.vultrCost)}`}
              />
            )}
            {data.railwayCost && data.railwayCost > 0 && (
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${(data.railwayCost / data.projectedMonthCost) * 100}%` }}
                title={`Railway: ${formatCurrency(data.railwayCost)}`}
              />
            )}
            {data.cloudflareCost && data.cloudflareCost > 0 && (
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${(data.cloudflareCost / data.projectedMonthCost) * 100}%` }}
                title={`Cloudflare: ${formatCurrency(data.cloudflareCost)}`}
              />
            )}
            {data.aiCost && data.aiCost > 0 && (
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(data.aiCost / data.projectedMonthCost) * 100}%` }}
                title={`AI: ${formatCurrency(data.aiCost)}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Vultr: {formatCurrency(data.vultrCost || 0)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Railway: {formatCurrency(data.railwayCost || 0)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Cloudflare: {formatCurrency(data.cloudflareCost || 0)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              AI: {formatCurrency(data.aiCost || 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CostOverviewCardSkeleton() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="h-6 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-9 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
