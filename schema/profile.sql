-- CodeIT profile backend migration
--
-- Run this file once against an existing CodeIT database:
--
-- /Library/PostgreSQL/18/bin/psql \
--   -U postgres \
--   -d codeit \
--   -f schema/profile.sql

BEGIN;

-- ============================================================
-- 1. Extend the existing users table
-- ============================================================

-- Short public description written by the user.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT;

-- URL of the user's profile image.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Optional text location such as "Delhi, India".
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS location TEXT;

-- Email is private by default.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT FALSE;

-- Registration time.
--
-- Do not give this column a default in the ADD COLUMN statement.
-- That keeps the value NULL for users that already existed before
-- this migration.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Last profile update time.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- New users created after this migration receive the real creation time.
ALTER TABLE users
    ALTER COLUMN created_at SET DEFAULT NOW();

-- New users receive an initial updated_at value.
ALTER TABLE users
    ALTER COLUMN updated_at SET DEFAULT NOW();


-- ============================================================
-- 2. Add profile-query indexes to submissions
-- ============================================================

-- Makes this query faster:
-- "Give me the newest submissions made by this user."
CREATE INDEX IF NOT EXISTS idx_submissions_user_created
    ON submissions (user_id, created_at DESC);

-- Makes this query faster:
-- "Which distinct problems has this user solved?"
--
-- Only Accepted submissions are placed in this partial index.
CREATE INDEX IF NOT EXISTS idx_submissions_user_accepted
    ON submissions (user_id, problem_id)
    WHERE status = 'Accepted';


-- ============================================================
-- 3. Create the bookmarks table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_problem_bookmarks (
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    problem_id INTEGER NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, problem_id)
);

-- Makes it fast to load a user's newest bookmarks.
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
    ON user_problem_bookmarks (user_id, created_at DESC);


-- ============================================================
-- 4. Create the recently viewed problems table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_problem_recent_views (
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    problem_id INTEGER NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    view_count INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (user_id, problem_id),

    CONSTRAINT recent_views_view_count_positive
        CHECK (view_count >= 1)
);

-- Makes it fast to load a user's most recently viewed problems.
CREATE INDEX IF NOT EXISTS idx_recent_views_user
    ON user_problem_recent_views (user_id, last_viewed_at DESC);


-- ============================================================
-- 5. Create durable competition results storage
-- ============================================================

-- This table is prepared for future finalized contest results.
-- It must never be filled with fabricated ranks or ratings.
CREATE TABLE IF NOT EXISTS competition_results (
    competition_id INTEGER NOT NULL
        REFERENCES competitions(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    rank INTEGER NOT NULL,

    solved INTEGER NOT NULL DEFAULT 0,

    score DOUBLE PRECISION,

    finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (competition_id, user_id),

    CONSTRAINT competition_results_rank_positive
        CHECK (rank >= 1),

    CONSTRAINT competition_results_solved_non_negative
        CHECK (solved >= 0)
);

-- Makes it fast to load a user's contest history.
CREATE INDEX IF NOT EXISTS idx_competition_results_user
    ON competition_results (user_id, finalized_at DESC);

COMMIT;