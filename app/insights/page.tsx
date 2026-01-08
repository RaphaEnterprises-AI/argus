'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingUp,
  Check,
  Sparkles,
  BarChart3,
  RefreshCcw,
  Layers,
  AlertCircle,
  Clock,
  Zap,
  XCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAIInsights, useResolveInsight, useInsightStats } from '@/lib/hooks/use-insights';
import { Badge } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

// Failure pattern clusters (mock data since not in schema)
interface FailureCluster {
  id: string;
  name: string;
  count: number;
  percentage: number;
  errorType: string;
  affectedTests: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

// Coverage gap analysis
interface CoverageGap {
  id: string;
  area: string;
  type: 'page' | 'component' | 'flow' | 'api';
  coverage: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedTests: number;
  impact: string;
}

// Flaky test analysis
interface FlakyTest {
  id: string;
  name: string;
  flakinessScore: number;
  passRate: number;
  failureCount: number;
  totalRuns: number;
  rootCause: string;
  suggestedFix: string;
  lastFlake: string;
}

export default function InsightsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'coverage' | 'flaky'>('insights');

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const currentProject = selectedProjectId || projects[0]?.id;

  const { data: insights = [], isLoading: insightsLoading } = useAIInsights(currentProject || null);
  const { data: stats } = useInsightStats(currentProject || null);
  const resolveInsight = useResolveInsight();

  const isLoading = projectsLoading || insightsLoading;

  // Mock failure clusters data
  const failureClusters: FailureCluster[] = useMemo(() => [
    { id: '1', name: 'Timeout Errors', count: 45, percentage: 35, errorType: 'timeout', affectedTests: 12, trend: 'up', color: 'bg-red-500' },
    { id: '2', name: 'Element Not Found', count: 32, percentage: 25, errorType: 'element', affectedTests: 8, trend: 'down', color: 'bg-orange-500' },
    { id: '3', name: 'Network Failures', count: 26, percentage: 20, errorType: 'network', affectedTests: 6, trend: 'stable', color: 'bg-yellow-500' },
    { id: '4', name: 'Assertion Failures', count: 15, percentage: 12, errorType: 'assertion', affectedTests: 5, trend: 'down', color: 'bg-blue-500' },
    { id: '5', name: 'Authentication Issues', count: 10, percentage: 8, errorType: 'auth', affectedTests: 3, trend: 'stable', color: 'bg-purple-500' },
  ], []);

  // Mock coverage gaps data
  const coverageGaps: CoverageGap[] = useMemo(() => [
    { id: '1', area: '/checkout/payment', type: 'page', coverage: 15, priority: 'critical', suggestedTests: 5, impact: 'High revenue impact' },
    { id: '2', area: 'UserProfileForm', type: 'component', coverage: 22, priority: 'high', suggestedTests: 3, impact: 'User data integrity' },
    { id: '3', area: 'Password Reset Flow', type: 'flow', coverage: 30, priority: 'high', suggestedTests: 4, impact: 'Authentication security' },
    { id: '4', area: '/api/orders', type: 'api', coverage: 45, priority: 'medium', suggestedTests: 2, impact: 'Order processing' },
    { id: '5', area: 'SearchAutocomplete', type: 'component', coverage: 50, priority: 'medium', suggestedTests: 2, impact: 'User experience' },
    { id: '6', area: '/settings/billing', type: 'page', coverage: 55, priority: 'low', suggestedTests: 1, impact: 'Billing management' },
  ], []);

  // Mock flaky tests data
  const flakyTests: FlakyTest[] = useMemo(() => [
    { id: '1', name: 'Cart checkout with discount code', flakinessScore: 85, passRate: 72, failureCount: 28, totalRuns: 100, rootCause: 'Race condition in discount calculation', suggestedFix: 'Add wait for discount API response before proceeding', lastFlake: '2h ago' },
    { id: '2', name: 'User profile image upload', flakinessScore: 72, passRate: 78, failureCount: 22, totalRuns: 100, rootCause: 'Unstable file upload timing', suggestedFix: 'Increase upload timeout and add retry logic', lastFlake: '4h ago' },
    { id: '3', name: 'Search autocomplete suggestions', flakinessScore: 65, passRate: 82, failureCount: 18, totalRuns: 100, rootCause: 'Debounce timing inconsistency', suggestedFix: 'Mock debounce timer in test environment', lastFlake: '6h ago' },
    { id: '4', name: 'Dashboard data refresh', flakinessScore: 58, passRate: 85, failureCount: 15, totalRuns: 100, rootCause: 'WebSocket connection delays', suggestedFix: 'Add WebSocket connection ready check', lastFlake: '12h ago' },
    { id: '5', name: 'Multi-step form submission', flakinessScore: 45, passRate: 89, failureCount: 11, totalRuns: 100, rootCause: 'Form validation race condition', suggestedFix: 'Wait for all validations before submit', lastFlake: '1d ago' },
  ], []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp;
      case 'anomaly': return AlertTriangle;
      case 'suggestion': return Lightbulb;
      default: return Target;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      default: return <span className="h-4 w-4 text-muted-foreground">-</span>;
    }
  };

  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground">Create a project to start getting AI insights.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-6">
            <select
              value={currentProject || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-3 ml-4">
              {stats && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    <span className="font-medium">{stats.bySeverity.critical}</span>
                    <span className="text-muted-foreground">critical</span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{stats.unresolved}</span>
                    <span className="text-muted-foreground">active</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Insights
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 px-6 border-t">
            <button
              onClick={() => setActiveTab('insights')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'insights'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                AI Insights
              </span>
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'patterns'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Failure Patterns
              </span>
            </button>
            <button
              onClick={() => setActiveTab('coverage')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'coverage'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Coverage Gaps
              </span>
            </button>
            <button
              onClick={() => setActiveTab('flaky')}
              className={cn(
                'py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'flaky'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1">
                <RefreshCcw className="h-4 w-4" />
                Flaky Tests
              </span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold">{stats?.unresolved || 0}</div>
              <div className="text-sm text-muted-foreground">Active Insights</div>
            </div>
            <div className="p-4 rounded-lg border bg-card border-error/20 bg-error/5">
              <div className="text-2xl font-bold text-error">{stats?.bySeverity.critical || 0}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="p-4 rounded-lg border bg-card border-warning/20 bg-warning/5">
              <div className="text-2xl font-bold text-warning">{stats?.bySeverity.high || 0}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-2xl font-bold text-success">{stats?.resolved || 0}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>

          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Insights</h3>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : insights.length > 0 ? (
                  insights.map((insight) => {
                    const Icon = getInsightIcon(insight.insight_type);
                    return (
                      <div
                        key={insight.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          insight.severity === 'critical' && 'border-error/30 bg-error/5',
                          insight.severity === 'high' && 'border-warning/30 bg-warning/5'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'p-2 rounded-lg',
                            insight.severity === 'critical' ? 'bg-error/10' : 'bg-primary/10'
                          )}>
                            <Icon className={cn(
                              'h-5 w-5',
                              insight.severity === 'critical' ? 'text-error' : 'text-primary'
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{insight.title}</span>
                              <Badge variant={insight.severity === 'critical' ? 'error' : insight.severity === 'high' ? 'warning' : 'info'}>
                                {insight.severity}
                              </Badge>
                              <Badge variant="outline">{insight.insight_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                            {insight.suggested_action && (
                              <p className="text-sm text-primary">{insight.suggested_action}</p>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                              {insight.confidence && ` | ${(insight.confidence * 100).toFixed(0)}% confidence`}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => currentProject && resolveInsight.mutate({
                              insightId: insight.id,
                              projectId: currentProject,
                            })}
                            disabled={resolveInsight.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No active insights. Your tests are running smoothly!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Failure Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="space-y-6">
              {/* Failure Clustering Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Failure Pattern Distribution
                  </CardTitle>
                  <CardDescription>
                    Common failure patterns detected across your test suite
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Visual Chart */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        {/* Simple pie chart visualization using conic gradients */}
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: `conic-gradient(
                              #ef4444 0% 35%,
                              #f97316 35% 60%,
                              #eab308 60% 80%,
                              #3b82f6 80% 92%,
                              #8b5cf6 92% 100%
                            )`
                          }}
                        />
                        <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold">128</div>
                            <div className="text-xs text-muted-foreground">Total Failures</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3">
                      {failureClusters.map((cluster) => (
                        <div key={cluster.id} className="flex items-center gap-3">
                          <div className={cn('w-3 h-3 rounded-full', cluster.color)} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{cluster.name}</span>
                              <span className="text-sm text-muted-foreground">{cluster.percentage}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{cluster.count} occurrences</span>
                              <span>|</span>
                              <span>{cluster.affectedTests} tests</span>
                              {getTrendIcon(cluster.trend)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Pattern Analysis</CardTitle>
                  <CardDescription>Detailed breakdown of each failure pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {failureClusters.map((cluster) => (
                      <div key={cluster.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-2 h-8 rounded-full', cluster.color)} />
                            <div>
                              <div className="font-medium">{cluster.name}</div>
                              <div className="text-sm text-muted-foreground">{cluster.count} occurrences in {cluster.affectedTests} tests</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(cluster.trend)}
                            <Button size="sm" variant="outline">View Tests</Button>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', cluster.color)}
                            style={{ width: `${cluster.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Coverage Gaps Tab */}
          {activeTab === 'coverage' && (
            <div className="space-y-6">
              {/* Coverage Overview */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-red-500/10">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">2</p>
                        <p className="text-sm text-muted-foreground">Critical Gaps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-orange-500/10">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-muted-foreground">High Priority</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">17</p>
                        <p className="text-sm text-muted-foreground">Tests Suggested</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">72%</p>
                        <p className="text-sm text-muted-foreground">Overall Coverage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coverage Gaps List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Identified Coverage Gaps
                  </CardTitle>
                  <CardDescription>
                    Areas of your application that need more test coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coverageGaps.map((gap) => (
                      <div
                        key={gap.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          gap.priority === 'critical' && 'border-red-500/30 bg-red-500/5',
                          gap.priority === 'high' && 'border-orange-500/30 bg-orange-500/5'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="px-2 py-0.5 rounded bg-muted text-sm font-mono">{gap.area}</code>
                              <Badge variant={
                                gap.priority === 'critical' ? 'error' :
                                gap.priority === 'high' ? 'warning' :
                                gap.priority === 'medium' ? 'info' : 'default'
                              }>
                                {gap.priority}
                              </Badge>
                              <Badge variant="outline">{gap.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{gap.impact}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Current Coverage</span>
                                  <span className={cn(
                                    gap.coverage < 30 ? 'text-red-500' :
                                    gap.coverage < 50 ? 'text-orange-500' :
                                    gap.coverage < 70 ? 'text-yellow-500' : 'text-green-500'
                                  )}>{gap.coverage}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      gap.coverage < 30 ? 'bg-red-500' :
                                      gap.coverage < 50 ? 'bg-orange-500' :
                                      gap.coverage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    )}
                                    style={{ width: `${gap.coverage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="text-right mr-4">
                              <div className="text-lg font-bold">{gap.suggestedTests}</div>
                              <div className="text-xs text-muted-foreground">tests needed</div>
                            </div>
                            <Button size="sm">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Flaky Tests Tab */}
          {activeTab === 'flaky' && (
            <div className="space-y-6">
              {/* Flaky Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-red-500/10">
                        <RefreshCcw className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">5</p>
                        <p className="text-sm text-muted-foreground">Flaky Tests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-orange-500/10">
                        <XCircle className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">94</p>
                        <p className="text-sm text-muted-foreground">Flaky Failures</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-yellow-500/10">
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">4.2h</p>
                        <p className="text-sm text-muted-foreground">Time Wasted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <Zap className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">3</p>
                        <p className="text-sm text-muted-foreground">Auto-Fixed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flaky Tests List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-primary" />
                    Flaky Test Analysis
                  </CardTitle>
                  <CardDescription>
                    Tests with inconsistent results and their root causes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flakyTests.map((test) => (
                      <div key={test.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{test.name}</span>
                              <Badge variant={
                                test.flakinessScore > 70 ? 'error' :
                                test.flakinessScore > 50 ? 'warning' : 'info'
                              }>
                                {test.flakinessScore}% flaky
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{test.passRate}% pass rate</span>
                              <span>|</span>
                              <span>{test.failureCount}/{test.totalRuns} failures</span>
                              <span>|</span>
                              <span>Last flake: {test.lastFlake}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">Quarantine</Button>
                            <Button size="sm">
                              <Zap className="h-4 w-4 mr-2" />
                              Auto-Fix
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-red-500 mb-1">
                              <AlertCircle className="h-4 w-4" />
                              Root Cause
                            </div>
                            <p className="text-sm text-muted-foreground">{test.rootCause}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-green-500 mb-1">
                              <Lightbulb className="h-4 w-4" />
                              Suggested Fix
                            </div>
                            <p className="text-sm text-muted-foreground">{test.suggestedFix}</p>
                          </div>
                        </div>

                        {/* Flakiness indicator bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Flakiness Score</span>
                            <span className={cn(
                              test.flakinessScore > 70 ? 'text-red-500' :
                              test.flakinessScore > 50 ? 'text-orange-500' : 'text-yellow-500'
                            )}>{test.flakinessScore}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                test.flakinessScore > 70 ? 'bg-red-500' :
                                test.flakinessScore > 50 ? 'bg-orange-500' : 'bg-yellow-500'
                              )}
                              style={{ width: `${test.flakinessScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
