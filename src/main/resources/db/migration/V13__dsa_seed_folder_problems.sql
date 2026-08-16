-- V13: Seed dsa_folder_problems from existing problem topics (idempotent).
-- Mirrors historical PRACTICE_ROADMAP topic aliases so the manager is not empty.

-- Only run when no links exist yet (do not overwrite admin edits).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM dsa_folder_problems LIMIT 1) THEN
    RAISE NOTICE 'dsa_folder_problems already populated — skip topic seed';
    RETURN;
  END IF;

  -- Alias map: folder display name -> topic aliases (lowercase)
  CREATE TEMP TABLE tmp_dsa_topic_map (
    folder_name TEXT NOT NULL,
    alias       TEXT NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_dsa_topic_map (folder_name, alias) VALUES
    ('The Proving Grounds', 'the proving grounds'),
    ('Foundations', 'basics'),
    ('Foundations', 'fundamentals'),
    ('Foundations', 'implementation'),
    ('Foundations', 'math'),
    ('Foundations', 'mathematics'),
    ('Foundations', 'bit manipulation'),
    ('Foundations', 'bitwise'),
    ('Foundations', 'hashing'),
    ('Foundations', 'hash map'),
    ('Foundations', 'hashmap'),
    ('Foundations', 'hash table'),
    ('Foundations', 'set'),
    ('Arrays', 'array'),
    ('Arrays', 'arrays'),
    ('Arrays', 'matrix'),
    ('Arrays', 'prefix sum'),
    ('Arrays', 'two pointers'),
    ('Arrays', 'sliding window'),
    ('Searching', 'search'),
    ('Searching', 'searching'),
    ('Searching', 'binary search'),
    ('Searching', 'linear search'),
    ('Searching', 'ternary search'),
    ('Sorting', 'sort'),
    ('Sorting', 'sorting'),
    ('Sorting', 'merge sort'),
    ('Sorting', 'quick sort'),
    ('Sorting', 'counting sort'),
    ('Sorting', 'heap sort'),
    ('Strings', 'string'),
    ('Strings', 'strings'),
    ('Strings', 'string matching'),
    ('Strings', 'trie'),
    ('Strings', 'prefix tree'),
    ('Linked List', 'linked list'),
    ('Linked List', 'linked lists'),
    ('Linked List', 'singly linked list'),
    ('Linked List', 'doubly linked list'),
    ('Stack & Queue', 'stack'),
    ('Stack & Queue', 'stacks'),
    ('Stack & Queue', 'queue'),
    ('Stack & Queue', 'queues'),
    ('Stack & Queue', 'deque'),
    ('Stack & Queue', 'monotonic stack'),
    ('Stack & Queue', 'monotonic queue'),
    ('Stack & Queue', 'priority queue'),
    ('Stack & Queue', 'heap'),
    ('Trees', 'tree'),
    ('Trees', 'trees'),
    ('Trees', 'binary tree'),
    ('Trees', 'binary search tree'),
    ('Trees', 'bst'),
    ('Trees', 'segment tree'),
    ('Trees', 'fenwick tree'),
    ('Graphs', 'graph'),
    ('Graphs', 'graphs'),
    ('Graphs', 'graph theory'),
    ('Graphs', 'bfs'),
    ('Graphs', 'breadth first search'),
    ('Graphs', 'dfs'),
    ('Graphs', 'depth first search'),
    ('Graphs', 'shortest path'),
    ('Graphs', 'dijkstra'),
    ('Graphs', 'topological sort'),
    ('Graphs', 'union find'),
    ('Graphs', 'disjoint set'),
    ('Greedy', 'greedy'),
    ('Greedy', 'greedy algorithm'),
    ('Greedy', 'greedy algorithms'),
    ('Backtracking', 'backtracking'),
    ('Backtracking', 'recursion'),
    ('Backtracking', 'divide and conquer'),
    ('Backtracking', 'branch and bound'),
    ('Dynamic Programming', 'dp'),
    ('Dynamic Programming', 'dynamic programming'),
    ('Dynamic Programming', 'memoization'),
    ('Dynamic Programming', 'tabulation'),
    ('Dynamic Programming', 'knapsack');

  -- First matching folder wins (priority = folder.position)
  WITH problem_topics AS (
    SELECT
      p.id AS problem_id,
      lower(trim(t.topic)) AS topic
    FROM problems p
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(p.topics) = 'array' THEN p.topics
        ELSE '[]'::jsonb
      END
    ) AS t(topic)
    WHERE lower(trim(t.topic)) NOT IN (
      'pattern basics',
      'pattern problems',
      'start here',
      'control flow',
      'operators'
    )
  ),
  ranked AS (
    SELECT
      f.id AS folder_id,
      pt.problem_id,
      ROW_NUMBER() OVER (
        PARTITION BY pt.problem_id
        ORDER BY f.position ASC, f.id ASC
      ) AS rn
    FROM problem_topics pt
    JOIN tmp_dsa_topic_map m ON m.alias = pt.topic
    JOIN dsa_folders f
      ON f.parent_id IS NULL
     AND lower(f.name) = lower(m.folder_name)
  ),
  assigned AS (
    INSERT INTO dsa_folder_problems (folder_id, problem_id, position)
    SELECT
      r.folder_id,
      r.problem_id,
      ROW_NUMBER() OVER (PARTITION BY r.folder_id ORDER BY r.problem_id) - 1
    FROM ranked r
    WHERE r.rn = 1
    ON CONFLICT DO NOTHING
    RETURNING problem_id
  ),
  leftover AS (
    SELECT p.id AS problem_id
    FROM problems p
    WHERE NOT EXISTS (
      SELECT 1 FROM dsa_folder_problems fp WHERE fp.problem_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(p.topics) = 'array' THEN p.topics
          ELSE '[]'::jsonb
        END
      ) AS t(topic)
      WHERE lower(trim(t.topic)) IN (
        'pattern basics',
        'pattern problems',
        'start here',
        'control flow',
        'operators'
      )
    )
  )
  INSERT INTO dsa_folder_problems (folder_id, problem_id, position)
  SELECT
    f.id,
    l.problem_id,
    ROW_NUMBER() OVER (ORDER BY l.problem_id) - 1
  FROM leftover l
  CROSS JOIN dsa_folders f
  WHERE f.parent_id IS NULL
    AND f.name = 'Other'
  ON CONFLICT DO NOTHING;

END $$;
