-- Migrate users: username -> name, add uniqueuserid
-- Run once on DBs that still have the old username column:
--   psql -U postgres -d codeit -f schema/users_name_uniqueuserid.sql
--
-- Skip if you already applied these steps in pgAdmin.

ALTER TABLE users RENAME COLUMN username TO name;
ALTER TABLE users ADD COLUMN uniqueuserid VARCHAR(100);
UPDATE users SET uniqueuserid = 'user' || id WHERE uniqueuserid IS NULL;
ALTER TABLE users ALTER COLUMN uniqueuserid SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_uniqueuserid_key UNIQUE (uniqueuserid);
