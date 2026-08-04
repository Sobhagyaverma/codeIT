CREATE TABLE IF NOT EXISTS contact_messages (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(120) NOT NULL,
    user_id         INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    user_email      VARCHAR(255) NOT NULL,
    subject         VARCHAR(300) NOT NULL,
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    client_ip       VARCHAR(64) NULL,
    user_agent      VARCHAR(512) NULL,
    attempt_count   INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
    ON contact_messages (status, created_at);
