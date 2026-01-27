'use client';

import { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Test components
import {
  TestRunHeader,
  TestResultCard,
  ScreenshotGallery,
  ViewModeToggle,
  TestResultsGridView,
  TestResultsListView,
  TestExecutionTimeline,
  TestRunActions,
  AIInsightsPanel,
  CIContextPanel,
  RunHistorySidebar,
  type Screenshot,
  type ViewMode,
  type TestNode,
} from '@/components/tests';

// Shared components
import {
  StatCardWithTrend,
  formatDurationDelta,
  formatPercentageDelta,
} from '@/components/shared';

// Hooks
import {
  useTestRun,
  useTestResults,
  useTestRunComparison,
} from '@/lib/hooks/use-tests';
import { useTestRunRealtime } from '@/lib/hooks/useTestRunRealtime';
import { useProject } from '@/lib/hooks/use-projects';

// Icons for stat cards
import { Target, CheckCircle2, XCircle, Timer } from 'lucide-react';

// Types
import type { TestResult } from '@/lib/supabase/types';

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </main>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Test Run Not Found</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

// Extract screenshots from test results
function extractScreenshots(testResults: TestResult[]): Screenshot[] {
  const screenshots: Screenshot[] = [];

  testResults.forEach((result) => {
    const stepResults = result.step_results as Array<{
      step?: string;
      instruction?: string;
      success?: boolean;
      error?: string;
      screenshot?: string;
      duration?: number;
      timestamp?: string;
    }> | null;

    if (stepResults) {
      stepResults.forEach((step, index) => {
        if (step.screenshot) {
          screenshots.push({
            data: step.screenshot,
            stepIndex: index,
            instruction: step.instruction || step.step || `Step ${index + 1}`,
            success: step.success,
            error: step.error,
            duration: step.duration,
            timestamp: step.timestamp,
          });
        }
      });
    }
  });

  return screenshots;
}

// Convert test results to timeline nodes
function resultsToTimelineNodes(testResults: TestResult[]): TestNode[] {
  return testResults.map((result, index) => ({
    id: result.id,
    number: index + 1,
    name: result.name,
    status: result.status as 'passed' | 'failed' | 'running' | 'pending',
    durationMs: result.duration_ms ?? undefined,
  }));
}

export default function TestRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Data fetching
  const { data: testRun, isLoading: runLoading, error: runError } = useTestRun(runId);
  const { data: testResults = [], isLoading: resultsLoading } = useTestResults(runId);
  const { data: project } = useProject(testRun?.project_id || null);
  const { data: comparison, isLoading: comparisonLoading } = useTestRunComparison(
    testRun?.project_id || null
  );

  // Real-time updates - only subscribe when test is running or pending
  const shouldSubscribe = testRun && (testRun.status === 'running' || testRun.status === 'pending');
  const { connectionStatus, reconnect } = useTestRunRealtime(shouldSubscribe ? runId : null);

  // Derived data
  const screenshots = useMemo(() => extractScreenshots(testResults), [testResults]);
  const timelineNodes = useMemo(() => resultsToTimelineNodes(testResults), [testResults]);
  const failedScreenshots = useMemo(
    () => screenshots.filter((s) => s.success === false),
    [screenshots]
  );

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleRerunComplete = () => {
    // Refresh the page data
    router.refresh();
  };

  const handleCompare = (previousRunId: string) => {
    // Navigate to comparison view
    router.push(`/visual?current=${runId}&previous=${previousRunId}`);
  };

  const handleTimelineTestClick = (testId: string) => {
    setSelectedResultId(testId);
    // Scroll to the result
    const element = resultRefs.current[testId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleResultSelect = (result: TestResult) => {
    setSelectedResultId(result.id);
  };

  if (runLoading) {
    return <LoadingSkeleton />;
  }

  if (runError || !testRun) {
    return (
      <ErrorState
        message={
          runError
            ? `Failed to load test run: ${runError.message}`
            : "The test run you're looking for doesn't exist or has been deleted."
        }
        onBack={handleBack}
      />
    );
  }

  const passRate =
    testRun.total_tests > 0
      ? Math.round((testRun.passed_tests / testRun.total_tests) * 100)
      : 0;

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Enhanced Header */}
        <TestRunHeader
          testRun={testRun}
          project={project || null}
          connectionStatus={connectionStatus}
          onReconnect={reconnect}
        />

        {/* Content */}
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TestRunActions
                testRun={testRun}
                testResults={testResults}
                onRerunComplete={handleRerunComplete}
              />
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>

            {/* Stats Grid with Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardWithTrend
                icon={Target}
                label="Total Tests"
                value={String(testRun.total_tests)}
                delta={null}
                metricType="neutral"
                isLoading={comparisonLoading}
                hasPreviousRun={comparison?.hasPreviousRun ?? false}
              />
              <StatCardWithTrend
                icon={CheckCircle2}
                label="Passed"
                value={String(testRun.passed_tests)}
                delta={comparison?.deltas.passedDelta ?? null}
                metricType="positive-good"
                isLoading={comparisonLoading}
                hasPreviousRun={comparison?.hasPreviousRun ?? false}
              />
              <StatCardWithTrend
                icon={XCircle}
                label="Failed"
                value={String(testRun.failed_tests)}
                delta={comparison?.deltas.failedDelta ?? null}
                metricType="negative-good"
                isLoading={comparisonLoading}
                hasPreviousRun={comparison?.hasPreviousRun ?? false}
              />
              <StatCardWithTrend
                icon={Timer}
                label="Duration"
                value={formatDuration(testRun.duration_ms)}
                delta={comparison?.deltas.durationDelta ?? null}
                metricType="negative-good"
                formatDelta={formatDurationDelta}
                isLoading={comparisonLoading}
                hasPreviousRun={comparison?.hasPreviousRun ?? false}
              />
            </div>

            {/* Execution Timeline */}
            {testResults.length > 0 && viewMode === 'timeline' && (
              <TestExecutionTimeline
                tests={timelineNodes}
                onTestClick={handleTimelineTestClick}
              />
            )}

            {/* Two Column Layout for Results + Sidebar Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Test Results - Takes 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Test Results</h2>

                  {resultsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : testResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No test results found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Results will appear here once the test run completes.
                        </p>
                      </CardContent>
                    </Card>
                  ) : viewMode === 'grid' ? (
                    <TestResultsGridView
                      results={testResults}
                      isLoading={resultsLoading}
                      onResultClick={handleResultSelect}
                    />
                  ) : viewMode === 'list' ? (
                    <TestResultsListView
                      results={testResults}
                      isLoading={resultsLoading}
                      onResultClick={handleResultSelect}
                    />
                  ) : (
                    <div className="space-y-4">
                      {testResults.map((result) => (
                        <div
                          key={result.id}
                          ref={(el) => {
                            resultRefs.current[result.id] = el;
                          }}
                          className={cn(
                            'transition-all duration-200',
                            selectedResultId === result.id &&
                              'ring-2 ring-primary ring-offset-2 rounded-lg'
                          )}
                        >
                          <TestResultCard
                            result={result}
                            defaultExpanded={selectedResultId === result.id}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screenshot Gallery - Only for failed tests */}
                {failedScreenshots.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Failed Step Screenshots</h2>
                    <ScreenshotGallery
                      screenshots={failedScreenshots}
                      columns={3}
                      showStepInfo
                    />
                  </div>
                )}
              </div>

              {/* Sidebar Content - Takes 1/3 */}
              <div className="space-y-6">
                {/* AI Insights */}
                <AIInsightsPanel
                  testResults={testResults}
                  isLoading={resultsLoading}
                  maxInsights={5}
                />

                {/* CI/CD Context */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Run Context</h3>
                    <CIContextPanel
                      ciMetadata={testRun.ci_metadata}
                      environment={{
                        browser: testRun.browser || undefined,
                        environment: testRun.environment || undefined,
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Run History Sidebar */}
      <RunHistorySidebar
        projectId={testRun.project_id}
        currentRunId={runId}
        onCompare={handleCompare}
      />
    </div>
  );
}
