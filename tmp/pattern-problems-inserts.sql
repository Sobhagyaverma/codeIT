-- ============================================================
-- Pattern Problems INSERTs (topic must be exactly ["Pattern Problems"])
-- Uses jsonb_build_* + E'...' so newlines are REAL (not literal \n).
-- Run ONE BATCH at a time in pgAdmin. Paste RETURNING ids back into chat.
-- DO NOT run from the agent.
-- ============================================================

-- #################### BATCH 1: EASY (10) ####################

-- 1) solid square
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Solid Star Square',
  E'Print an n×n solid square of asterisks.\n\nCharacter set: only ''*''.\n\nSpacing: No spaces. Each row is exactly n stars.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'***\n***\n***'),
    jsonb_build_object('input', E'5', 'output', E'*****\n*****\n*****\n*****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'***\n***\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*****\n*****\n*****\n*****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 2) hollow square
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Hollow Star Square',
  E'Print an n×n hollow square of asterisks (border only).\n\nCharacter set: only ''*'' and interior space '' ''.\n\nSpacing: Interior cells are spaces; preserve them between border stars.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'***\n* *\n***'),
    jsonb_build_object('input', E'5', 'output', E'*****\n*   *\n*   *\n*   *\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'***\n* *\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*****\n*   *\n*   *\n*   *\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 3) right triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Right Triangle Stars',
  E'Print a right triangle of stars: row i has i stars (i = 1..n).\n\nCharacter set: only ''*''.\n\nSpacing: No leading or trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*\n**\n***'),
    jsonb_build_object('input', E'5', 'output', E'*\n**\n***\n****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*\n**\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*\n**\n***\n****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 4) inverted right triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Inverted Right Triangle',
  E'Print an inverted right triangle: first row has n stars, then n-1, down to 1.\n\nCharacter set: only ''*''.\n\nSpacing: No leading or trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'***\n**\n*'),
    jsonb_build_object('input', E'5', 'output', E'*****\n****\n***\n**\n*')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'***\n**\n*'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*****\n****\n***\n**\n*'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 5) number triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Number Triangle',
  E'Print a number triangle: row i prints integers 1..i separated by single spaces.\n\nCharacter set: decimal digits and single spaces between numbers.\n\nSpacing: No trailing space after the last number on each line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1\n1 2\n1 2 3'),
    jsonb_build_object('input', E'5', 'output', E'1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1\n1 2\n1 2 3'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1')
  )
)
RETURNING id, title;

-- 6) solid pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Simple Solid Pyramid',
  E'Print a centered solid pyramid of height n. Row i (1..n) has (n-i) leading spaces then (2*i-1) stars.\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter. Do not print trailing spaces after the last star on a line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n ***\n*****'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   ***\n  *****\n *******\n*********')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n ***\n*****'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   ***\n  *****\n *******\n*********'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 7) right-aligned triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Right-Aligned Triangle',
  E'Print a right-aligned triangle: row i has (n-i) leading spaces then i stars.\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter. No trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n **\n***'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   **\n  ***\n ****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n **\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   **\n  ***\n ****\n*****'),
    jsonb_build_object('stdin', E'1', 'stdout', E'*')
  )
)
RETURNING id, title;

-- 8) X pattern (odd n)
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'X Pattern',
  E'Print an n×n X made of ''*'' on both diagonals; all other cells are spaces. n is odd.\n\nCharacter set: only ''*'' and space '' ''.\n\nSpacing: Keep every row exactly n characters wide (spaces count).\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'* *\n * \n* *'),
    jsonb_build_object('input', E'5', 'output', E'*   *\n * * \n  *  \n * * \n*   *')
  ),
  jsonb_build_array(E'n is odd', E'3 ≤ n ≤ 19', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'* *\n * \n* *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*   *\n * * \n  *  \n * * \n*   *')
  )
)
RETURNING id, title;

-- 9) plus sign (odd n)
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Plus Sign Pattern',
  E'Print an n×n plus sign: middle row and middle column are ''*''; other cells are spaces. n is odd.\n\nCharacter set: only ''*'' and space '' ''.\n\nSpacing: Keep every row exactly n characters wide.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E' * \n***\n * '),
    jsonb_build_object('input', E'5', 'output', E'  *  \n  *  \n*****\n  *  \n  *  ')
  ),
  jsonb_build_array(E'n is odd', E'3 ≤ n ≤ 19', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E' * \n***\n * '),
    jsonb_build_object('stdin', E'5', 'stdout', E'  *  \n  *  \n*****\n  *  \n  *  ')
  )
)
RETURNING id, title;

-- 10) staircase
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Simple Staircase',
  E'Print a staircase: row i contains i stars.\n\nCharacter set: only ''*''.\n\nSpacing: No leading or trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'EASY',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*\n**\n***'),
    jsonb_build_object('input', E'5', 'output', E'*\n**\n***\n****\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*\n**\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*\n**\n***\n****\n*****'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*\n**\n***\n****')
  )
)
RETURNING id, title;

-- #################### BATCH 2: MEDIUM (10) ####################

-- medium: 1) solid pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Solid Pyramid',
  E'Print a centered solid pyramid of height n (same geometry as the easy pyramid).\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter; no trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n ***\n*****'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   ***\n  *****\n *******\n*********')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n ***\n*****'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   ***\n  *****\n *******\n*********'),
    jsonb_build_object('stdin', E'4', 'stdout', E'   *\n  ***\n *****\n*******')
  )
)
RETURNING id, title;

-- medium: 2) inverted pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Inverted Pyramid',
  E'Print a centered inverted pyramid of height n. First row has (2*n-1) stars; each next row has 2 fewer stars, with increasing leading spaces.\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter; no trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*****\n ***\n  *'),
    jsonb_build_object('input', E'5', 'output', E'*********\n *******\n  *****\n   ***\n    *')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*****\n ***\n  *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*********\n *******\n  *****\n   ***\n    *'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*******\n *****\n  ***\n   *')
  )
)
RETURNING id, title;

-- medium: 3) diamond
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Diamond Stars',
  E'Print a diamond of height 2*n-1: a pyramid of height n stacked on an inverted pyramid of height n-1.\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter; no trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n ***\n*****\n ***\n  *'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   ***\n  *****\n *******\n*********\n *******\n  *****\n   ***\n    *')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n ***\n*****\n ***\n  *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   ***\n  *****\n *******\n*********\n *******\n  *****\n   ***\n    *'),
    jsonb_build_object('stdin', E'2', 'stdout', E' *\n***\n *')
  )
)
RETURNING id, title;

-- medium: 4) hollow triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Hollow Triangle',
  E'Print a hollow right triangle: only borders are ''*''. Row i has length i.\n\nCharacter set: only ''*'' and spaces inside the triangle.\n\nSpacing: Preserve interior spaces on hollow rows.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*\n**\n***'),
    jsonb_build_object('input', E'5', 'output', E'*\n**\n* *\n*  *\n*****')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*\n**\n***'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*\n**\n* *\n*  *\n*****'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*\n**\n* *\n****')
  )
)
RETURNING id, title;

-- medium: 5) hollow pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Hollow Pyramid',
  E'Print a hollow centered pyramid of height n (border stars only).\n\nCharacter set: only ''*'' and spaces.\n\nSpacing: Leading spaces and interior hollow spaces both matter; no trailing spaces after the last star.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n * *\n*****'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   * *\n  *   *\n *     *\n*********')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n * *\n*****'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   * *\n  *   *\n *     *\n*********'),
    jsonb_build_object('stdin', E'4', 'stdout', E'   *\n  * *\n *   *\n*******')
  )
)
RETURNING id, title;

-- medium: 6) Floyd
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Floyd''s Triangle',
  E'Print Floyd''s triangle with n rows: consecutive integers starting at 1, space-separated.\n\nCharacter set: decimal digits and single spaces.\n\nSpacing: No trailing space after the last number on each line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1\n2 3\n4 5 6'),
    jsonb_build_object('input', E'5', 'output', E'1\n2 3\n4 5 6\n7 8 9 10\n11 12 13 14 15')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1\n2 3\n4 5 6'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1\n2 3\n4 5 6\n7 8 9 10\n11 12 13 14 15'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1\n2 3\n4 5 6\n7 8 9 10')
  )
)
RETURNING id, title;

-- medium: 7) half butterfly
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Half Butterfly',
  E'Print a half-butterfly of size n: upper wings grow 1..n, then shrink n-1..1. Between wings, spaces fill so total width is 2*n.\n\nCharacter set: only ''*'' and spaces.\n\nSpacing: Spaces between the left and right wings matter; keep the full width.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*    *\n**  **\n******\n**  **\n*    *'),
    jsonb_build_object('input', E'5', 'output', E'*        *\n**      **\n***    ***\n****  ****\n**********\n****  ****\n***    ***\n**      **\n*        *')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*    *\n**  **\n******\n**  **\n*    *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*        *\n**      **\n***    ***\n****  ****\n**********\n****  ****\n***    ***\n**      **\n*        *'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*      *\n**    **\n***  ***\n********\n***  ***\n**    **\n*      *')
  )
)
RETURNING id, title;

-- medium: 8) zigzag
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Zigzag Slashes',
  E'Print n rows where row i consists of i copies of ''/'' if i is odd, else i copies of ''\\''.\n\nCharacter set: only ''/'' and ''\\\\'' (backslash).\n\nSpacing: No spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'/\n\\\\\n///'),
    jsonb_build_object('input', E'5', 'output', E'/\n\\\\\n///\n\\\\\\\\\n/////')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'/\n\\\\\n///'),
    jsonb_build_object('stdin', E'5', 'stdout', E'/\n\\\\\n///\n\\\\\\\\\n/////'),
    jsonb_build_object('stdin', E'4', 'stdout', E'/\n\\\\\n///\n\\\\\\\\')
  )
)
RETURNING id, title;

-- medium: 9) alphabet triangle
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Alphabet Triangle',
  E'Print a triangle of uppercase letters: row i is ABC… with i letters starting from A.\n\nCharacter set: uppercase A–Z only.\n\nSpacing: No spaces between letters.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'A\nAB\nABC'),
    jsonb_build_object('input', E'5', 'output', E'A\nAB\nABC\nABCD\nABCDE')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'A\nAB\nABC'),
    jsonb_build_object('stdin', E'5', 'stdout', E'A\nAB\nABC\nABCD\nABCDE'),
    jsonb_build_object('stdin', E'1', 'stdout', E'A')
  )
)
RETURNING id, title;

-- medium: 10) repeating row value
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Repeating Row Numbers',
  E'Print a triangle where row i contains the number i repeated i times, separated by single spaces.\n\nCharacter set: digits and single spaces.\n\nSpacing: No trailing space after the last number on a line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'MEDIUM',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1\n2 2\n3 3 3'),
    jsonb_build_object('input', E'5', 'output', E'1\n2 2\n3 3 3\n4 4 4 4\n5 5 5 5 5')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1\n2 2\n3 3 3'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1\n2 2\n3 3 3\n4 4 4 4\n5 5 5 5 5'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1\n2 2\n3 3 3\n4 4 4 4')
  )
)
RETURNING id, title;

-- #################### BATCH 3: HARD (10) ####################

-- hard: 1) full butterfly
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Full Butterfly',
  E'Print a full butterfly of size n (same as half butterfly for this sheet: wings grow then shrink with spaces between).\n\nCharacter set: only ''*'' and spaces.\n\nSpacing: Spaces between wings matter; total width is 2*n each row.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*    *\n**  **\n******\n**  **\n*    *'),
    jsonb_build_object('input', E'5', 'output', E'*        *\n**      **\n***    ***\n****  ****\n**********\n****  ****\n***    ***\n**      **\n*        *')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*    *\n**  **\n******\n**  **\n*    *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*        *\n**      **\n***    ***\n****  ****\n**********\n****  ****\n***    ***\n**      **\n*        *'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*      *\n**    **\n***  ***\n********\n***  ***\n**    **\n*      *')
  )
)
RETURNING id, title;

-- hard: 2) number diamond
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Diamond of Numbers',
  E'Print a number diamond: upper half row i has (n-i) spaces then 1..i; lower half mirrors without repeating the middle.\n\nCharacter set: digits, single spaces between numbers, and leading spaces.\n\nSpacing: Leading spaces matter; no trailing space after last number.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  1\n 1 2\n1 2 3\n 1 2\n  1'),
    jsonb_build_object('input', E'5', 'output', E'    1\n   1 2\n  1 2 3\n 1 2 3 4\n1 2 3 4 5\n 1 2 3 4\n  1 2 3\n   1 2\n    1')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  1\n 1 2\n1 2 3\n 1 2\n  1'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    1\n   1 2\n  1 2 3\n 1 2 3 4\n1 2 3 4 5\n 1 2 3 4\n  1 2 3\n   1 2\n    1'),
    jsonb_build_object('stdin', E'2', 'stdout', E' 1\n1 2\n 1')
  )
)
RETURNING id, title;

-- hard: 3) Pascal
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Pascal''s Triangle',
  E'Print the first n rows of Pascal''s triangle (binomial coefficients), numbers separated by single spaces.\n\nCharacter set: decimal digits and single spaces.\n\nSpacing: No trailing space after the last number on a line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1\n1 1\n1 2 1'),
    jsonb_build_object('input', E'5', 'output', E'1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1\n1 1\n1 2 1'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1\n1 1\n1 2 1\n1 3 3 1')
  )
)
RETURNING id, title;

-- hard: 4) hourglass
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Hourglass Stars',
  E'Print an hourglass of height 2*n-1: inverted pyramid then pyramid sharing the single-star middle.\n\nCharacter set: only ''*'' and leading spaces.\n\nSpacing: Leading spaces matter; no trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*****\n ***\n  *\n ***\n*****'),
    jsonb_build_object('input', E'5', 'output', E'*********\n *******\n  *****\n   ***\n    *\n   ***\n  *****\n *******\n*********')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*****\n ***\n  *\n ***\n*****'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*********\n *******\n  *****\n   ***\n    *\n   ***\n  *****\n *******\n*********'),
    jsonb_build_object('stdin', E'2', 'stdout', E'***\n *\n***')
  )
)
RETURNING id, title;

-- hard: 5) palindromic pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Palindromic Number Pyramid',
  E'Print a palindromic number pyramid: row i has (n-i) spaces then 1..i..(1), numbers space-separated.\n\nCharacter set: digits, spaces between numbers, leading spaces.\n\nSpacing: Leading spaces matter; no trailing space after last number.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  1\n 1 2 1\n1 2 3 2 1'),
    jsonb_build_object('input', E'5', 'output', E'    1\n   1 2 1\n  1 2 3 2 1\n 1 2 3 4 3 2 1\n1 2 3 4 5 4 3 2 1')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  1\n 1 2 1\n1 2 3 2 1'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    1\n   1 2 1\n  1 2 3 2 1\n 1 2 3 4 3 2 1\n1 2 3 4 5 4 3 2 1'),
    jsonb_build_object('stdin', E'4', 'stdout', E'   1\n  1 2 1\n 1 2 3 2 1\n1 2 3 4 3 2 1')
  )
)
RETURNING id, title;

-- hard: 6) hollow diamond
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Hollow Diamond',
  E'Print a hollow diamond of half-size n (total rows 2*n-1): only border stars.\n\nCharacter set: only ''*'' and spaces.\n\nSpacing: Leading and interior spaces matter; no trailing spaces after the last star.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  *\n * *\n*   *\n * *\n  *'),
    jsonb_build_object('input', E'5', 'output', E'    *\n   * *\n  *   *\n *     *\n*       *\n *     *\n  *   *\n   * *\n    *')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  *\n * *\n*   *\n * *\n  *'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    *\n   * *\n  *   *\n *     *\n*       *\n *     *\n  *   *\n   * *\n    *'),
    jsonb_build_object('stdin', E'2', 'stdout', E' *\n* *\n *')
  )
)
RETURNING id, title;

-- hard: 7) spiral square
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Spiral Square Numbers',
  E'Fill an n×n matrix with 1..n² in clockwise spiral order starting at top-left going right. Print rows with numbers separated by single spaces.\n\nCharacter set: decimal digits and single spaces.\n\nSpacing: No trailing space after the last number on a line.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1 2 3\n8 9 4\n7 6 5'),
    jsonb_build_object('input', E'4', 'output', E'1 2 3 4\n12 13 14 5\n11 16 15 6\n10 9 8 7')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1 2 3\n8 9 4\n7 6 5'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1 2 3 4\n12 13 14 5\n11 16 15 6\n10 9 8 7'),
    jsonb_build_object('stdin', E'2', 'stdout', E'1 2\n4 3')
  )
)
RETURNING id, title;

-- hard: 8) checkerboard
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Checkerboard Block',
  E'Print an n×n checkerboard using ''#'' on black cells and ''.'' on white cells, starting with ''#'' at top-left.\n\nCharacter set: only ''#'' and ''.''.\n\nSpacing: No spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'#.#\n.#.\n#.#'),
    jsonb_build_object('input', E'5', 'output', E'#.#.#\n.#.#.\n#.#.#\n.#.#.\n#.#.#')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'#.#\n.#.\n#.#'),
    jsonb_build_object('stdin', E'5', 'stdout', E'#.#.#\n.#.#.\n#.#.#\n.#.#.\n#.#.#'),
    jsonb_build_object('stdin', E'4', 'stdout', E'#.#.\n.#.#\n#.#.\n.#.#')
  )
)
RETURNING id, title;

-- hard: 9) alternating pyramid
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Alternating Character Pyramid',
  E'Print a centered pyramid: odd rows use ''A'', even rows use ''B''. Row i has (n-i) spaces then (2*i-1) letters.\n\nCharacter set: uppercase ''A''/''B'' and leading spaces.\n\nSpacing: Leading spaces matter; no trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'  A\n BBB\nAAAAA'),
    jsonb_build_object('input', E'5', 'output', E'    A\n   BBB\n  AAAAA\n BBBBBBB\nAAAAAAAAA')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'  A\n BBB\nAAAAA'),
    jsonb_build_object('stdin', E'5', 'stdout', E'    A\n   BBB\n  AAAAA\n BBBBBBB\nAAAAAAAAA'),
    jsonb_build_object('stdin', E'4', 'stdout', E'   A\n  BBB\n AAAAA\nBBBBBBB')
  )
)
RETURNING id, title;

-- hard: 10) up-down staircase
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Up-Down Staircase',
  E'Print stars that climb 1..n then descend n-1..1 (peak row once).\n\nCharacter set: only ''*''.\n\nSpacing: No leading or trailing spaces.\n\nInput: a single integer n.\n\nPrint the pattern for the given n. Match the sample output exactly (characters and spaces).\n',
  E'HARD',
  '["Pattern Problems"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'*\n**\n***\n**\n*'),
    jsonb_build_object('input', E'5', 'output', E'*\n**\n***\n****\n*****\n****\n***\n**\n*')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 20', E'Output characters exactly as specified', E'Do not print trailing spaces after the last visible character on a line unless the sample shows them', E'Each line ends with a newline'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'*\n**\n***\n**\n*'),
    jsonb_build_object('stdin', E'5', 'stdout', E'*\n**\n***\n****\n*****\n****\n***\n**\n*'),
    jsonb_build_object('stdin', E'4', 'stdout', E'*\n**\n***\n****\n***\n**\n*')
  )
)
RETURNING id, title;
