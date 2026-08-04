-- V6: Friend system schema (QuickClash social layer — Task 1)
--
-- ER (Task 1):
--   users 1──* friend_requests (as from_user / to_user)
--   users *──* users via friends (undirected edge: user_id_low < user_id_high)
--
-- Notifications and quick_contest_* tables land in later migrations.

CREATE TABLE IF NOT EXISTS friend_requests (
    id              BIGSERIAL PRIMARY KEY,
    from_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ NULL,
    CONSTRAINT chk_friend_request_not_self CHECK (from_user_id <> to_user_id),
    CONSTRAINT chk_friend_request_status CHECK (
        status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'IGNORED')
    )
);

-- At most one PENDING request between a directed pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_friend_requests_pending_pair
    ON friend_requests (from_user_id, to_user_id)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_friend_requests_to_pending
    ON friend_requests (to_user_id, created_at DESC)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_friend_requests_from
    ON friend_requests (from_user_id, created_at DESC);

-- Undirected friendship: always store lower id first
CREATE TABLE IF NOT EXISTS friends (
    user_id_low     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_high    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id_low, user_id_high),
    CONSTRAINT chk_friends_ordered CHECK (user_id_low < user_id_high)
);

CREATE INDEX IF NOT EXISTS idx_friends_low ON friends (user_id_low);
CREATE INDEX IF NOT EXISTS idx_friends_high ON friends (user_id_high);
