'use client';

import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isLoading?: boolean;
}

const colorVariants = {
  default: {
    icon: 'text-muted-foreground/50',
    trend: 'text-muted-foreground',
    bg: 'bg-muted/50',
  },
  success: {
    icon: 'text-success/50',
    trend: 'text-success',
    bg: 'bg-success/10',
  },
  warning: {
    icon: 'text-warning/50',
    trend: 'text-warning',
    bg: 'bg-warning/10',
  },
  error: {
    icon: 'text-error/50',
    trend: 'text-error',
    bg: 'bg-error/10',
  },
  info: {
    icon: 'text-info/50',
    trend: 'text-info',
    bg: 'bg-info/10',
  },
};

export function MetricCard({
  title,
  value,
  trend,
  icon,
  color = 'default',
  isLoading = false,
}: MetricCardProps) {
  const colors = colorVariants[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <ArrowUpRight className="h-3.5 w-3.5" />;
      case 'down':
        return <ArrowDownRight className="h-3.5 w-3.5" />;
      default:
        return <Minus className="h-3.5 w-3.5" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    // For metrics where up is good (like pass rate)
    if (color === 'success') {
      return trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-error' : 'text-muted-foreground';
    }
    // For metrics where down is good (like failures, duration)
    if (color === 'error' || color === 'warning') {
      return trend.direction === 'down' ? 'text-success' : trend.direction === 'up' ? 'text-error' : 'text-muted-foreground';
    }
    return colors.trend;
  };

  return (
    <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                color === 'success' && 'text-success',
                color === 'error' && 'text-error',
                color === 'warning' && 'text-warning',
                color === 'info' && 'text-info'
              )}>
                {value}
              </span>
            </div>
          )}
          {trend && !isLoading && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-muted-foreground ml-1">{trend.period}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'h-12 w-12 rounded-lg flex items-center justify-center transition-colors',
          colors.bg,
          'group-hover:scale-110 transition-transform'
        )}>
          <div className={colors.icon}>
            {icon}
          </div>
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity',
        color === 'success' && 'bg-gradient-to-r from-success/50 to-success',
        color === 'error' && 'bg-gradient-to-r from-error/50 to-error',
        color === 'warning' && 'bg-gradient-to-r from-warning/50 to-warning',
        color === 'info' && 'bg-gradient-to-r from-info/50 to-info',
        color === 'default' && 'bg-gradient-to-r from-primary/50 to-primary'
      )} />
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-12 w-12 bg-muted animate-pulse rounded-lg" />
      </div>
    </Card>
  );
}
