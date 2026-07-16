-- CodeIT base schema (reconstructed from Java repositories)
-- Fresh install:
--   CREATE DATABASE codeit;
--   psql -U postgres -d codeit -f schema/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    uniqueuserid  VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER'
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
    start_time        TIMESTAMP NOT NULL,
    end_time          TIMESTAMP NOT NULL,
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
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMP,
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
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_session
    ON competition_participants(session_status)
    WHERE session_status = 'IN_PROGRESS';
