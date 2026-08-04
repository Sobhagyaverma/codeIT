-- V8: Quick Clash private contests (Tasks 4–10)
-- Separate from official competitions — no rating / profile solved impact.

CREATE TABLE IF NOT EXISTS quick_contests (
    id                  BIGSERIAL PRIMARY KEY,
    host_user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(200) NOT NULL,
    description         TEXT NULL,
    difficulty_tier     VARCHAR(20) NOT NULL,
    duration_minutes    INTEGER NOT NULL,
    max_players         INTEGER NOT NULL DEFAULT 4,
    status              VARCHAR(20) NOT NULL DEFAULT 'LOBBY',
    invite_token        VARCHAR(64) NOT NULL UNIQUE,
    started_at          TIMESTAMPTZ NULL,
    ends_at             TIMESTAMPTZ NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_qc_tier CHECK (difficulty_tier IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT chk_qc_status CHECK (status IN ('LOBBY', 'LIVE', 'ENDED', 'CANCELLED')),
    CONSTRAINT chk_qc_duration CHECK (duration_minutes BETWEEN 15 AND 120),
    CONSTRAINT chk_qc_players CHECK (max_players BETWEEN 2 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_quick_contests_host ON quick_contests (host_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_contests_status ON quick_contests (status);

CREATE TABLE IF NOT EXISTS quick_contest_participants (
    id              BIGSERIAL PRIMARY KEY,
    contest_id      BIGINT NOT NULL REFERENCES quick_contests(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
    status          VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    ready           BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at       TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (contest_id, user_id),
    CONSTRAINT chk_qcp_role CHECK (role IN ('HOST', 'PLAYER')),
    CONSTRAINT chk_qcp_status CHECK (status IN ('INVITED', 'JOINED', 'LEFT'))
);

CREATE INDEX IF NOT EXISTS idx_qcp_user ON quick_contest_participants (user_id, status);
CREATE INDEX IF NOT EXISTS idx_qcp_contest ON quick_contest_participants (contest_id, status);

CREATE TABLE IF NOT EXISTS quick_contest_problems (
    contest_id      BIGINT NOT NULL REFERENCES quick_contests(id) ON DELETE CASCADE,
    problem_id      INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    ordinal         SMALLINT NOT NULL,
    PRIMARY KEY (contest_id, problem_id),
    UNIQUE (contest_id, ordinal)
);

CREATE TABLE IF NOT EXISTS quick_contest_submissions (
    id              BIGSERIAL PRIMARY KEY,
    contest_id      BIGINT NOT NULL REFERENCES quick_contests(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id      INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language        VARCHAR(50) NOT NULL,
    language_id     INTEGER NOT NULL,
    code            TEXT NOT NULL,
    verdict         VARCHAR(50) NOT NULL,
    runtime_ms      DOUBLE PRECISION NULL,
    memory_kb       REAL NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qcs_contest_user
    ON quick_contest_submissions (contest_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_qcs_contest_problem
    ON quick_contest_submissions (contest_id, problem_id, user_id);

CREATE TABLE IF NOT EXISTS quick_contest_results (
    contest_id      BIGINT NOT NULL REFERENCES quick_contests(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    placement       INTEGER NOT NULL,
    solved_count    INTEGER NOT NULL DEFAULT 0,
    penalty         INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (contest_id, user_id)
);
