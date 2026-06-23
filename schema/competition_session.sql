-- Per-user competition session timer migration

ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 120;

ALTER TABLE competition_participants
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS session_status VARCHAR(20) NOT NULL DEFAULT 'JOINED';
