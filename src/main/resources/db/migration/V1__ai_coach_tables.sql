-- AI Learning Coach tables (practice problems only)

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
