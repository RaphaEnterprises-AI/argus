'use client';

import { useState, useEffect, useMemo } from 'react';
import { addMinutes, format, addHours, addDays, addWeeks, startOfHour, setHours, setMinutes } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  Globe,
  TestTube,
  Bell,
  Save,
  Loader2,
  Play,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface ScheduleFormData {
  name: string;
  description: string;
  cron_expression: string;
  timezone: string;
  test_ids: string[];
  test_filter: {
    tags?: string[];
    priority?: string[];
  };
  notification_config: {
    on_failure: boolean;
    on_success: boolean;
    channels: string[];
  };
  environment: string;
  browser: string;
  max_parallel_tests: number;
  timeout_ms: number;
  retry_failed_tests: boolean;
  retry_count: number;
}

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => Promise<void>;
  initialData?: Partial<ScheduleFormData>;
  tests?: Array<{ id: string; name: string; tags?: string[] }>;
  notificationChannels?: Array<{ id: string; name: string; channel_type: string }>;
  isEditing?: boolean;
}

// Common timezones
const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

// Cron presets
const CRON_PRESETS = [
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Weekly on Monday', value: '0 9 * * 1' },
  { label: 'Monthly on 1st', value: '0 9 1 * *' },
  { label: 'Custom', value: 'custom' },
];

const ENVIRONMENTS = ['development', 'staging', 'production'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];

// Simple cron expression parser for next run times
function getNextRunTimes(cronExpression: string, count: number = 5): Date[] {
  const now = new Date();
  const results: Date[] = [];

  // Simple parsing for common patterns
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return results;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let current = startOfHour(now);

  // Simple approximation for display purposes
  for (let i = 0; i < 100 && results.length < count; i++) {
    current = addMinutes(current, 15);

    // Check minute
    if (minute !== '*' && minute.startsWith('*/')) {
      const interval = parseInt(minute.slice(2));
      if (current.getMinutes() % interval !== 0) continue;
    } else if (minute !== '*') {
      if (current.getMinutes() !== parseInt(minute)) continue;
    }

    // Check hour
    if (hour !== '*' && hour.startsWith('*/')) {
      const interval = parseInt(hour.slice(2));
      if (current.getHours() % interval !== 0) continue;
    } else if (hour !== '*') {
      if (current.getHours() !== parseInt(hour)) continue;
    }

    // Check day of week
    if (dayOfWeek !== '*') {
      const dow = current.getDay();
      if (dayOfWeek === '1-5' && (dow === 0 || dow === 6)) continue;
      if (dayOfWeek === '0,6' && dow !== 0 && dow !== 6) continue;
      if (!dayOfWeek.includes('-') && !dayOfWeek.includes(',')) {
        if (dow !== parseInt(dayOfWeek)) continue;
      }
    }

    if (current > now) {
      results.push(new Date(current));
    }
  }

  return results;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function CreateScheduleModal({
  open,
  onClose,
  onSave,
  initialData,
  tests = [],
  notificationChannels = [],
  isEditing = false,
}: CreateScheduleModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('0 9 * * *');
  const [showCustomCron, setShowCustomCron] = useState(false);

  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    description: '',
    cron_expression: '0 9 * * *',
    timezone: 'UTC',
    test_ids: [],
    test_filter: {},
    notification_config: {
      on_failure: true,
      on_success: false,
      channels: [],
    },
    environment: 'staging',
    browser: 'chromium',
    max_parallel_tests: 5,
    timeout_ms: 3600000,
    retry_failed_tests: true,
    retry_count: 2,
    ...initialData,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        cron_expression: '0 9 * * *',
        timezone: 'UTC',
        test_ids: [],
        test_filter: {},
        notification_config: {
          on_failure: true,
          on_success: false,
          channels: [],
        },
        environment: 'staging',
        browser: 'chromium',
        max_parallel_tests: 5,
        timeout_ms: 3600000,
        retry_failed_tests: true,
        retry_count: 2,
        ...initialData,
      });

      const preset = CRON_PRESETS.find(p => p.value === (initialData?.cron_expression || '0 9 * * *'));
      if (preset) {
        setSelectedPreset(preset.value);
        setShowCustomCron(false);
      } else {
        setSelectedPreset('custom');
        setShowCustomCron(true);
      }

      setError(null);
    }
  }, [open, initialData]);

  // Calculate next run times
  const nextRunTimes = useMemo(() => {
    return getNextRunTimes(formData.cron_expression, 5);
  }, [formData.cron_expression]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value === 'custom') {
      setShowCustomCron(true);
    } else {
      setShowCustomCron(false);
      setFormData(prev => ({ ...prev, cron_expression: value }));
    }
  };

  const handleTestToggle = (testId: string) => {
    setFormData(prev => ({
      ...prev,
      test_ids: prev.test_ids.includes(testId)
        ? prev.test_ids.filter(id => id !== testId)
        : [...prev.test_ids, testId],
    }));
  };

  const handleChannelToggle = (channelId: string) => {
    setFormData(prev => ({
      ...prev,
      notification_config: {
        ...prev.notification_config,
        channels: prev.notification_config.channels.includes(channelId)
          ? prev.notification_config.channels.filter(id => id !== channelId)
          : [...prev.notification_config.channels, channelId],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Schedule name is required');
      return;
    }

    if (!formData.cron_expression.trim()) {
      setError('Cron expression is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Schedule' : 'Create Schedule'}
          </DialogTitle>
          <DialogDescription>
            Configure when and how your tests should run automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Schedule Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Nightly Regression Suite"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this schedule does"
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Schedule Timing
            </h3>

            {/* Preset Selector */}
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {CRON_PRESETS.slice(0, -1).map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={cn(
                      'px-3 py-2 text-xs rounded-lg border transition-colors text-left',
                      selectedPreset === preset.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    )}
                    onClick={() => handlePresetChange(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={cn(
                    'px-3 py-2 text-xs rounded-lg border transition-colors text-left',
                    showCustomCron
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  )}
                  onClick={() => handlePresetChange('custom')}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Cron Input */}
            {showCustomCron && (
              <div>
                <label className="text-sm font-medium">Cron Expression</label>
                <Input
                  value={formData.cron_expression}
                  onChange={(e) => setFormData(prev => ({ ...prev, cron_expression: e.target.value }))}
                  placeholder="* * * * *"
                  className="mt-1.5 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}

            {/* Next Run Preview */}
            {nextRunTimes.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Next 5 runs:
                </div>
                <div className="space-y-1">
                  {nextRunTimes.map((time, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Play className="h-3 w-3 text-primary" />
                      <span>{format(time, 'EEE, MMM d, yyyy HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timezone */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="mt-1.5 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Selection */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test Selection
            </h3>

            {tests.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-2">
                {tests.map((test) => (
                  <label
                    key={test.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      formData.test_ids.includes(test.id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                        formData.test_ids.includes(test.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      )}
                    >
                      {formData.test_ids.includes(test.id) && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="text-sm">{test.name}</span>
                    {test.tags && test.tags.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {test.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
                No tests available. Create tests first to schedule them.
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {formData.test_ids.length === 0
                ? 'All tests will be included if none are selected'
                : `${formData.test_ids.length} test${formData.test_ids.length !== 1 ? 's' : ''} selected`}
            </p>
          </div>

          {/* Execution Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Execution Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Environment</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                  className="mt-1.5 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Browser</label>
                <select
                  value={formData.browser}
                  onChange={(e) => setFormData(prev => ({ ...prev, browser: e.target.value }))}
                  className="mt-1.5 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {BROWSERS.map((browser) => (
                    <option key={browser} value={browser}>
                      {browser.charAt(0).toUpperCase() + browser.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Parallel Tests</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.max_parallel_tests}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_parallel_tests: parseInt(e.target.value) || 1 }))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Timeout (minutes)</label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={Math.round(formData.timeout_ms / 60000)}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout_ms: (parseInt(e.target.value) || 60) * 60000 }))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Retry Failed Tests</div>
                <div className="text-xs text-muted-foreground">
                  Automatically retry tests that fail
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={formData.retry_failed_tests}
                  onChange={(v) => setFormData(prev => ({ ...prev, retry_failed_tests: v }))}
                />
                {formData.retry_failed_tests && (
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.retry_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, retry_count: parseInt(e.target.value) || 1 }))}
                    className="w-16 h-8"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Notify on Failure</div>
                  <div className="text-xs text-muted-foreground">
                    Send notification when tests fail
                  </div>
                </div>
                <Toggle
                  checked={formData.notification_config.on_failure}
                  onChange={(v) => setFormData(prev => ({
                    ...prev,
                    notification_config: { ...prev.notification_config, on_failure: v }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Notify on Success</div>
                  <div className="text-xs text-muted-foreground">
                    Send notification when tests pass
                  </div>
                </div>
                <Toggle
                  checked={formData.notification_config.on_success}
                  onChange={(v) => setFormData(prev => ({
                    ...prev,
                    notification_config: { ...prev.notification_config, on_success: v }
                  }))}
                />
              </div>
            </div>

            {/* Channel Selection */}
            {notificationChannels.length > 0 && (
              <div>
                <label className="text-sm font-medium">Notification Channels</label>
                <div className="mt-2 space-y-2">
                  {notificationChannels.map((channel) => (
                    <label
                      key={channel.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border',
                        formData.notification_config.channels.includes(channel.id)
                          ? 'bg-primary/10 border-primary/30'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                          formData.notification_config.channels.includes(channel.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border'
                        )}
                      >
                        {formData.notification_config.channels.includes(channel.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className="text-sm">{channel.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                        {channel.channel_type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Schedule' : 'Create Schedule'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
