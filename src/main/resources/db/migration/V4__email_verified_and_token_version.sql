-- Email verification + JWT session invalidation support
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- Grandfather existing accounts so current users are not locked out
UPDATE users SET email_verified = true WHERE email_verified = false;
