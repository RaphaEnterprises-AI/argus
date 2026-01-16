'use client';

import { useMCPSessions } from '@/lib/hooks/use-mcp-sessions';
import { useCurrentOrg } from '@/lib/contexts/organization-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Monitor, Clock, Activity, MoreVertical } from 'lucide-react';

export default function MCPSessionsPage() {
  const { currentOrg, isLoading: orgLoading } = useCurrentOrg();
  const orgId = currentOrg?.id || '';

  const { data, isLoading, error } = useMCPSessions(orgId);

  if (orgLoading) {
    return <div className="p-6">Loading organization...</div>;
  }

  if (!orgId) {
    return <div className="p-6">Please select an organization</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading MCP sessions...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading sessions</div>;
  }

  const { connections, active_count, total } = data || { connections: [], active_count: 0, total: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">MCP Sessions</h1>
          <p className="text-muted-foreground">
            Connected IDE clients and their activity
          </p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="text-green-600">
            {active_count} Active
          </Badge>
          <Badge variant="outline">
            {total} Total
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {connections.map((session) => (
          <Link key={session.id} href={`/mcp-sessions/${session.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {session.client_name || session.client_type}
                    </CardTitle>
                    <Badge variant={session.is_active ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {session.request_count} requests
                  </div>
                  <div>
                    {session.tools_used?.length || 0} tools used
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {connections.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No MCP sessions found</p>
              <p className="text-sm">Connect an IDE with Argus MCP to see sessions here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
