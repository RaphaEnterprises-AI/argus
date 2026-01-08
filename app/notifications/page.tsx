'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Plus,
  Search,
  MessageSquare,
  Mail,
  Webhook,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChannelCard, type NotificationChannel } from '@/components/notifications/ChannelCard';
import { NotificationLogs, type NotificationLog } from '@/components/notifications/NotificationLogs';
import { CreateChannelModal, type ChannelFormData } from '@/components/notifications/CreateChannelModal';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Mock data for development
const MOCK_CHANNELS: NotificationChannel[] = [
  {
    id: '1',
    name: 'Engineering Slack',
    channel_type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/...', channel: '#engineering-alerts' },
    enabled: true,
    verified: true,
    rate_limit_per_hour: 100,
    sent_today: 24,
    last_sent_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    rules_count: 3,
  },
  {
    id: '2',
    name: 'QA Team Email',
    channel_type: 'email',
    config: { recipients: ['qa@company.com', 'leads@company.com'], cc: [], reply_to: '' },
    enabled: true,
    verified: true,
    rate_limit_per_hour: 50,
    sent_today: 8,
    last_sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    rules_count: 2,
  },
  {
    id: '3',
    name: 'Monitoring Webhook',
    channel_type: 'webhook',
    config: { url: 'https://api.monitoring.com/events', method: 'POST', headers: {}, secret: '' },
    enabled: true,
    verified: true,
    rate_limit_per_hour: 200,
    sent_today: 156,
    last_sent_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    rules_count: 5,
  },
  {
    id: '4',
    name: 'Discord Dev Channel',
    channel_type: 'discord',
    config: { webhook_url: 'https://discord.com/api/webhooks/...' },
    enabled: false,
    verified: true,
    rate_limit_per_hour: 100,
    sent_today: 0,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    rules_count: 1,
  },
  {
    id: '5',
    name: 'PagerDuty On-Call',
    channel_type: 'pagerduty',
    config: { routing_key: 'xxx', severity: 'critical' },
    enabled: true,
    verified: false,
    rate_limit_per_hour: 20,
    sent_today: 0,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rules_count: 1,
  },
];

const MOCK_LOGS: NotificationLog[] = [
  {
    id: 'log-1',
    channel_id: '1',
    channel_name: 'Engineering Slack',
    channel_type: 'slack',
    event_type: 'test.run.failed',
    payload: { test_name: 'Login Flow', failure_reason: 'Element not found' },
    status: 'sent',
    response_code: 200,
    retry_count: 0,
    max_retries: 3,
    queued_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 35 * 60 * 1000 + 500).toISOString(),
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    channel_id: '2',
    channel_name: 'QA Team Email',
    channel_type: 'email',
    event_type: 'schedule.run.failed',
    payload: { schedule_name: 'Nightly Regression', tests_failed: 3 },
    status: 'delivered',
    response_code: 250,
    retry_count: 0,
    max_retries: 3,
    queued_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2000).toISOString(),
    delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-3',
    channel_id: '3',
    channel_name: 'Monitoring Webhook',
    channel_type: 'webhook',
    event_type: 'healing.applied',
    payload: { test_id: 't-123', fix_type: 'selector' },
    status: 'sent',
    response_code: 200,
    retry_count: 0,
    max_retries: 3,
    queued_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 5 * 60 * 1000 + 200).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-4',
    channel_id: '1',
    channel_name: 'Engineering Slack',
    channel_type: 'slack',
    event_type: 'test.run.failed',
    payload: { test_name: 'Checkout Flow', failure_reason: 'Timeout' },
    status: 'failed',
    response_code: 500,
    error_message: 'Internal server error from Slack API',
    retry_count: 3,
    max_retries: 3,
    queued_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-5',
    channel_id: '3',
    channel_name: 'Monitoring Webhook',
    channel_type: 'webhook',
    event_type: 'visual.mismatch.detected',
    payload: { screenshot_id: 's-456', diff_percent: 12.5 },
    status: 'sent',
    response_code: 200,
    retry_count: 0,
    max_retries: 3,
    queued_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 45 * 60 * 1000 + 150).toISOString(),
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

interface Stats {
  totalChannels: number;
  enabledChannels: number;
  verifiedChannels: number;
  notificationsSentToday: number;
  failedToday: number;
  successRate: number;
}

export default function NotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [activeTab, setActiveTab] = useState<'channels' | 'logs'>('channels');

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/notifications/channels`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || data);
      } else {
        // Use mock data if API not available
        setChannels(MOCK_CHANNELS);
      }
    } catch (err) {
      console.log('Using mock data - API not available');
      setChannels(MOCK_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/notifications/logs?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || data);
      } else {
        setLogs(MOCK_LOGS);
      }
    } catch (err) {
      setLogs(MOCK_LOGS);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchLogs();
  }, [fetchChannels, fetchLogs]);

  // Create/Update channel
  const handleSaveChannel = async (data: ChannelFormData) => {
    const url = editingChannel
      ? `${BACKEND_URL}/api/v1/notifications/channels/${editingChannel.id}`
      : `${BACKEND_URL}/api/v1/notifications/channels`;

    try {
      const response = await fetch(url, {
        method: editingChannel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchChannels();
      } else {
        // Mock successful save
        const newChannel: NotificationChannel = {
          id: editingChannel?.id || `channel-${Date.now()}`,
          name: data.name,
          channel_type: data.channel_type,
          config: data.config,
          enabled: data.enabled,
          verified: false,
          rate_limit_per_hour: data.rate_limit_per_hour,
          sent_today: editingChannel?.sent_today || 0,
          created_at: editingChannel?.created_at || new Date().toISOString(),
          rules_count: data.rules.length,
        };

        if (editingChannel) {
          setChannels(prev => prev.map(c => c.id === editingChannel.id ? newChannel : c));
        } else {
          setChannels(prev => [newChannel, ...prev]);
        }
      }
    } catch (err) {
      // Mock successful save
      const newChannel: NotificationChannel = {
        id: editingChannel?.id || `channel-${Date.now()}`,
        name: data.name,
        channel_type: data.channel_type,
        config: data.config,
        enabled: data.enabled,
        verified: false,
        rate_limit_per_hour: data.rate_limit_per_hour,
        sent_today: editingChannel?.sent_today || 0,
        created_at: editingChannel?.created_at || new Date().toISOString(),
        rules_count: data.rules.length,
      };

      if (editingChannel) {
        setChannels(prev => prev.map(c => c.id === editingChannel.id ? newChannel : c));
      } else {
        setChannels(prev => [newChannel, ...prev]);
      }
    }

    setEditingChannel(null);
    setShowCreateModal(false);
  };

  // Test channel
  const handleTestChannel = async (channelId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/notifications/channels/${channelId}/test`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      // Mock successful test 80% of the time
      return Math.random() > 0.2;
    }
  };

  // Delete channel
  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this notification channel?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/notifications/channels/${channelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchChannels();
      } else {
        setChannels(prev => prev.filter(c => c.id !== channelId));
      }
    } catch (err) {
      setChannels(prev => prev.filter(c => c.id !== channelId));
    }
  };

  // Retry failed notification
  const handleRetryLog = async (logId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/notifications/logs/${logId}/retry`, {
        method: 'POST',
      });
      await fetchLogs();
    } catch (err) {
      // Mock update
      setLogs(prev => prev.map(log =>
        log.id === logId ? { ...log, status: 'queued' as const, retry_count: log.retry_count + 1 } : log
      ));
    }
  };

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        channel.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || channel.channel_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [channels, searchQuery, filterType]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    const sentToday = channels.reduce((sum, c) => sum + c.sent_today, 0);
    const failedLogs = logs.filter(l => l.status === 'failed' || l.status === 'bounced').length;
    const successfulLogs = logs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
    const totalLogs = failedLogs + successfulLogs;

    return {
      totalChannels: channels.length,
      enabledChannels: channels.filter(c => c.enabled).length,
      verifiedChannels: channels.filter(c => c.verified).length,
      notificationsSentToday: sentToday,
      failedToday: failedLogs,
      successRate: totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 100,
    };
  }, [channels, logs]);

  // Get unique channel types
  const channelTypes = useMemo(() => {
    const types = new Set(channels.map(c => c.channel_type));
    return Array.from(types);
  }, [channels]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Channels
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure how and when you receive test notifications
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.enabledChannels}</p>
                    <p className="text-sm text-muted-foreground">Active Channels</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
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
                    <p className="text-2xl font-bold">{stats.notificationsSentToday}</p>
                    <p className="text-sm text-muted-foreground">Sent Today</p>
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
                    <p className="text-2xl font-bold">{stats.failedToday}</p>
                    <p className="text-sm text-muted-foreground">Failed Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b">
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'channels'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('channels')}
            >
              Channels
            </button>
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'logs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('logs')}
            >
              Delivery Logs
            </button>
          </div>

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <>
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Types</option>
                    {channelTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={fetchChannels}>
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

              {/* Channels Grid */}
              {!loading && !error && (
                <div className="space-y-4">
                  {filteredChannels.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No channels found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || filterType !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Add your first notification channel to get started'}
                      </p>
                      {!searchQuery && filterType === 'all' && (
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Channel
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredChannels.map((channel) => (
                        <ChannelCard
                          key={channel.id}
                          channel={channel}
                          onEdit={(c) => {
                            setEditingChannel(c);
                            setShowCreateModal(true);
                          }}
                          onDelete={handleDeleteChannel}
                          onTest={handleTestChannel}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <NotificationLogs
              logs={logs}
              isLoading={loading}
              onRefresh={fetchLogs}
              onRetry={handleRetryLog}
            />
          )}
        </div>
      </main>

      {/* Create/Edit Channel Modal */}
      <CreateChannelModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingChannel(null);
        }}
        onSave={handleSaveChannel}
        onTest={async (data) => {
          // Mock test
          return Math.random() > 0.2;
        }}
        initialData={editingChannel ? {
          name: editingChannel.name,
          channel_type: editingChannel.channel_type as any,
          config: editingChannel.config as any,
          enabled: editingChannel.enabled,
          rate_limit_per_hour: editingChannel.rate_limit_per_hour,
          rules: [],
        } : undefined}
        isEditing={!!editingChannel}
      />
    </div>
  );
}
