-- V11: Standardise point-in-time columns to TIMESTAMPTZ.
--
-- Existing TIMESTAMP WITHOUT TIME ZONE values were written by the app JVM
-- (historically Asia/Kolkata for local CodeIT development). Treat those wall
-- clocks as Asia/Kolkata so absolute instants stay unchanged after conversion.
--
-- Idempotent: only alters columns that are still "timestamp without time zone".

DO $$
DECLARE
  src_tz text := 'Asia/Kolkata';
BEGIN
  -- competitions.start_time / end_time
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competitions'
      AND column_name = 'start_time' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competitions ALTER COLUMN start_time TYPE timestamptz USING start_time AT TIME ZONE %L',
      src_tz
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competitions'
      AND column_name = 'end_time' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competitions ALTER COLUMN end_time TYPE timestamptz USING end_time AT TIME ZONE %L',
      src_tz
    );
  END IF;

  -- Optional live-schema columns on competitions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competitions'
      AND column_name = 'registration_deadline' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competitions ALTER COLUMN registration_deadline TYPE timestamptz USING registration_deadline AT TIME ZONE %L',
      src_tz
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competitions'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competitions ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE %L',
      src_tz
    );
  END IF;

  -- competition_participants
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competition_participants'
      AND column_name = 'joined_at' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competition_participants ALTER COLUMN joined_at TYPE timestamptz USING joined_at AT TIME ZONE %L',
      src_tz
    );
    ALTER TABLE public.competition_participants
      ALTER COLUMN joined_at SET DEFAULT NOW();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competition_participants'
      AND column_name = 'started_at' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.competition_participants ALTER COLUMN started_at TYPE timestamptz USING started_at AT TIME ZONE %L',
      src_tz
    );
  END IF;

  -- submissions.created_at (heatmap / streaks)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'submissions'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.submissions ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE %L',
      src_tz
    );
    ALTER TABLE public.submissions
      ALTER COLUMN created_at SET DEFAULT NOW();
  END IF;

  -- problems.created_at (present on some live DBs, absent from early schema.sql)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'problems'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.problems ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE %L',
      src_tz
    );
    ALTER TABLE public.problems
      ALTER COLUMN created_at SET DEFAULT NOW();
  END IF;
END $$;
