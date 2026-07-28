-- ============================================================
-- Pattern Basics learn problems (topic MUST be exactly ["Pattern Basics"])
-- One unique problem per Learn Basics read+problem lesson.
-- Uses jsonb_build_* + E'...' for REAL newlines.
-- Run in pgAdmin, paste RETURNING id, title back into chat.
-- DO NOT run from the agent.
-- ============================================================

-- 1) printing-a-line
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Star Line',
  E'Print exactly n asterisks on a single line, then end the line.\n\nCharacter set: only ''*''.\n\nSpacing: No spaces between stars. No leading or trailing spaces.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n***\n\nn = 5\n*****',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'***'),
    jsonb_build_object('input', E'5', 'output', E'*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Exactly one line of n stars', E'Trailing newline is OK'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*'),
    jsonb_build_object('stdin', E'4', 'stdout', E'****')
  )
)
RETURNING id, title;

-- 2) printing-numbers
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Number Line',
  E'Print the integers from 1 to n on a single line, separated by single spaces.\n\nCharacter set: decimal digits and single spaces between numbers.\n\nSpacing: No trailing space after the last number. End with a newline.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n1 2 3\n\nn = 5\n1 2 3 4 5',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1 2 3'),
    jsonb_build_object('input', E'5', 'output', E'1 2 3 4 5')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Exactly one line', E'No trailing space after the last number'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1 2 3'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1 2 3 4 5'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1 2 3 4')
  )
)
RETURNING id, title;

-- 3) horizontal-patterns
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Growing Star Rows',
  E'Print a right triangle of stars that grows horizontally: row i (1..n) contains exactly i asterisks.\n\nCharacter set: only ''*''.\n\nSpacing: No leading or trailing spaces on any line.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n*\n**\n***\n\nn = 5\n*\n**\n***\n****\n*****',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*\n**\n***'),
    jsonb_build_object('input', E'5', 'output', E'*\n**\n***\n****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Row i has exactly i stars', E'No spaces'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*\n**\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*\n**\n***\n****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*\n**\n***\n****')
  )
)
RETURNING id, title;

-- 4) vertical-patterns
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Stacked Star Rows',
  E'Print n identical rows stacked vertically. Each row is exactly n asterisks (an n×n solid block).\n\nCharacter set: only ''*''.\n\nSpacing: No spaces. Each row length is n.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n***\n***\n***\n\nn = 5\n*****\n*****\n*****\n*****\n*****',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'***\n***\n***'),
    jsonb_build_object('input', E'5', 'output', E'*****\n*****\n*****\n*****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Exactly n rows of n stars', E'No spaces'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'***\n***\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*****\n*****\n*****\n*****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*'),
    jsonb_build_object('stdin', E'2', 'stdout', E'**\n**')
  )
)
RETURNING id, title;

-- 5) nested-loops-for-shapes
-- Unique from Stacked Star Rows: each cell prints the 1-based column index (forces inner-loop thinking).
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Row-Column Number Grid',
  E'Using nested loops (outer = row, inner = column), print an n×n grid.\n\nOn every row, print the column indices 1 2 … n separated by single spaces.\nAll n rows are identical.\n\nCharacter set: decimal digits and single spaces between numbers.\n\nSpacing: No trailing space after the last number on a line.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n1 2 3\n1 2 3\n1 2 3\n\nn = 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1 2 3\n1 2 3\n1 2 3'),
    jsonb_build_object('input', E'5', 'output', E'1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'n rows, each with 1..n space-separated', E'No trailing space after the last number'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1 2 3\n1 2 3\n1 2 3'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5\n1 2 3 4 5'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'2', 'stdout', E'1 2\n1 2')
  )
)
RETURNING id, title;

-- 6) using-spaces-on-purpose
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Indented Star Triangle',
  E'Print a right-aligned triangle of stars.\n\nFor row i (1..n): print exactly (n-i) leading spaces, then i asterisks.\n\nCharacter set: space '' '' and ''*'' only.\n\nSpacing: Leading spaces matter and must match the samples. Do not print trailing spaces after the last star.\n\nInput: one integer n.\n\nExamples (literal output; · shown here only in this comment as space — real output uses spaces):\n\nn = 3\n  *\n **\n***\n\nn = 5\n    *\n   **\n  ***\n ****\n*****',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n **\n***'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   **\n  ***\n ****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Leading spaces required', E'No trailing spaces after the last star'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n **\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   **\n  ***\n ****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*'),
    jsonb_build_object('stdin', E'2', 'stdout', E' *\n**')
  )
)
RETURNING id, title;

-- 7) rows-that-depend-on-i
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Counting Triangle',
  E'Print a number triangle where row i depends on i: on row i print 1 2 … i separated by single spaces.\n\nCharacter set: decimal digits and single spaces between numbers.\n\nSpacing: No trailing space after the last number on each line.\n\nInput: one integer n.\n\nExamples (literal output):\n\nn = 3\n1\n1 2\n1 2 3\n\nn = 5\n1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5',
  E'EASY',
  '["Pattern Basics"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1\n1 2\n1 2 3'),
    jsonb_build_object('input', E'5', 'output', E'1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Row i prints 1..i', E'No trailing space after the last number'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1\n1 2\n1 2 3'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1\n1 2\n1 2 3\n1 2 3 4')
  )
)
RETURNING id, title;
