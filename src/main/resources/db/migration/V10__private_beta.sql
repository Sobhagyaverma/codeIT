-- V10: Private beta access requests, invites, admin audit log

CREATE TABLE IF NOT EXISTS beta_access_requests (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    college         VARCHAR(200) NOT NULL,
    year            VARCHAR(40)  NOT NULL,
    reason          TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reject_reason   TEXT,
    CONSTRAINT beta_access_requests_status_chk
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_beta_access_requests_pending_email
    ON beta_access_requests (LOWER(email))
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_beta_access_requests_status_created
    ON beta_access_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS beta_invites (
    id               BIGSERIAL PRIMARY KEY,
    code_hash        VARCHAR(64)  NOT NULL,
    code_prefix      VARCHAR(16)  NOT NULL,
    email            VARCHAR(255) NOT NULL,
    request_id       BIGINT REFERENCES beta_access_requests(id) ON DELETE SET NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    expires_at       TIMESTAMPTZ  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at          TIMESTAMPTZ,
    used_by_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT beta_invites_status_chk
        CHECK (status IN ('ACTIVE', 'USED', 'REVOKED', 'EXPIRED')),
    CONSTRAINT beta_invites_code_hash_uq UNIQUE (code_hash)
);

CREATE INDEX IF NOT EXISTS idx_beta_invites_email
    ON beta_invites (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_beta_invites_status_expires
    ON beta_invites (status, expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    admin_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          VARCHAR(80)  NOT NULL,
    entity_type     VARCHAR(80),
    entity_id       VARCHAR(80),
    detail          TEXT,
    ip              VARCHAR(64),
    success         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_created
    ON admin_audit_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action_created
    ON admin_audit_logs (action, created_at DESC);
