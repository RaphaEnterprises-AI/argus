import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PluginEvent, PluginSession } from '@/lib/supabase/types';

/**
 * GET /api/plugin/stats
 * Get aggregated plugin usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '7', 10);

    const supabase = await createServerSupabaseClient();
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    // Get all events in the time period (using any for new table)
    const { data: events, error: eventsError } = await (supabase as any)
      .from('plugin_events')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false });

    if (eventsError) {
      console.error('Failed to fetch plugin events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Get sessions for duration calculation (using any for new table)
    const { data: sessions, error: sessionsError } = await (supabase as any)
      .from('plugin_sessions')
      .select('duration_ms, session_id')
      .eq('user_id', userId)
      .gte('started_at', since.toISOString());

    if (sessionsError) {
      console.error('Failed to fetch plugin sessions:', sessionsError);
    }

    // Calculate aggregations
    const allEvents: PluginEvent[] = events || [];
    const allSessions = (sessions || []) as Pick<PluginSession, 'duration_ms' | 'session_id'>[];

    const sessionIds = new Set(allEvents.map((e: PluginEvent) => e.session_id));
    const commands = allEvents.filter((e: PluginEvent) => e.event_type === 'command');
    const skills = allEvents.filter((e: PluginEvent) => e.event_type === 'skill');
    const agents = allEvents.filter((e: PluginEvent) => e.event_type === 'agent');
    const hooks = allEvents.filter((e: PluginEvent) => e.event_type === 'hook');
    const mcpCalls = allEvents.filter((e: PluginEvent) => e.event_type === 'mcp_tool');
    const errors = allEvents.filter((e: PluginEvent) => e.status === 'failed');

    // Find most used command
    const commandCounts: Record<string, number> = {};
    commands.forEach((e: PluginEvent) => {
      commandCounts[e.event_name] = (commandCounts[e.event_name] || 0) + 1;
    });
    const sortedCommands = Object.entries(commandCounts)
      .sort((a, b) => b[1] - a[1]);
    const mostUsedCommand = sortedCommands[0]?.[0] || null;

    // Find most used skill
    const skillCounts: Record<string, number> = {};
    skills.forEach((e: PluginEvent) => {
      skillCounts[e.event_name] = (skillCounts[e.event_name] || 0) + 1;
    });
    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1]);
    const mostUsedSkill = sortedSkills[0]?.[0] || null;

    // Calculate average session duration
    const durations = allSessions
      .map((s) => s.duration_ms)
      .filter((d): d is number => d !== null);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Get active sessions count (using any for new table)
    const { count: activeSessions } = await (supabase as any)
      .from('plugin_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('ended_at', null);

    // Build response
    const stats = {
      period: {
        days: daysBack,
        since: since.toISOString(),
      },
      summary: {
        totalSessions: sessionIds.size,
        activeSessions: activeSessions || 0,
        totalEvents: allEvents.length,
        totalCommands: commands.length,
        totalSkills: skills.length,
        totalAgents: agents.length,
        totalHooks: hooks.length,
        totalMcpCalls: mcpCalls.length,
        totalErrors: errors.length,
        errorRate: allEvents.length > 0
          ? (errors.length / allEvents.length) * 100
          : 0,
        avgSessionDuration: avgDuration,
      },
      topItems: {
        commands: sortedCommands.slice(0, 5).map(([name, count]) => ({ name, count })),
        skills: sortedSkills.slice(0, 5).map(([name, count]) => ({ name, count })),
      },
      mostUsed: {
        command: mostUsedCommand,
        skill: mostUsedSkill,
      },
      recentEvents: allEvents.slice(0, 10),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/plugin/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
