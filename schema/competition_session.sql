-- Per-user competition session timer migration
-- Only needed for databases created before schema/schema.sql included these columns.
-- Fresh installs: use schema/schema.sql instead.

ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 120;

ALTER TABLE competition_participants
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS session_status VARCHAR(20) NOT NULL DEFAULT 'JOINED';
