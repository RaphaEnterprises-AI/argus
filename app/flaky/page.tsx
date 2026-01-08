'use client';

import { useState, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Ban,
  Play,
  Wrench,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Target,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock flaky test data
const mockFlakyTests = [
  {
    id: '1',
    name: 'User Login with SSO',
    path: 'tests/auth/login.spec.ts',
    flakinessScore: 0.45,
    totalRuns: 100,
    passCount: 55,
    failCount: 45,
    lastRun: '2024-01-08T10:30:00Z',
    trend: 'increasing' as const,
    isQuarantined: false,
    rootCauses: [
      { type: 'timing', description: 'Race condition with SSO redirect', confidence: 0.85 },
      { type: 'network', description: 'Intermittent API timeout', confidence: 0.65 },
    ],
    recentResults: [true, false, true, true, false, false, true, false, true, true],
    avgDuration: 4500,
    suggestedFix: 'Add explicit wait for SSO callback and increase timeout for auth API calls',
  },
  {
    id: '2',
    name: 'Checkout Payment Flow',
    path: 'tests/checkout/payment.spec.ts',
    flakinessScore: 0.32,
    totalRuns: 80,
    passCount: 54,
    failCount: 26,
    lastRun: '2024-01-08T09:15:00Z',
    trend: 'decreasing' as const,
    isQuarantined: false,
    rootCauses: [
      { type: 'external', description: 'Payment gateway response variability', confidence: 0.72 },
    ],
    recentResults: [true, true, false, true, true, true, false, true, true, true],
    avgDuration: 6200,
    suggestedFix: 'Mock payment gateway responses in CI environment',
  },
  {
    id: '3',
    name: 'Dashboard Widget Load',
    path: 'tests/dashboard/widgets.spec.ts',
    flakinessScore: 0.28,
    totalRuns: 150,
    passCount: 108,
    failCount: 42,
    lastRun: '2024-01-08T11:00:00Z',
    trend: 'stable' as const,
    isQuarantined: true,
    rootCauses: [
      { type: 'timing', description: 'Widget animation completion detection', confidence: 0.90 },
    ],
    recentResults: [false, false, true, false, true, false, false, true, false, true],
    avgDuration: 3100,
    suggestedFix: 'Wait for animation complete event instead of fixed timeout',
  },
  {
    id: '4',
    name: 'Search Results Pagination',
    path: 'tests/search/pagination.spec.ts',
    flakinessScore: 0.18,
    totalRuns: 200,
    passCount: 164,
    failCount: 36,
    lastRun: '2024-01-08T08:45:00Z',
    trend: 'decreasing' as const,
    isQuarantined: false,
    rootCauses: [
      { type: 'data', description: 'Test data dependency on seed state', confidence: 0.78 },
    ],
    recentResults: [true, true, true, false, true, true, true, true, false, true],
    avgDuration: 2800,
    suggestedFix: 'Isolate test data using fixtures with consistent seed',
  },
  {
    id: '5',
    name: 'Real-time Notifications',
    path: 'tests/notifications/realtime.spec.ts',
    flakinessScore: 0.52,
    totalRuns: 60,
    passCount: 29,
    failCount: 31,
    lastRun: '2024-01-08T10:00:00Z',
    trend: 'increasing' as const,
    isQuarantined: true,
    rootCauses: [
      { type: 'network', description: 'WebSocket connection instability', confidence: 0.88 },
      { type: 'timing', description: 'Message delivery timing variance', confidence: 0.75 },
    ],
    recentResults: [false, true, false, false, true, false, true, false, false, true],
    avgDuration: 5800,
    suggestedFix: 'Implement WebSocket connection retry with exponential backoff',
  },
];

// Flakiness trend data for chart
const trendData = [
  { date: 'Dec 1', flaky: 12, fixed: 2 },
  { date: 'Dec 8', flaky: 15, fixed: 4 },
  { date: 'Dec 15', flaky: 14, fixed: 6 },
  { date: 'Dec 22', flaky: 11, fixed: 8 },
  { date: 'Dec 29', flaky: 9, fixed: 10 },
  { date: 'Jan 5', flaky: 7, fixed: 12 },
  { date: 'Jan 8', flaky: 5, fixed: 14 },
];

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

function getSeverity(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.4) return 'high';
  if (score >= 0.2) return 'medium';
  return 'low';
}

function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return 'text-red-500 bg-red-500/10';
    case 'medium':
      return 'text-amber-500 bg-amber-500/10';
    case 'low':
      return 'text-blue-500 bg-blue-500/10';
  }
}

function FlakyTestCard({
  test,
  onQuarantine,
  onRunTest,
  onApplyFix,
}: {
  test: (typeof mockFlakyTests)[0];
  onQuarantine: (id: string) => void;
  onRunTest: (id: string) => void;
  onApplyFix: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverity(test.flakinessScore);
  const severityColor = getSeverityColor(severity);

  return (
    <Card className={cn('transition-all duration-200', test.isQuarantined && 'opacity-60')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 hover:bg-muted rounded transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <CardTitle className="text-base truncate">{test.name}</CardTitle>
              {test.isQuarantined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                  <Ban className="h-3 w-3" />
                  Quarantined
                </span>
              )}
            </div>
            <CardDescription className="font-mono text-xs truncate">{test.path}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                severityColor
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {(test.flakinessScore * 100).toFixed(0)}% Flaky
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats Row */}
        <div className="flex items-center gap-6 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{test.totalRuns} runs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-green-500">{test.passCount} passed</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">{test.failCount} failed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{(test.avgDuration / 1000).toFixed(1)}s avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            {test.trend === 'increasing' && (
              <>
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-red-500 text-xs">Getting worse</span>
              </>
            )}
            {test.trend === 'decreasing' && (
              <>
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-green-500 text-xs">Improving</span>
              </>
            )}
            {test.trend === 'stable' && (
              <span className="text-muted-foreground text-xs">Stable</span>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs text-muted-foreground mr-2">Recent:</span>
          {test.recentResults.map((passed, idx) => (
            <div
              key={idx}
              className={cn(
                'w-3 h-3 rounded-sm transition-transform hover:scale-125',
                passed ? 'bg-green-500' : 'bg-red-500'
              )}
              title={passed ? 'Passed' : 'Failed'}
            />
          ))}
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Root Causes */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Root Cause Analysis
              </h4>
              <div className="space-y-2">
                {test.rootCauses.map((cause, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium capitalize',
                        cause.type === 'timing' && 'bg-purple-500/10 text-purple-500',
                        cause.type === 'network' && 'bg-blue-500/10 text-blue-500',
                        cause.type === 'data' && 'bg-green-500/10 text-green-500',
                        cause.type === 'external' && 'bg-orange-500/10 text-orange-500'
                      )}
                    >
                      {cause.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{cause.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {(cause.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Fix */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                AI Suggested Fix
              </h4>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm">{test.suggestedFix}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRunTest(test.id)}
                className="h-8"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Run Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApplyFix(test.id)}
                className="h-8"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Apply Fix
              </Button>
              <Button
                size="sm"
                variant={test.isQuarantined ? 'default' : 'outline'}
                onClick={() => onQuarantine(test.id)}
                className="h-8"
              >
                {test.isQuarantined ? (
                  <>
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Unquarantine
                  </>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Quarantine
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FlakyTestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [showQuarantined, setShowQuarantined] = useState(true);
  const [tests, setTests] = useState(mockFlakyTests);
  const [isLoading, setIsLoading] = useState(false);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !test.name.toLowerCase().includes(query) &&
          !test.path.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== 'all') {
        const severity = getSeverity(test.flakinessScore);
        if (severity !== severityFilter) return false;
      }

      // Quarantine filter
      if (!showQuarantined && test.isQuarantined) return false;

      return true;
    });
  }, [tests, searchQuery, severityFilter, showQuarantined]);

  const stats = useMemo(() => {
    const high = tests.filter((t) => getSeverity(t.flakinessScore) === 'high').length;
    const medium = tests.filter((t) => getSeverity(t.flakinessScore) === 'medium').length;
    const low = tests.filter((t) => getSeverity(t.flakinessScore) === 'low').length;
    const quarantined = tests.filter((t) => t.isQuarantined).length;
    const avgScore = tests.reduce((sum, t) => sum + t.flakinessScore, 0) / tests.length;

    return { high, medium, low, quarantined, avgScore, total: tests.length };
  }, [tests]);

  const handleQuarantine = useCallback((id: string) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isQuarantined: !t.isQuarantined } : t))
    );
  }, []);

  const handleRunTest = useCallback((id: string) => {
    console.log('Running test:', id);
    // TODO: Implement test run
  }, []);

  const handleApplyFix = useCallback((id: string) => {
    console.log('Applying fix for test:', id);
    // TODO: Implement fix application
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Flaky Test Detection
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and fix unreliable tests to improve CI stability
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.high}</p>
                    <p className="text-sm text-muted-foreground">High Severity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.medium}</p>
                    <p className="text-sm text-muted-foreground">Medium Severity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <AlertTriangle className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.low}</p>
                    <p className="text-sm text-muted-foreground">Low Severity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Ban className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.quarantined}</p>
                    <p className="text-sm text-muted-foreground">Quarantined</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(stats.avgScore * 100).toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Avg Flakiness</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-500" />
                Flakiness Trend
              </CardTitle>
              <CardDescription>
                Track flaky test count over time vs. fixed tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="flakyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fixedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="flaky"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#flakyGradient)"
                      name="Flaky Tests"
                    />
                    <Area
                      type="monotone"
                      dataKey="fixed"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#fixedGradient)"
                      name="Fixed Tests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Severity</option>
                <option value="high">High (&gt;40%)</option>
                <option value="medium">Medium (20-40%)</option>
                <option value="low">Low (&lt;20%)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showQuarantined}
                onChange={(e) => setShowQuarantined(e.target.checked)}
                className="rounded border-border"
              />
              Show quarantined
            </label>
          </div>

          {/* Test List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No flaky tests found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery || severityFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Great job! Your test suite is stable with no detected flakiness.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTests.map((test) => (
                <FlakyTestCard
                  key={test.id}
                  test={test}
                  onQuarantine={handleQuarantine}
                  onRunTest={handleRunTest}
                  onApplyFix={handleApplyFix}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
