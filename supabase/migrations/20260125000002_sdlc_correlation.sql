-- SDLC Cross-Correlation Engine
-- Unified timeline for events from all integrations (Jira, GitHub, Sentry, etc.)
-- This is the key differentiator for Argus - enabling correlation queries across the entire SDLC

-- ============================================================================
-- UNIFIED EVENT TIMELINE
-- ============================================================================
-- The sdlc_events table stores events from all integrated platforms in a
-- normalized format. This enables:
-- - Tracing a requirement from Jira through PRs, builds, deploys, to production errors
-- - Understanding the blast radius of changes
-- - Identifying patterns in failures related to specific types of changes
-- - Correlating test failures with recent deployments or code changes

CREATE TABLE sdlc_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,

    -- Event identification
    -- event_type categorizes what kind of SDLC event this is
    event_type TEXT NOT NULL CHECK (event_type IN (
        'requirement',   -- Jira tickets, Linear issues, etc.
        'pr',            -- Pull/Merge requests
        'commit',        -- Individual commits
        'build',         -- CI/CD build events
        'test_run',      -- Test execution events (from Argus or external)
        'deploy',        -- Deployment events
        'error',         -- Production errors (Sentry, etc.)
        'incident',      -- PagerDuty, Opsgenie incidents
        'feature_flag',  -- Feature flag changes (LaunchDarkly, etc.)
        'session'        -- User session recordings
    )),

    -- Source platform identifies where this event originated
    source_platform TEXT NOT NULL,  -- 'jira', 'github', 'gitlab', 'sentry', 'pagerduty', 'launchdarkly', 'argus'
    external_id TEXT NOT NULL,      -- The ID in the source system
    external_url TEXT,              -- Direct link to the event in the source system

    -- When the event actually occurred (not when we recorded it)
    occurred_at TIMESTAMPTZ NOT NULL,

    -- ========================================================================
    -- CORRELATION KEYS
    -- ========================================================================
    -- These nullable fields are used to link events across platforms.
    -- For example: a Sentry error with a commit_sha can be correlated to
    -- the GitHub PR that introduced it, and then to the Jira ticket it fixed.

    commit_sha TEXT,       -- Git commit SHA (links commits, PRs, errors, deploys)
    pr_number INTEGER,     -- Pull request number (links PRs, reviews, builds)
    jira_key TEXT,         -- Jira issue key like 'PROJ-123' (links requirements to code)
    deploy_id TEXT,        -- Deployment identifier (links deploys to errors/incidents)

    -- ========================================================================
    -- EVENT CONTENT
    -- ========================================================================
    title TEXT,            -- Human-readable title/summary
    description TEXT,      -- Longer description or body content
    data JSONB NOT NULL DEFAULT '{}',  -- Platform-specific data (full payload)

    -- ========================================================================
    -- AI-EXTRACTED METADATA
    -- ========================================================================
    -- These fields are populated by AI analysis to enable richer correlations

    affected_files TEXT[],       -- Files touched by this event (from commits, PRs)
    affected_components TEXT[],  -- Higher-level components affected (from AI analysis)
    risk_score DECIMAL(3,2),     -- AI-assessed risk score (0.00 to 1.00)

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure we don't duplicate events from the same source
    UNIQUE(source_platform, external_id)
);

-- ============================================================================
-- INDEXES FOR CORRELATION QUERIES
-- ============================================================================
-- These indexes are optimized for the common correlation query patterns:
-- - "Show me all events for this project"
-- - "What happened in the last 24 hours?"
-- - "Find all events related to this commit/PR/ticket"

-- Basic filtering indexes
CREATE INDEX idx_sdlc_events_project ON sdlc_events(project_id);
CREATE INDEX idx_sdlc_events_user ON sdlc_events(user_id);
CREATE INDEX idx_sdlc_events_type ON sdlc_events(event_type);
CREATE INDEX idx_sdlc_events_platform ON sdlc_events(source_platform);
CREATE INDEX idx_sdlc_events_occurred ON sdlc_events(occurred_at DESC);

-- Correlation key indexes (partial to save space - only index non-null values)
CREATE INDEX idx_sdlc_events_commit ON sdlc_events(commit_sha)
    WHERE commit_sha IS NOT NULL;
CREATE INDEX idx_sdlc_events_pr ON sdlc_events(pr_number)
    WHERE pr_number IS NOT NULL;
CREATE INDEX idx_sdlc_events_jira ON sdlc_events(jira_key)
    WHERE jira_key IS NOT NULL;
CREATE INDEX idx_sdlc_events_deploy ON sdlc_events(deploy_id)
    WHERE deploy_id IS NOT NULL;

-- Compound index for timeline queries
CREATE INDEX idx_sdlc_events_project_timeline ON sdlc_events(project_id, occurred_at DESC);

-- GIN index for searching within affected files/components
CREATE INDEX idx_sdlc_events_affected_files ON sdlc_events USING GIN(affected_files);
CREATE INDEX idx_sdlc_events_affected_components ON sdlc_events USING GIN(affected_components);

-- JSONB index for querying event data
CREATE INDEX idx_sdlc_events_data ON sdlc_events USING GIN(data);

-- ============================================================================
-- EVENT CORRELATIONS (EXPLICIT LINKS)
-- ============================================================================
-- While correlation keys enable implicit linking, this table stores explicit
-- relationships that have been identified (either by heuristics or AI).
-- This allows for richer relationship types and confidence scores.

CREATE TABLE event_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_event_id UUID NOT NULL REFERENCES sdlc_events(id) ON DELETE CASCADE,
    target_event_id UUID NOT NULL REFERENCES sdlc_events(id) ON DELETE CASCADE,

    -- Type of correlation between events
    correlation_type TEXT NOT NULL CHECK (correlation_type IN (
        'caused_by',      -- Source was caused by target (e.g., error caused by commit)
        'related_to',     -- General relationship
        'blocked_by',     -- Source is blocked by target
        'fixes',          -- Source fixes the issue in target
        'introduced_by'   -- Source (bug/error) was introduced by target (commit/deploy)
    )),

    -- Confidence in this correlation (1.0 = certain, lower = heuristic/AI guess)
    confidence DECIMAL(3,2) DEFAULT 1.0,

    -- Optional metadata about why this correlation was created
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate correlations of the same type
    UNIQUE(source_event_id, target_event_id, correlation_type)
);

-- Indexes for traversing the correlation graph
CREATE INDEX idx_event_correlations_source ON event_correlations(source_event_id);
CREATE INDEX idx_event_correlations_target ON event_correlations(target_event_id);
CREATE INDEX idx_event_correlations_type ON event_correlations(correlation_type);

-- ============================================================================
-- AI-GENERATED CORRELATION INSIGHTS
-- ============================================================================
-- The correlation engine analyzes the unified timeline to identify patterns,
-- risks, and opportunities. This table stores those insights for display
-- in the dashboard and for tracking their resolution.

CREATE TABLE correlation_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,

    -- Type of insight discovered
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'risk_pattern',        -- Detected a pattern that correlates with failures
        'coverage_gap',        -- Code changed but not covered by tests
        'flaky_correlation',   -- Flaky tests correlated with specific conditions
        'hot_path',            -- Frequently changing code that needs attention
        'regression_pattern',  -- Pattern suggesting regression introduction
        'deployment_risk'      -- Deployment has elevated risk based on changes
    )),

    -- How severe/urgent is this insight?
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN (
        'info',      -- Informational, no action needed
        'warning',   -- Should be reviewed soon
        'critical'   -- Needs immediate attention
    )),

    -- Human-readable insight content
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- ========================================================================
    -- SUPPORTING EVIDENCE
    -- ========================================================================
    -- Links to the events that support this insight
    event_ids UUID[],

    -- Additional structured data about the insight
    data JSONB DEFAULT '{}',

    -- ========================================================================
    -- RECOMMENDATIONS
    -- ========================================================================
    -- AI-generated recommendations for addressing this insight
    -- Format: [{"action": "...", "priority": "...", "effort": "..."}]
    recommendations JSONB DEFAULT '[]',

    -- ========================================================================
    -- STATUS TRACKING
    -- ========================================================================
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active',        -- Insight is current and relevant
        'acknowledged',  -- User has seen it but not resolved
        'resolved',      -- Issue has been addressed
        'dismissed'      -- User marked as not relevant
    )),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    dismissed_at TIMESTAMPTZ,
    dismissed_by TEXT,
    dismiss_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for insight queries
CREATE INDEX idx_correlation_insights_project ON correlation_insights(project_id);
CREATE INDEX idx_correlation_insights_user ON correlation_insights(user_id);
CREATE INDEX idx_correlation_insights_status ON correlation_insights(status);
CREATE INDEX idx_correlation_insights_type ON correlation_insights(insight_type);
CREATE INDEX idx_correlation_insights_severity ON correlation_insights(severity);
CREATE INDEX idx_correlation_insights_active ON correlation_insights(project_id, status, severity DESC)
    WHERE status = 'active';

-- GIN index for querying event_ids array
CREATE INDEX idx_correlation_insights_events ON correlation_insights USING GIN(event_ids);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sdlc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlation_insights ENABLE ROW LEVEL SECURITY;

-- Policies follow the existing pattern in this codebase (permissive for now)
-- These can be tightened later with Clerk JWT integration

CREATE POLICY "Enable all for authenticated users"
    ON sdlc_events FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users"
    ON event_correlations FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users"
    ON correlation_insights FOR ALL USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on correlation_insights
CREATE TRIGGER update_correlation_insights_updated_at
    BEFORE UPDATE ON correlation_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable realtime for insights so dashboard can show new insights immediately

ALTER PUBLICATION supabase_realtime ADD TABLE correlation_insights;

-- ============================================================================
-- COLUMN COMMENTS
-- ============================================================================

-- sdlc_events table comments
COMMENT ON TABLE sdlc_events IS
    'Unified timeline of events from all integrated SDLC platforms (Jira, GitHub, Sentry, etc.)';

COMMENT ON COLUMN sdlc_events.event_type IS
    'Category of SDLC event: requirement, pr, commit, build, test_run, deploy, error, incident, feature_flag, session';

COMMENT ON COLUMN sdlc_events.source_platform IS
    'Platform that generated this event: jira, github, gitlab, sentry, pagerduty, launchdarkly, argus, etc.';

COMMENT ON COLUMN sdlc_events.external_id IS
    'Unique identifier of this event in the source platform';

COMMENT ON COLUMN sdlc_events.occurred_at IS
    'When the event actually occurred (not when it was recorded in Argus)';

COMMENT ON COLUMN sdlc_events.commit_sha IS
    'Git commit SHA for correlation across commits, PRs, errors, and deploys';

COMMENT ON COLUMN sdlc_events.pr_number IS
    'Pull/merge request number for correlation';

COMMENT ON COLUMN sdlc_events.jira_key IS
    'Jira issue key (e.g., PROJ-123) for tracing requirements through the SDLC';

COMMENT ON COLUMN sdlc_events.deploy_id IS
    'Deployment identifier for correlating deploys with subsequent errors/incidents';

COMMENT ON COLUMN sdlc_events.affected_files IS
    'AI-extracted list of files affected by this event';

COMMENT ON COLUMN sdlc_events.affected_components IS
    'AI-identified higher-level components affected by this event';

COMMENT ON COLUMN sdlc_events.risk_score IS
    'AI-assessed risk score from 0.00 to 1.00';

-- event_correlations table comments
COMMENT ON TABLE event_correlations IS
    'Explicit relationships between SDLC events, either detected by heuristics or AI analysis';

COMMENT ON COLUMN event_correlations.correlation_type IS
    'Type of relationship: caused_by, related_to, blocked_by, fixes, introduced_by';

COMMENT ON COLUMN event_correlations.confidence IS
    'Confidence score (0.00-1.00) in this correlation; 1.0 = certain';

-- correlation_insights table comments
COMMENT ON TABLE correlation_insights IS
    'AI-generated insights from analyzing the SDLC event timeline and correlations';

COMMENT ON COLUMN correlation_insights.insight_type IS
    'Category of insight: risk_pattern, coverage_gap, flaky_correlation, hot_path, regression_pattern, deployment_risk';

COMMENT ON COLUMN correlation_insights.severity IS
    'Urgency level: info (no action), warning (review soon), critical (immediate attention)';

COMMENT ON COLUMN correlation_insights.event_ids IS
    'Array of SDLC event IDs that support this insight';

COMMENT ON COLUMN correlation_insights.recommendations IS
    'AI-generated recommendations as JSON array: [{action, priority, effort}]';

COMMENT ON COLUMN correlation_insights.status IS
    'Current state: active, acknowledged, resolved, dismissed';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to find all events correlated to a given event
CREATE OR REPLACE FUNCTION get_correlated_events(event_id UUID)
RETURNS TABLE (
    correlated_event_id UUID,
    correlation_type TEXT,
    confidence DECIMAL(3,2),
    direction TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Events where this event is the source
    SELECT
        ec.target_event_id as correlated_event_id,
        ec.correlation_type,
        ec.confidence,
        'outgoing'::TEXT as direction
    FROM event_correlations ec
    WHERE ec.source_event_id = event_id

    UNION ALL

    -- Events where this event is the target
    SELECT
        ec.source_event_id as correlated_event_id,
        ec.correlation_type,
        ec.confidence,
        'incoming'::TEXT as direction
    FROM event_correlations ec
    WHERE ec.target_event_id = event_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_correlated_events IS
    'Returns all events correlated to the given event, including both incoming and outgoing relationships';

-- Function to get the timeline of events around a specific event
CREATE OR REPLACE FUNCTION get_event_timeline(
    target_event_id UUID,
    hours_before INTEGER DEFAULT 24,
    hours_after INTEGER DEFAULT 24
)
RETURNS TABLE (
    event_id UUID,
    event_type TEXT,
    source_platform TEXT,
    title TEXT,
    occurred_at TIMESTAMPTZ,
    is_target BOOLEAN
) AS $$
DECLARE
    target_occurred_at TIMESTAMPTZ;
    target_project_id UUID;
BEGIN
    -- Get the target event's timestamp and project
    SELECT e.occurred_at, e.project_id
    INTO target_occurred_at, target_project_id
    FROM sdlc_events e
    WHERE e.id = target_event_id;

    RETURN QUERY
    SELECT
        e.id as event_id,
        e.event_type,
        e.source_platform,
        e.title,
        e.occurred_at,
        (e.id = target_event_id) as is_target
    FROM sdlc_events e
    WHERE e.project_id = target_project_id
      AND e.occurred_at BETWEEN
          target_occurred_at - (hours_before || ' hours')::INTERVAL
          AND target_occurred_at + (hours_after || ' hours')::INTERVAL
    ORDER BY e.occurred_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_event_timeline IS
    'Returns a timeline of events around a target event within the specified time window';

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'SDLC cross-correlation engine schema created successfully!' as message;
