-- V9: Prod hardening — missing FK/join indexes (idempotent)

-- Official competitions
CREATE INDEX IF NOT EXISTS idx_competitions_created_by
    ON competitions (created_by);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user_id
    ON competition_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_competition_problems_problem_id
    ON competition_problems (problem_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_session
    ON competition_participants (session_status)
    WHERE session_status = 'IN_PROGRESS';

-- Submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user_id
    ON submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id
    ON submissions (problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id
    ON submissions (competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_created
    ON submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_accepted
    ON submissions (user_id, problem_id)
    WHERE status = 'Accepted';

-- Profile / results
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
    ON user_problem_bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_views_user
    ON user_problem_recent_views (user_id, last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_results_user
    ON competition_results (user_id, finalized_at DESC);

-- AI reverse lookups
CREATE INDEX IF NOT EXISTS idx_ai_sessions_problem_id
    ON ai_sessions (problem_id);
CREATE INDEX IF NOT EXISTS idx_ai_hint_progress_problem_id
    ON ai_hint_progress (problem_id);

-- Contact
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id
    ON contact_messages (user_id);

-- Collaboration reverse user lookups
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id
    ON room_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_room_events_user_id
    ON room_events (user_id);

-- Quick Clash
CREATE INDEX IF NOT EXISTS idx_qcp_problem_id
    ON quick_contest_problems (problem_id);
CREATE INDEX IF NOT EXISTS idx_qcr_user_id
    ON quick_contest_results (user_id);
CREATE INDEX IF NOT EXISTS idx_qcs_user_created
    ON quick_contest_submissions (user_id, created_at DESC);
