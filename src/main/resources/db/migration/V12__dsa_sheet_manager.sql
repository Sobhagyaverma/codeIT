-- V12: DSA Sheet Manager — hierarchical folders + problem links (never deletes problems)

CREATE TABLE IF NOT EXISTS dsa_sheets (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dsa_folders (
    id           SERIAL PRIMARY KEY,
    sheet_id     INTEGER NOT NULL REFERENCES dsa_sheets(id) ON DELETE CASCADE,
    parent_id    INTEGER REFERENCES dsa_folders(id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    position     INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT dsa_folders_name_nonblank CHECK (LENGTH(TRIM(name)) > 0)
);

-- Sibling names unique within a sheet (NULL parent = root)
CREATE UNIQUE INDEX IF NOT EXISTS uq_dsa_folders_sibling_name
    ON dsa_folders (sheet_id, parent_id, LOWER(TRIM(name)))
    NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS idx_dsa_folders_sheet_parent_pos
    ON dsa_folders (sheet_id, parent_id, position);

CREATE INDEX IF NOT EXISTS idx_dsa_folders_parent
    ON dsa_folders (parent_id);

CREATE TABLE IF NOT EXISTS dsa_folder_problems (
    folder_id   INTEGER NOT NULL REFERENCES dsa_folders(id) ON DELETE CASCADE,
    problem_id  INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (folder_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_dsa_folder_problems_folder_pos
    ON dsa_folder_problems (folder_id, position);

CREATE INDEX IF NOT EXISTS idx_dsa_folder_problems_problem
    ON dsa_folder_problems (problem_id);

-- Default sheet + root modules matching the historical PRACTICE_ROADMAP titles
INSERT INTO dsa_sheets (name, description)
SELECT
    'Main DSA Sheet',
    'Organize problems into a structured learning roadmap.'
WHERE NOT EXISTS (SELECT 1 FROM dsa_sheets LIMIT 1);

INSERT INTO dsa_folders (sheet_id, parent_id, name, description, position)
SELECT s.id, NULL, v.name, v.description, v.pos
FROM dsa_sheets s
CROSS JOIN (
    VALUES
        (0,  'The Proving Grounds', '20 classic problems every programmer solves once — sharpen the fundamentals before moving on.'),
        (1,  'Foundations', 'Build fluency with core programming and problem-solving tools.'),
        (2,  'Arrays', 'Master traversal, prefix techniques, and array patterns.'),
        (3,  'Searching', 'Locate answers efficiently with linear and binary search.'),
        (4,  'Sorting', 'Order data and learn comparison and partitioning strategies.'),
        (5,  'Strings', 'Work with text, matching, parsing, and character patterns.'),
        (6,  'Linked List', 'Practice pointer manipulation and linked data structures.'),
        (7,  'Stack & Queue', 'Use ordered access patterns to model state and processing.'),
        (8,  'Trees', 'Traverse and reason about hierarchical data structures.'),
        (9,  'Graphs', 'Explore connectivity, traversal, and shortest-path problems.'),
        (10, 'Greedy', 'Make locally optimal choices and prove when they work.'),
        (11, 'Backtracking', 'Search solution spaces with pruning and reversible choices.'),
        (12, 'Dynamic Programming', 'Solve overlapping subproblems with memoization and tabulation.'),
        (13, 'Other', 'Explore problems outside the core curriculum tracks.')
) AS v(pos, name, description)
WHERE s.name = 'Main DSA Sheet'
  AND NOT EXISTS (
      SELECT 1 FROM dsa_folders f WHERE f.sheet_id = s.id LIMIT 1
  );
