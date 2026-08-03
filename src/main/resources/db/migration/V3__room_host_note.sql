-- Optional host note shown on room cards / hub lists
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS host_note VARCHAR(280);

