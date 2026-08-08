-- CodeT base schema (reconstructed from Java repositories)
-- Fresh install:
--   CREATE DATABASE codeit;
--   psql -U postgres -d codeit -f schema/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    uniqueuserid  VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'USER',
    bio           TEXT,
    avatar_url    TEXT,
    location      TEXT,
    show_email    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    difficulty        VARCHAR(50) NOT NULL,
    topics            JSONB NOT NULL DEFAULT '[]'::jsonb,
    examples          JSONB NOT NULL DEFAULT '[]'::jsonb,
    constraints_data  JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_cases        JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS competitions (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    start_time        TIMESTAMPTZ NOT NULL,
    end_time          TIMESTAMPTZ NOT NULL,
    created_by        INTEGER NOT NULL REFERENCES users(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    duration_minutes  INTEGER NOT NULL DEFAULT 120
);

CREATE TABLE IF NOT EXISTS competition_problems (
    competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    problem_id     INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    PRIMARY KEY (competition_id, problem_id)
);

CREATE TABLE IF NOT EXISTS competition_participants (
    id              SERIAL PRIMARY KEY,
    competition_id  INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    session_status  VARCHAR(20) NOT NULL DEFAULT 'JOINED',
    UNIQUE (competition_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id      INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language        VARCHAR(50) NOT NULL,
    code            TEXT NOT NULL,
    status          VARCHAR(50) NOT NULL,
    runtime         DOUBLE PRECISION,
    memory          REAL,
    competition_id  INTEGER REFERENCES competitions(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_session
    ON competition_participants(session_status)
    WHERE session_status = 'IN_PROGRESS';

CREATE INDEX IF NOT EXISTS idx_submissions_user_created
    ON submissions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_user_accepted
    ON submissions(user_id, problem_id)
    WHERE status = 'Accepted';

CREATE TABLE IF NOT EXISTS user_problem_bookmarks (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
    ON user_problem_bookmarks(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_problem_recent_views (
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id      INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    last_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    view_count      INTEGER NOT NULL DEFAULT 1 CHECK (view_count >= 1),
    PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_views_user
    ON user_problem_recent_views(user_id, last_viewed_at DESC);

CREATE TABLE IF NOT EXISTS competition_results (
    competition_id  INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank            INTEGER NOT NULL CHECK (rank >= 1),
    solved          INTEGER NOT NULL DEFAULT 0 CHECK (solved >= 0),
    score           DOUBLE PRECISION,
    finalized_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_results_user
    ON competition_results(user_id, finalized_at DESC);

-- AI Learning Coach tables
CREATE TABLE IF NOT EXISTS ai_sessions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id          BIGSERIAL PRIMARY KEY,
    session_id  BIGINT NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,
    action      VARCHAR(64),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session
    ON ai_messages(session_id, created_at ASC);

CREATE TABLE IF NOT EXISTS ai_hint_progress (
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id          INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    max_unlocked_level  INTEGER NOT NULL DEFAULT 0 CHECK (max_unlocked_level BETWEEN 0 AND 3),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS submission_diagnostics (
    submission_id    INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
    verdict          VARCHAR(50) NOT NULL,
    passed_count     INTEGER NOT NULL DEFAULT 0,
    total_count      INTEGER NOT NULL DEFAULT 0,
    failed_index     INTEGER,
    compile_output   TEXT,
    stderr_summary   TEXT,
    judge_engine     VARCHAR(40),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collaboration rooms tables
CREATE TABLE IF NOT EXISTS rooms (
    id               UUID PRIMARY KEY,
    type             VARCHAR(20) NOT NULL,  -- PROBLEM_COLLAB | CODEROOM
    problem_id       INTEGER NULL REFERENCES problems(id),
    host_user_id     INTEGER NOT NULL REFERENCES users(id),
    invite_token     VARCHAR(64) NOT NULL UNIQUE,
    active_workspace VARCHAR(20) NOT NULL DEFAULT 'CODE',    -- CODE | WHITEBOARD
    language         VARCHAR(32) NOT NULL DEFAULT 'java',
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ARCHIVED
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_invite_token ON rooms(invite_token);
CREATE INDEX IF NOT EXISTS idx_rooms_problem_id ON rooms(problem_id);
CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON rooms(host_user_id);

CREATE TABLE IF NOT EXISTS room_members (
    room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL,  -- HOST | EDITOR | VIEWER
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

CREATE TABLE IF NOT EXISTS room_messages (
    id         BIGSERIAL PRIMARY KEY,
    room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_created
    ON room_messages(room_id, created_at ASC);

CREATE TABLE IF NOT EXISTS room_snapshots (
    id            BIGSERIAL PRIMARY KEY,
    room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    workspace     VARCHAR(20) NOT NULL,  -- CODE | WHITEBOARD
    snapshot_data BYTEA NOT NULL,        -- Yjs encoded state
    updated_by    INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_snapshots_room_workspace
    ON room_snapshots(room_id, workspace);

CREATE TABLE IF NOT EXISTS room_events (
    id         BIGSERIAL PRIMARY KEY,
    room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id    INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,  -- MEMBER_JOINED, WORKSPACE_SWITCHED, RUN_STARTED
    payload    JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_events_room_created
    ON room_events(room_id, created_at ASC);
