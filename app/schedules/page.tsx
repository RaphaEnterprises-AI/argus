'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleCard, type Schedule } from '@/components/schedules/ScheduleCard';
import { ScheduleRunHistory, type ScheduleRun } from '@/components/schedules/ScheduleRunHistory';
import { CreateScheduleModal, type ScheduleFormData } from '@/components/schedules/CreateScheduleModal';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Mock data for development
const MOCK_SCHEDULES: Schedule[] = [
  {
    id: '1',
    name: 'Nightly Regression Suite',
    description: 'Full regression test suite running overnight',
    cron_expression: '0 0 * * *',
    timezone: 'America/New_York',
    enabled: true,
    next_run_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    last_run_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    run_count: 45,
    failure_count: 3,
    success_rate: 93.33,
    test_ids: [],
    notification_config: { on_failure: true, on_success: false, channels: [] },
    environment: 'staging',
    browser: 'chromium',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Hourly Smoke Tests',
    description: 'Quick smoke tests running every hour',
    cron_expression: '0 * * * *',
    timezone: 'UTC',
    enabled: true,
    next_run_at: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    last_run_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    run_count: 720,
    failure_count: 12,
    success_rate: 98.33,
    test_ids: [],
    notification_config: { on_failure: true, on_success: false, channels: [] },
    environment: 'production',
    browser: 'chromium',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Weekday CI Tests',
    description: 'Full test suite running on weekdays at 9 AM',
    cron_expression: '0 9 * * 1-5',
    timezone: 'Europe/London',
    enabled: true,
    next_run_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    run_count: 120,
    failure_count: 8,
    success_rate: 93.33,
    test_ids: [],
    notification_config: { on_failure: true, on_success: true, channels: [] },
    environment: 'staging',
    browser: 'chromium',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Paused Schedule',
    description: 'A temporarily disabled schedule',
    cron_expression: '0 6 * * *',
    timezone: 'America/Los_Angeles',
    enabled: false,
    last_run_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    run_count: 30,
    failure_count: 5,
    success_rate: 83.33,
    test_ids: [],
    notification_config: { on_failure: true, on_success: false, channels: [] },
    environment: 'staging',
    browser: 'firefox',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_RUNS: Record<string, ScheduleRun[]> = {
  '1': [
    {
      id: 'run-1',
      schedule_id: '1',
      test_run_id: 'tr-1',
      triggered_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      started_at: new Date(Date.now() - 16 * 60 * 60 * 1000 + 5000).toISOString(),
      completed_at: new Date(Date.now() - 15.5 * 60 * 60 * 1000).toISOString(),
      status: 'passed',
      trigger_type: 'scheduled',
      tests_total: 24,
      tests_passed: 24,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 1800000,
    },
    {
      id: 'run-2',
      schedule_id: '1',
      test_run_id: 'tr-2',
      triggered_at: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
      started_at: new Date(Date.now() - 40 * 60 * 60 * 1000 + 5000).toISOString(),
      completed_at: new Date(Date.now() - 39.5 * 60 * 60 * 1000).toISOString(),
      status: 'failed',
      trigger_type: 'scheduled',
      tests_total: 24,
      tests_passed: 21,
      tests_failed: 3,
      tests_skipped: 0,
      duration_ms: 1800000,
      error_message: 'Assertion failed: Expected element to be visible',
    },
  ],
  '2': [
    {
      id: 'run-3',
      schedule_id: '2',
      test_run_id: 'tr-3',
      triggered_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      started_at: new Date(Date.now() - 25 * 60 * 1000 + 2000).toISOString(),
      completed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      status: 'passed',
      trigger_type: 'scheduled',
      tests_total: 5,
      tests_passed: 5,
      tests_failed: 0,
      tests_skipped: 0,
      duration_ms: 300000,
    },
  ],
};

interface Stats {
  totalSchedules: number;
  enabledSchedules: number;
  totalRuns: number;
  successRate: number;
  runsToday: number;
  failuresToday: number;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleRuns, setScheduleRuns] = useState<Record<string, ScheduleRun[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Mock tests and notification channels
  const [tests] = useState([
    { id: 't1', name: 'Login Flow Test', tags: ['smoke', 'auth'] },
    { id: 't2', name: 'Checkout Process', tags: ['critical', 'payment'] },
    { id: 't3', name: 'User Registration', tags: ['auth'] },
    { id: 't4', name: 'Product Search', tags: ['smoke'] },
    { id: 't5', name: 'Cart Management', tags: ['critical'] },
  ]);

  const [notificationChannels] = useState([
    { id: 'nc1', name: 'Engineering Slack', channel_type: 'slack' },
    { id: 'nc2', name: 'QA Team Email', channel_type: 'email' },
  ]);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || data);
      } else {
        // Use mock data if API not available
        setSchedules(MOCK_SCHEDULES);
        setScheduleRuns(MOCK_RUNS);
      }
    } catch (err) {
      console.log('Using mock data - API not available');
      setSchedules(MOCK_SCHEDULES);
      setScheduleRuns(MOCK_RUNS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fetch run history for a schedule
  const fetchScheduleRuns = useCallback(async (scheduleId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/schedules/${scheduleId}/runs`);
      if (response.ok) {
        const data = await response.json();
        setScheduleRuns(prev => ({ ...prev, [scheduleId]: data.runs || data }));
      }
    } catch (err) {
      // Use mock data if available
      if (MOCK_RUNS[scheduleId]) {
        setScheduleRuns(prev => ({ ...prev, [scheduleId]: MOCK_RUNS[scheduleId] }));
      }
    }
  }, []);

  // Create/Update schedule
  const handleSaveSchedule = async (data: ScheduleFormData) => {
    const url = editingSchedule
      ? `${BACKEND_URL}/api/v1/schedules/${editingSchedule.id}`
      : `${BACKEND_URL}/api/v1/schedules`;

    try {
      const response = await fetch(url, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        // Mock successful save
        const newSchedule: Schedule = {
          id: editingSchedule?.id || `schedule-${Date.now()}`,
          ...data,
          enabled: true,
          run_count: editingSchedule?.run_count || 0,
          failure_count: editingSchedule?.failure_count || 0,
          success_rate: editingSchedule?.success_rate || 0,
          created_at: editingSchedule?.created_at || new Date().toISOString(),
        };

        if (editingSchedule) {
          setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? newSchedule : s));
        } else {
          setSchedules(prev => [newSchedule, ...prev]);
        }
      }
    } catch (err) {
      // Mock successful save
      const newSchedule: Schedule = {
        id: editingSchedule?.id || `schedule-${Date.now()}`,
        ...data,
        enabled: true,
        run_count: editingSchedule?.run_count || 0,
        failure_count: editingSchedule?.failure_count || 0,
        success_rate: editingSchedule?.success_rate || 0,
        created_at: editingSchedule?.created_at || new Date().toISOString(),
      };

      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? newSchedule : s));
      } else {
        setSchedules(prev => [newSchedule, ...prev]);
      }
    }

    setEditingSchedule(null);
    setShowCreateModal(false);
  };

  // Toggle schedule enabled state
  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/schedules/${scheduleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        setSchedules(prev => prev.map(s =>
          s.id === scheduleId ? { ...s, enabled } : s
        ));
      }
    } catch (err) {
      setSchedules(prev => prev.map(s =>
        s.id === scheduleId ? { ...s, enabled } : s
      ));
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      }
    } catch (err) {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
  };

  // Trigger schedule now
  const handleTriggerNow = async (scheduleId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/schedules/${scheduleId}/trigger`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh runs for this schedule
        fetchScheduleRuns(scheduleId);
      }
    } catch (err) {
      console.log('Mock trigger - would execute schedule:', scheduleId);
    }
  };

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'enabled' && schedule.enabled) ||
        (filterStatus === 'disabled' && !schedule.enabled);

      return matchesSearch && matchesStatus;
    });
  }, [schedules, searchQuery, filterStatus]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    const totalRuns = schedules.reduce((sum, s) => sum + s.run_count, 0);
    const totalFailures = schedules.reduce((sum, s) => sum + s.failure_count, 0);
    const successRate = totalRuns > 0
      ? ((totalRuns - totalFailures) / totalRuns) * 100
      : 0;

    return {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      totalRuns,
      successRate,
      runsToday: Math.floor(Math.random() * 50), // Mock data
      failuresToday: Math.floor(Math.random() * 5), // Mock data
    };
  }, [schedules]);

  // Get last run status for a schedule
  const getLastRunStatus = (scheduleId: string): 'passed' | 'failed' | 'running' | 'pending' | undefined => {
    const runs = scheduleRuns[scheduleId];
    if (!runs || runs.length === 0) return undefined;
    return runs[0].status as any;
  };

  // Handle expand schedule
  const handleToggleExpand = (scheduleId: string) => {
    if (expandedScheduleId === scheduleId) {
      setExpandedScheduleId(null);
    } else {
      setExpandedScheduleId(scheduleId);
      if (!scheduleRuns[scheduleId]) {
        fetchScheduleRuns(scheduleId);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Test Schedules
            </h1>
            <p className="text-sm text-muted-foreground">
              Automate your test runs with scheduled executions
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.enabledSchedules}</p>
                    <p className="text-sm text-muted-foreground">Active Schedules</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.runsToday}</p>
                    <p className="text-sm text-muted-foreground">Runs Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failuresToday}</p>
                    <p className="text-sm text-muted-foreground">Failures Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="flex rounded-lg border overflow-hidden">
                {(['all', 'enabled', 'disabled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors',
                      filterStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={fetchSchedules}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Schedules Grid */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredSchedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first schedule to automate test runs'}
                  </p>
                  {!searchQuery && filterStatus === 'all' && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Schedule
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSchedules.map((schedule) => (
                    <div key={schedule.id}>
                      <ScheduleCard
                        schedule={schedule}
                        onEdit={(s) => {
                          setEditingSchedule(s);
                          setShowCreateModal(true);
                        }}
                        onDelete={handleDeleteSchedule}
                        onToggle={handleToggleSchedule}
                        onTriggerNow={handleTriggerNow}
                        lastRunStatus={getLastRunStatus(schedule.id)}
                        isExpanded={expandedScheduleId === schedule.id}
                        onToggleExpand={() => handleToggleExpand(schedule.id)}
                      />

                      {/* Expanded Run History */}
                      {expandedScheduleId === schedule.id && (
                        <div className="mt-2 ml-4 animate-fade-up">
                          <ScheduleRunHistory
                            runs={scheduleRuns[schedule.id] || []}
                            isLoading={!scheduleRuns[schedule.id]}
                            onViewReport={(runId) => {
                              // Navigate to report page
                              console.log('View report:', runId);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Schedule Modal */}
      <CreateScheduleModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        initialData={editingSchedule ? {
          name: editingSchedule.name,
          description: editingSchedule.description || '',
          cron_expression: editingSchedule.cron_expression,
          timezone: editingSchedule.timezone,
          test_ids: editingSchedule.test_ids,
          test_filter: {},
          notification_config: editingSchedule.notification_config,
          environment: editingSchedule.environment,
          browser: editingSchedule.browser,
          max_parallel_tests: 5,
          timeout_ms: 3600000,
          retry_failed_tests: true,
          retry_count: 2,
        } : undefined}
        tests={tests}
        notificationChannels={notificationChannels}
        isEditing={!!editingSchedule}
      />
    </div>
  );
}
