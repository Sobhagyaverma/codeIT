-- ============================================================
-- Strip duplicated "Examples…" blocks from problem descriptions.
-- Keeps structured examples / test_cases jsonb untouched.
-- Does NOT strip inline "Example:" notes (singular).
-- Run in pgAdmin yourself. DO NOT run from the agent.
-- ============================================================

-- 1) Inspect: every problem whose description embeds an Examples block
SELECT
  id,
  title,
  difficulty,
  topics,
  length(description) AS desc_len,
  position(E'\n\nExamples' IN description) AS examples_at,
  left(description, 120) AS description_start
FROM problems
WHERE description ~ E'\\n\\nExamples(\\s*\\([^\\n]*\\))?:'
ORDER BY id;

-- 2) Preview before → after (no writes)
SELECT
  id,
  title,
  topics,
  right(
    substring(
      description
      FROM position(E'\n\nExamples' IN description)
    ),
    80
  ) AS stripped_tail_preview,
  rtrim(
    left(
      description,
      position(E'\n\nExamples' IN description) - 1
    )
  ) AS cleaned_description
FROM problems
WHERE description ~ E'\\n\\nExamples(\\s*\\([^\\n]*\\))?:'
ORDER BY id;

-- 3) Apply (run only after preview looks right)
UPDATE problems
SET description = rtrim(
  left(
    description,
    position(E'\n\nExamples' IN description) - 1
  )
)
WHERE description ~ E'\\n\\nExamples(\\s*\\([^\\n]*\\))?:';

-- 4) Verify nothing left
SELECT id, title, topics
FROM problems
WHERE description ~ E'\\n\\nExamples(\\s*\\([^\\n]*\\))?:'
ORDER BY id;
