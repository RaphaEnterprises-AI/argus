'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMCPSessionActivity } from '@/lib/hooks/use-mcp-sessions';
import { useCurrentOrg } from '@/lib/contexts/organization-context';
import { useAuth } from '@clerk/nextjs';
import { authenticatedFetch } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, Monitor, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function MCPSessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { currentOrg, isLoading: orgLoading } = useCurrentOrg();
  const { isLoaded, isSignedIn } = useAuth();
  const orgId = currentOrg?.id || '';

  const { data: session, isLoading } = useQuery({
    queryKey: ['mcp-session', sessionId],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/v1/mcp/connections/${sessionId}`, {
        headers: { 'X-Organization-ID': orgId },
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: isLoaded && isSignedIn && !orgLoading && !!orgId && !!sessionId,
  });

  const { data: activityData } = useQuery({
    queryKey: ['mcp-session-activity', sessionId],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/v1/mcp/connections/${sessionId}/activity`, {
        headers: { 'X-Organization-ID': orgId },
      });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    enabled: isLoaded && isSignedIn && !orgLoading && !!orgId && !!sessionId,
  });

  const activities = activityData?.activities || [];

  if (orgLoading || isLoading) {
    return <div className="p-6">Loading session...</div>;
  }

  if (!session) {
    return <div className="p-6">Session not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mcp-sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            {session.client_name || session.client_type}
          </h1>
          <p className="text-muted-foreground">Session ID: {session.session_id}</p>
        </div>
        <Badge variant={session.is_active ? 'default' : 'secondary'} className="ml-auto">
          {session.status}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDistanceToNow(new Date(session.connected_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{session.request_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tools Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{session.tools_used?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg">
                {activity.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{activity.tool_name || activity.activity_type}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'HH:mm:ss')}
                    </span>
                  </div>
                  {activity.duration_ms && (
                    <p className="text-sm text-muted-foreground">
                      Duration: {activity.duration_ms}ms
                    </p>
                  )}
                  {activity.error_message && (
                    <p className="text-sm text-red-500">{activity.error_message}</p>
                  )}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
