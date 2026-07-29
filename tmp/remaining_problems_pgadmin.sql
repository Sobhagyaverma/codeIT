-- Paste into pgAdmin Query Tool
-- Adds problems with id > 31; skips if already present
BEGIN;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  32,
  E'Your First Words on Screen',
  E'Write a program that prints exactly this line (nothing more, nothing less):

Hello, world!

There is no input. Do not print prompts. Spelling, capitalization, comma, space, and exclamation mark must match exactly. A trailing newline is fine.

This is the classic first program — it proves you can run code and send text to the output the judge reads.

Allowed languages: Python, Java, or C++.',
  E'EASY',
  E'[{"input": "(none)", "output": "Hello, world!"}]'::jsonb,
  E'["No input", "Output must be exactly: Hello, world!", "No extra prompts or spaces"]'::jsonb,
  E'[{"stdin": "", "stdout": "Hello, world!"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  33,
  E'The Number Mirror',
  E'Read one integer from the input and print that same integer back out.

The input is a single integer on one line. Print only that number — no labels, words, or questions. Negative numbers and zero are valid.

Steps: read the value from standard input, then print it to standard output.

Example
Input: 42
Output: 42',
  E'EASY',
  E'[{"input": "7", "output": "7"}, {"input": "-3", "output": "-3"}, {"input": "0", "output": "0"}]'::jsonb,
  E'["-1000 <= n <= 1000", "Print only the integer", "No prompt text"]'::jsonb,
  E'[{"stdin": "7", "stdout": "7"}, {"stdin": "-3", "stdout": "-3"}, {"stdin": "0", "stdout": "0"}, {"stdin": "1000", "stdout": "1000"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  34,
  E'Label the Box',
  E'Read one integer from input, store it in a variable, then print the value of that variable.

Use a clearly named variable (for example: n, value, or number). Assign the input to it, then print the variable — not a hard-coded number. Print only the number.

A variable is a named box that holds a value. Put the input in the box, then print what is in the box.

Example
Input: 15
Output: 15',
  E'EASY',
  E'[{"input": "42", "output": "42"}, {"input": "9", "output": "9"}]'::jsonb,
  E'["-1000 <= n <= 1000", "Use a variable to store the input before printing"]'::jsonb,
  E'[{"stdin": "42", "stdout": "42"}, {"stdin": "9", "stdout": "9"}, {"stdin": "-8", "stdout": "-8"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  35,
  E'Whole Numbers Only',
  E'Read one whole number (an integer) and print it exactly as an integer.

The input is always an integer (no decimal point). Print it as an integer with no extra words or prompts.

This practices the integer data type: whole numbers like -2, -1, 0, 1, 2, …

Example
Input: 100
Output: 100',
  E'EASY',
  E'[{"input": "15", "output": "15"}, {"input": "0", "output": "0"}, {"input": "-99", "output": "-99"}]'::jsonb,
  E'["-10000 <= n <= 10000", "Treat the value as an integer"]'::jsonb,
  E'[{"stdin": "15", "stdout": "15"}, {"stdin": "0", "stdout": "0"}, {"stdin": "-99", "stdout": "-99"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  36,
  E'Add the Pair',
  E'Read two integers from one line (separated by a space) and print their sum.

Input format: a b (example: 2 3). Compute a + b and print a single integer — the sum only. Do not print the expression itself.

The + operator means add.

Example
Input: 2 3
Output: 5

Example
Input: -4 7
Output: 3',
  E'EASY',
  E'[{"input": "2 3", "output": "5"}, {"input": "-4 7", "output": "3"}, {"input": "10 -3", "output": "7"}]'::jsonb,
  E'["-1000 <= a, b <= 1000", "Two integers on one line, space-separated", "Print only the sum"]'::jsonb,
  E'[{"stdin": "2 3", "stdout": "5"}, {"stdin": "-4 7", "stdout": "3"}, {"stdin": "0 0", "stdout": "0"}, {"stdin": "10 -3", "stdout": "7"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  37,
  E'Shop Checkout Math',
  E'Read three integers on one line: price, tax, and qty. Print the value of:

(price + tax) * qty

Input format: price tax qty (example: 10 2 3). Add price and tax first, then multiply by qty. Parentheses matter: (price + tax) * qty is not the same as price + tax * qty. Print one integer — the final total.

Example
Input: 10 2 3
Calculation: (10 + 2) * 3 = 36
Output: 36',
  E'EASY',
  E'[{"input": "10 2 3", "output": "36"}, {"input": "5 0 4", "output": "20"}, {"input": "1 1 1", "output": "2"}]'::jsonb,
  E'["0 <= price, tax, qty <= 1000", "Use (price + tax) * qty"]'::jsonb,
  E'[{"stdin": "10 2 3", "stdout": "36"}, {"stdin": "5 0 4", "stdout": "20"}, {"stdin": "1 1 1", "stdout": "2"}, {"stdin": "8 2 0", "stdout": "0"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  38,
  E'Notes for Future You',
  E'Read one integer (the score) and print double that score (score * 2).

Also add at least one comment in your source code that briefly explains what the program does. Comments are ignored by the computer and the judge — they never appear in the output.

Comment syntax:
Python:  # this is a comment
Java/C++: // this is a comment

Example
Input: 5
Output: 10',
  E'EASY',
  E'[{"input": "5", "output": "10"}, {"input": "0", "output": "0"}, {"input": "-3", "output": "-6"}]'::jsonb,
  E'["-1000 <= score <= 1000", "Print only score * 2", "Include at least one comment in your code"]'::jsonb,
  E'[{"stdin": "5", "stdout": "10"}, {"stdin": "0", "stdout": "0"}, {"stdin": "-3", "stdout": "-6"}, {"stdin": "100", "stdout": "200"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  39,
  E'Catch the Wrong Operator',
  E'Read two integers a and b from one line (space-separated) and print their sum: a + b.

Correct result uses addition (+). A common bug is using multiplication (*) by mistake — that prints a product, not a sum. Print only the sum as one integer.

Check a sample: 3 + 4 should be 7. If you see 12, you multiplied instead of added.

Example
Input: 3 4
Output: 7',
  E'EASY',
  E'[{"input": "3 4", "output": "7"}, {"input": "10 0", "output": "10"}, {"input": "-2 5", "output": "3"}]'::jsonb,
  E'["-1000 <= a, b <= 1000", "Print a + b (not a * b)"]'::jsonb,
  E'[{"stdin": "3 4", "stdout": "7"}, {"stdin": "10 0", "stdout": "10"}, {"stdin": "-2 5", "stdout": "3"}, {"stdin": "6 6", "stdout": "12"}]'::jsonb,
  TIMESTAMP '2026-07-27 10:45:33.471923',
  E'["Start Here"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  40,
  E'Is It Positive?',
  E'Read one integer n.

If n is greater than 0, print Positive.
Otherwise, print Not positive.

Output must match exactly (case and spaces).',
  E'EASY',
  E'[{"input": "5", "output": "Positive"}, {"input": "0", "output": "Not positive"}, {"input": "-3", "output": "Not positive"}]'::jsonb,
  E'["-1000 ≤ n ≤ 1000", "Print exactly Positive or Not positive"]'::jsonb,
  E'[{"stdin": "5", "stdout": "Positive"}, {"stdin": "0", "stdout": "Not positive"}, {"stdin": "-3", "stdout": "Not positive"}, {"stdin": "1", "stdout": "Positive"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  41,
  E'Even or Odd Gate',
  E'Read one integer n.

If n is divisible by 2, print Even.
Otherwise, print Odd.',
  E'EASY',
  E'[{"input": "4", "output": "Even"}, {"input": "7", "output": "Odd"}]'::jsonb,
  E'["-1000 ≤ n ≤ 1000", "Print exactly Even or Odd"]'::jsonb,
  E'[{"stdin": "4", "stdout": "Even"}, {"stdin": "7", "stdout": "Odd"}, {"stdin": "0", "stdout": "Even"}, {"stdin": "-2", "stdout": "Even"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  42,
  E'Sign of the Number',
  E'Read one integer n.

Print Positive if n > 0.
Print Zero if n == 0.
Print Negative if n < 0.',
  E'EASY',
  E'[{"input": "12", "output": "Positive"}, {"input": "0", "output": "Zero"}, {"input": "-5", "output": "Negative"}]'::jsonb,
  E'["-1000 ≤ n ≤ 1000", "Print exactly Positive, Zero, or Negative"]'::jsonb,
  E'[{"stdin": "12", "stdout": "Positive"}, {"stdin": "0", "stdout": "Zero"}, {"stdin": "-5", "stdout": "Negative"}, {"stdin": "1", "stdout": "Positive"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  43,
  E'Weekday Shortcut',
  E'Read one integer d.

Print:
- Mon if d is 1
- Tue if d is 2
- Wed if d is 3
- Invalid for any other value',
  E'EASY',
  E'[{"input": "1", "output": "Mon"}, {"input": "3", "output": "Wed"}, {"input": "9", "output": "Invalid"}]'::jsonb,
  E'["0 ≤ d ≤ 10", "Print exactly Mon, Tue, Wed, or Invalid"]'::jsonb,
  E'[{"stdin": "1", "stdout": "Mon"}, {"stdin": "2", "stdout": "Tue"}, {"stdin": "3", "stdout": "Wed"}, {"stdin": "0", "stdout": "Invalid"}, {"stdin": "9", "stdout": "Invalid"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  44,
  E'Count Up to N',
  E'Read one integer n (1 ≤ n ≤ 100).

Print every integer from 1 to n inclusive, each on its own line.',
  E'EASY',
  E'[{"input": "3", "output": "1
2
3"}, {"input": "1", "output": "1"}]'::jsonb,
  E'["1 ≤ n ≤ 100", "One number per line, from 1 to n"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
2
3"}, {"stdin": "1", "stdout": "1"}, {"stdin": "5", "stdout": "1
2
3
4
5"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  45,
  E'Countdown Clock',
  E'Read one integer n (1 ≤ n ≤ 100).

Print n, then n-1, then n-2, … down to 1.
One number per line.',
  E'EASY',
  E'[{"input": "3", "output": "3
2
1"}, {"input": "1", "output": "1"}]'::jsonb,
  E'["1 ≤ n ≤ 100", "One number per line, from n down to 1"]'::jsonb,
  E'[{"stdin": "3", "stdout": "3
2
1"}, {"stdin": "1", "stdout": "1"}, {"stdin": "4", "stdout": "4
3
2
1"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  46,
  E'Until Zero',
  E'Read integers one per line until you read 0.

Print every non-zero number on its own line, in the same order.
Do not print the final 0.

Input always ends with 0.',
  E'EASY',
  E'[{"input": "3
-1
7
0", "output": "3
-1
7"}, {"input": "0", "output": ""}]'::jsonb,
  E'["-1000 ≤ each value ≤ 1000", "At most 100 numbers before the terminating 0", "Do not print the 0"]'::jsonb,
  E'[{"stdin": "3
-1
7
0", "stdout": "3
-1
7"}, {"stdin": "0", "stdout": ""}, {"stdin": "5
0", "stdout": "5"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  47,
  E'First Multiple of Seven',
  E'Read one integer n (1 ≤ n ≤ 1000).

Print the smallest integer x such that x ≥ n and x is divisible by 7.',
  E'EASY',
  E'[{"input": "10", "output": "14"}, {"input": "7", "output": "7"}, {"input": "1", "output": "7"}]'::jsonb,
  E'["1 ≤ n ≤ 1000", "Print a single integer"]'::jsonb,
  E'[{"stdin": "10", "stdout": "14"}, {"stdin": "7", "stdout": "7"}, {"stdin": "1", "stdout": "7"}, {"stdin": "21", "stdout": "21"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  48,
  E'Odds Only',
  E'Read one integer n (1 ≤ n ≤ 100).

Print every odd integer from 1 to n inclusive, each on its own line.
Skip even numbers.',
  E'EASY',
  E'[{"input": "5", "output": "1
3
5"}, {"input": "1", "output": "1"}, {"input": "4", "output": "1
3"}]'::jsonb,
  E'["1 ≤ n ≤ 100", "One odd number per line"]'::jsonb,
  E'[{"stdin": "5", "stdout": "1
3
5"}, {"stdin": "1", "stdout": "1"}, {"stdin": "4", "stdout": "1
3"}, {"stdin": "2", "stdout": "1"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  49,
  E'Star Square',
  E'Read one integer n (1 ≤ n ≤ 20).

Print an n×n square of asterisks (*).
Each row has exactly n stars and no spaces.
Print a newline after each row.',
  E'EASY',
  E'[{"input": "3", "output": "***
***
***"}, {"input": "1", "output": "*"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "No spaces between stars"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***
***
***"}, {"stdin": "1", "stdout": "*"}, {"stdin": "2", "stdout": "**
**"}]'::jsonb,
  TIMESTAMP '2026-07-27 17:19:00.875418',
  E'["Control Flow"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  50,
  E'Solid Star Square',
  E'Print an n×n solid square of asterisks.

Character set: only ''*''.

Spacing: No spaces. Each row is exactly n stars.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "***
***
***"}, {"input": "5", "output": "*****
*****
*****
*****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***
***
***"}, {"stdin": "5", "stdout": "*****
*****
*****
*****
*****"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  51,
  E'Hollow Star Square',
  E'Print an n×n hollow square of asterisks (border only).

Character set: only ''*'' and interior space '' ''.

Spacing: Interior cells are spaces; preserve them between border stars.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "***
* *
***"}, {"input": "5", "output": "*****
*   *
*   *
*   *
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***
* *
***"}, {"stdin": "5", "stdout": "*****
*   *
*   *
*   *
*****"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  52,
  E'Right Triangle Stars',
  E'Print a right triangle of stars: row i has i stars (i = 1..n).

Character set: only ''*''.

Spacing: No leading or trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "*
**
***"}, {"input": "5", "output": "*
**
***
****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*
**
***"}, {"stdin": "5", "stdout": "*
**
***
****
*****"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  53,
  E'Inverted Right Triangle',
  E'Print an inverted right triangle: first row has n stars, then n-1, down to 1.

Character set: only ''*''.

Spacing: No leading or trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "***
**
*"}, {"input": "5", "output": "*****
****
***
**
*"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***
**
*"}, {"stdin": "5", "stdout": "*****
****
***
**
*"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  54,
  E'Number Triangle',
  E'Print a number triangle: row i prints integers 1..i separated by single spaces.

Character set: decimal digits and single spaces between numbers.

Spacing: No trailing space after the last number on each line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "1
1 2
1 2 3"}, {"input": "5", "output": "1
1 2
1 2 3
1 2 3 4
1 2 3 4 5"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
1 2
1 2 3"}, {"stdin": "5", "stdout": "1
1 2
1 2 3
1 2 3 4
1 2 3 4 5"}, {"stdin": "1", "stdout": "1"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  55,
  E'Simple Solid Pyramid',
  E'Print a centered solid pyramid of height n. Row i (1..n) has (n-i) leading spaces then (2*i-1) stars.

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter. Do not print trailing spaces after the last star on a line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "  *
 ***
*****"}, {"input": "5", "output": "    *
   ***
  *****
 *******
*********"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 ***
*****"}, {"stdin": "5", "stdout": "    *
   ***
  *****
 *******
*********"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  56,
  E'Right-Aligned Triangle',
  E'Print a right-aligned triangle: row i has (n-i) leading spaces then i stars.

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter. No trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "  *
 **
***"}, {"input": "5", "output": "    *
   **
  ***
 ****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 **
***"}, {"stdin": "5", "stdout": "    *
   **
  ***
 ****
*****"}, {"stdin": "1", "stdout": "*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  57,
  E'X Pattern',
  E'Print an n×n X made of ''*'' on both diagonals; all other cells are spaces. n is odd.

Character set: only ''*'' and space '' ''.

Spacing: Keep every row exactly n characters wide (spaces count).

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "* *
 * 
* *"}, {"input": "5", "output": "*   *
 * * 
  *  
 * * 
*   *"}]'::jsonb,
  E'["n is odd", "3 ≤ n ≤ 19", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "* *
 * 
* *"}, {"stdin": "5", "stdout": "*   *
 * * 
  *  
 * * 
*   *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  58,
  E'Plus Sign Pattern',
  E'Print an n×n plus sign: middle row and middle column are ''*''; other cells are spaces. n is odd.

Character set: only ''*'' and space '' ''.

Spacing: Keep every row exactly n characters wide.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": " * 
***
 * "}, {"input": "5", "output": "  *  
  *  
*****
  *  
  *  "}]'::jsonb,
  E'["n is odd", "3 ≤ n ≤ 19", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": " * 
***
 * "}, {"stdin": "5", "stdout": "  *  
  *  
*****
  *  
  *  "}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  59,
  E'Simple Staircase',
  E'Print a staircase: row i contains i stars.

Character set: only ''*''.

Spacing: No leading or trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'EASY',
  E'[{"input": "3", "output": "*
**
***"}, {"input": "5", "output": "*
**
***
****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*
**
***"}, {"stdin": "5", "stdout": "*
**
***
****
*****"}, {"stdin": "4", "stdout": "*
**
***
****"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  60,
  E'Solid Pyramid',
  E'Print a centered solid pyramid of height n (same geometry as the easy pyramid).

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter; no trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "  *
 ***
*****"}, {"input": "5", "output": "    *
   ***
  *****
 *******
*********"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 ***
*****"}, {"stdin": "5", "stdout": "    *
   ***
  *****
 *******
*********"}, {"stdin": "4", "stdout": "   *
  ***
 *****
*******"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  61,
  E'Inverted Pyramid',
  E'Print a centered inverted pyramid of height n. First row has (2*n-1) stars; each next row has 2 fewer stars, with increasing leading spaces.

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter; no trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "*****
 ***
  *"}, {"input": "5", "output": "*********
 *******
  *****
   ***
    *"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*****
 ***
  *"}, {"stdin": "5", "stdout": "*********
 *******
  *****
   ***
    *"}, {"stdin": "4", "stdout": "*******
 *****
  ***
   *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  62,
  E'Diamond Stars',
  E'Print a diamond of height 2*n-1: a pyramid of height n stacked on an inverted pyramid of height n-1.

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter; no trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "  *
 ***
*****
 ***
  *"}, {"input": "5", "output": "    *
   ***
  *****
 *******
*********
 *******
  *****
   ***
    *"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 ***
*****
 ***
  *"}, {"stdin": "5", "stdout": "    *
   ***
  *****
 *******
*********
 *******
  *****
   ***
    *"}, {"stdin": "2", "stdout": " *
***
 *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  63,
  E'Hollow Triangle',
  E'Print a hollow right triangle: only borders are ''*''. Row i has length i.

Character set: only ''*'' and spaces inside the triangle.

Spacing: Preserve interior spaces on hollow rows.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "*
**
***"}, {"input": "5", "output": "*
**
* *
*  *
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*
**
***"}, {"stdin": "5", "stdout": "*
**
* *
*  *
*****"}, {"stdin": "4", "stdout": "*
**
* *
****"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  64,
  E'Hollow Pyramid',
  E'Print a hollow centered pyramid of height n (border stars only).

Character set: only ''*'' and spaces.

Spacing: Leading spaces and interior hollow spaces both matter; no trailing spaces after the last star.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "  *
 * *
*****"}, {"input": "5", "output": "    *
   * *
  *   *
 *     *
*********"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 * *
*****"}, {"stdin": "5", "stdout": "    *
   * *
  *   *
 *     *
*********"}, {"stdin": "4", "stdout": "   *
  * *
 *   *
*******"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  65,
  E'Floyd''s Triangle',
  E'Print Floyd''s triangle with n rows: consecutive integers starting at 1, space-separated.

Character set: decimal digits and single spaces.

Spacing: No trailing space after the last number on each line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "1
2 3
4 5 6"}, {"input": "5", "output": "1
2 3
4 5 6
7 8 9 10
11 12 13 14 15"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
2 3
4 5 6"}, {"stdin": "5", "stdout": "1
2 3
4 5 6
7 8 9 10
11 12 13 14 15"}, {"stdin": "4", "stdout": "1
2 3
4 5 6
7 8 9 10"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  66,
  E'Half Butterfly',
  E'Print a half-butterfly of size n: upper wings grow 1..n, then shrink n-1..1. Between wings, spaces fill so total width is 2*n.

Character set: only ''*'' and spaces.

Spacing: Spaces between the left and right wings matter; keep the full width.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "*    *
**  **
******
**  **
*    *"}, {"input": "5", "output": "*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*    *
**  **
******
**  **
*    *"}, {"stdin": "5", "stdout": "*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *"}, {"stdin": "4", "stdout": "*      *
**    **
***  ***
********
***  ***
**    **
*      *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  67,
  E'Zigzag Slashes',
  E'Print n rows where row i consists of i copies of ''/'' if i is odd, else i copies of ''\\''.

Character set: only ''/'' and ''\\\\'' (backslash).

Spacing: No spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "/
\\\\
///"}, {"input": "5", "output": "/
\\\\
///
\\\\\\\\
/////"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "/
\\\\
///"}, {"stdin": "5", "stdout": "/
\\\\
///
\\\\\\\\
/////"}, {"stdin": "4", "stdout": "/
\\\\
///
\\\\\\\\"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  68,
  E'Alphabet Triangle',
  E'Print a triangle of uppercase letters: row i is ABC… with i letters starting from A.

Character set: uppercase A–Z only.

Spacing: No spaces between letters.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "A
AB
ABC"}, {"input": "5", "output": "A
AB
ABC
ABCD
ABCDE"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "A
AB
ABC"}, {"stdin": "5", "stdout": "A
AB
ABC
ABCD
ABCDE"}, {"stdin": "1", "stdout": "A"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  69,
  E'Repeating Row Numbers',
  E'Print a triangle where row i contains the number i repeated i times, separated by single spaces.

Character set: digits and single spaces.

Spacing: No trailing space after the last number on a line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'MEDIUM',
  E'[{"input": "3", "output": "1
2 2
3 3 3"}, {"input": "5", "output": "1
2 2
3 3 3
4 4 4 4
5 5 5 5 5"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
2 2
3 3 3"}, {"stdin": "5", "stdout": "1
2 2
3 3 3
4 4 4 4
5 5 5 5 5"}, {"stdin": "4", "stdout": "1
2 2
3 3 3
4 4 4 4"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  70,
  E'Full Butterfly',
  E'Print a full butterfly of size n (same as half butterfly for this sheet: wings grow then shrink with spaces between).

Character set: only ''*'' and spaces.

Spacing: Spaces between wings matter; total width is 2*n each row.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "*    *
**  **
******
**  **
*    *"}, {"input": "5", "output": "*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*    *
**  **
******
**  **
*    *"}, {"stdin": "5", "stdout": "*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *"}, {"stdin": "4", "stdout": "*      *
**    **
***  ***
********
***  ***
**    **
*      *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  71,
  E'Diamond of Numbers',
  E'Print a number diamond: upper half row i has (n-i) spaces then 1..i; lower half mirrors without repeating the middle.

Character set: digits, single spaces between numbers, and leading spaces.

Spacing: Leading spaces matter; no trailing space after last number.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "  1
 1 2
1 2 3
 1 2
  1"}, {"input": "5", "output": "    1
   1 2
  1 2 3
 1 2 3 4
1 2 3 4 5
 1 2 3 4
  1 2 3
   1 2
    1"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  1
 1 2
1 2 3
 1 2
  1"}, {"stdin": "5", "stdout": "    1
   1 2
  1 2 3
 1 2 3 4
1 2 3 4 5
 1 2 3 4
  1 2 3
   1 2
    1"}, {"stdin": "2", "stdout": " 1
1 2
 1"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  72,
  E'Pascal''s Triangle',
  E'Print the first n rows of Pascal''s triangle (binomial coefficients), numbers separated by single spaces.

Character set: decimal digits and single spaces.

Spacing: No trailing space after the last number on a line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "1
1 1
1 2 1"}, {"input": "5", "output": "1
1 1
1 2 1
1 3 3 1
1 4 6 4 1"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
1 1
1 2 1"}, {"stdin": "5", "stdout": "1
1 1
1 2 1
1 3 3 1
1 4 6 4 1"}, {"stdin": "4", "stdout": "1
1 1
1 2 1
1 3 3 1"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  73,
  E'Hourglass Stars',
  E'Print an hourglass of height 2*n-1: inverted pyramid then pyramid sharing the single-star middle.

Character set: only ''*'' and leading spaces.

Spacing: Leading spaces matter; no trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "*****
 ***
  *
 ***
*****"}, {"input": "5", "output": "*********
 *******
  *****
   ***
    *
   ***
  *****
 *******
*********"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*****
 ***
  *
 ***
*****"}, {"stdin": "5", "stdout": "*********
 *******
  *****
   ***
    *
   ***
  *****
 *******
*********"}, {"stdin": "2", "stdout": "***
 *
***"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  74,
  E'Palindromic Number Pyramid',
  E'Print a palindromic number pyramid: row i has (n-i) spaces then 1..i..(1), numbers space-separated.

Character set: digits, spaces between numbers, leading spaces.

Spacing: Leading spaces matter; no trailing space after last number.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "  1
 1 2 1
1 2 3 2 1"}, {"input": "5", "output": "    1
   1 2 1
  1 2 3 2 1
 1 2 3 4 3 2 1
1 2 3 4 5 4 3 2 1"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  1
 1 2 1
1 2 3 2 1"}, {"stdin": "5", "stdout": "    1
   1 2 1
  1 2 3 2 1
 1 2 3 4 3 2 1
1 2 3 4 5 4 3 2 1"}, {"stdin": "4", "stdout": "   1
  1 2 1
 1 2 3 2 1
1 2 3 4 3 2 1"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  75,
  E'Hollow Diamond',
  E'Print a hollow diamond of half-size n (total rows 2*n-1): only border stars.

Character set: only ''*'' and spaces.

Spacing: Leading and interior spaces matter; no trailing spaces after the last star.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "  *
 * *
*   *
 * *
  *"}, {"input": "5", "output": "    *
   * *
  *   *
 *     *
*       *
 *     *
  *   *
   * *
    *"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 * *
*   *
 * *
  *"}, {"stdin": "5", "stdout": "    *
   * *
  *   *
 *     *
*       *
 *     *
  *   *
   * *
    *"}, {"stdin": "2", "stdout": " *
* *
 *"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  76,
  E'Spiral Square Numbers',
  E'Fill an n×n matrix with 1..n² in clockwise spiral order starting at top-left going right. Print rows with numbers separated by single spaces.

Character set: decimal digits and single spaces.

Spacing: No trailing space after the last number on a line.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "1 2 3
8 9 4
7 6 5"}, {"input": "4", "output": "1 2 3 4
12 13 14 5
11 16 15 6
10 9 8 7"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1 2 3
8 9 4
7 6 5"}, {"stdin": "4", "stdout": "1 2 3 4
12 13 14 5
11 16 15 6
10 9 8 7"}, {"stdin": "2", "stdout": "1 2
4 3"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  77,
  E'Checkerboard Block',
  E'Print an n×n checkerboard using ''#'' on black cells and ''.'' on white cells, starting with ''#'' at top-left.

Character set: only ''#'' and ''.''.

Spacing: No spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "#.#
.#.
#.#"}, {"input": "5", "output": "#.#.#
.#.#.
#.#.#
.#.#.
#.#.#"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "#.#
.#.
#.#"}, {"stdin": "5", "stdout": "#.#.#
.#.#.
#.#.#
.#.#.
#.#.#"}, {"stdin": "4", "stdout": "#.#.
.#.#
#.#.
.#.#"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  78,
  E'Alternating Character Pyramid',
  E'Print a centered pyramid: odd rows use ''A'', even rows use ''B''. Row i has (n-i) spaces then (2*i-1) letters.

Character set: uppercase ''A''/''B'' and leading spaces.

Spacing: Leading spaces matter; no trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "  A
 BBB
AAAAA"}, {"input": "5", "output": "    A
   BBB
  AAAAA
 BBBBBBB
AAAAAAAAA"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  A
 BBB
AAAAA"}, {"stdin": "5", "stdout": "    A
   BBB
  AAAAA
 BBBBBBB
AAAAAAAAA"}, {"stdin": "4", "stdout": "   A
  BBB
 AAAAA
BBBBBBB"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  79,
  E'Up-Down Staircase',
  E'Print stars that climb 1..n then descend n-1..1 (peak row once).

Character set: only ''*''.

Spacing: No leading or trailing spaces.

Input: a single integer n.

Print the pattern for the given n. Match the sample output exactly (characters and spaces).
',
  E'HARD',
  E'[{"input": "3", "output": "*
**
***
**
*"}, {"input": "5", "output": "*
**
***
****
*****
****
***
**
*"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Output characters exactly as specified", "Do not print trailing spaces after the last visible character on a line unless the sample shows them", "Each line ends with a newline"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*
**
***
**
*"}, {"stdin": "5", "stdout": "*
**
***
****
*****
****
***
**
*"}, {"stdin": "4", "stdout": "*
**
***
****
***
**
*"}]'::jsonb,
  TIMESTAMP '2026-07-28 08:56:45.210497',
  E'["Pattern Problems"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  80,
  E'Star Line',
  E'Print exactly n asterisks on a single line, then end the line.

Character set: only ''*''.

Spacing: No spaces between stars. No leading or trailing spaces.

Input: one integer n.

Examples (literal output):

n = 3
***

n = 5
*****',
  E'EASY',
  E'[{"input": "3", "output": "***"}, {"input": "5", "output": "*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Exactly one line of n stars", "Trailing newline is OK"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***"}, {"stdin": "5", "stdout": "*****"}, {"stdin": "1", "stdout": "*"}, {"stdin": "4", "stdout": "****"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  81,
  E'Number Line',
  E'Print the integers from 1 to n on a single line, separated by single spaces.

Character set: decimal digits and single spaces between numbers.

Spacing: No trailing space after the last number. End with a newline.

Input: one integer n.

Examples (literal output):

n = 3
1 2 3

n = 5
1 2 3 4 5',
  E'EASY',
  E'[{"input": "3", "output": "1 2 3"}, {"input": "5", "output": "1 2 3 4 5"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Exactly one line", "No trailing space after the last number"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1 2 3"}, {"stdin": "5", "stdout": "1 2 3 4 5"}, {"stdin": "1", "stdout": "1"}, {"stdin": "4", "stdout": "1 2 3 4"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  82,
  E'Growing Star Rows',
  E'Print a right triangle of stars that grows horizontally: row i (1..n) contains exactly i asterisks.

Character set: only ''*''.

Spacing: No leading or trailing spaces on any line.

Input: one integer n.

Examples (literal output):

n = 3
*
**
***

n = 5
*
**
***
****
*****',
  E'EASY',
  E'[{"input": "3", "output": "*
**
***"}, {"input": "5", "output": "*
**
***
****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Row i has exactly i stars", "No spaces"]'::jsonb,
  E'[{"stdin": "3", "stdout": "*
**
***"}, {"stdin": "5", "stdout": "*
**
***
****
*****"}, {"stdin": "1", "stdout": "*"}, {"stdin": "4", "stdout": "*
**
***
****"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  83,
  E'Stacked Star Rows',
  E'Print n identical rows stacked vertically. Each row is exactly n asterisks (an n×n solid block).

Character set: only ''*''.

Spacing: No spaces. Each row length is n.

Input: one integer n.

Examples (literal output):

n = 3
***
***
***

n = 5
*****
*****
*****
*****
*****',
  E'EASY',
  E'[{"input": "3", "output": "***
***
***"}, {"input": "5", "output": "*****
*****
*****
*****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Exactly n rows of n stars", "No spaces"]'::jsonb,
  E'[{"stdin": "3", "stdout": "***
***
***"}, {"stdin": "5", "stdout": "*****
*****
*****
*****
*****"}, {"stdin": "1", "stdout": "*"}, {"stdin": "2", "stdout": "**
**"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  84,
  E'Row-Column Number Grid',
  E'Using nested loops (outer = row, inner = column), print an n×n grid.

On every row, print the column indices 1 2 … n separated by single spaces.
All n rows are identical.

Character set: decimal digits and single spaces between numbers.

Spacing: No trailing space after the last number on a line.

Input: one integer n.

Examples (literal output):

n = 3
1 2 3
1 2 3
1 2 3

n = 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5',
  E'EASY',
  E'[{"input": "3", "output": "1 2 3
1 2 3
1 2 3"}, {"input": "5", "output": "1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "n rows, each with 1..n space-separated", "No trailing space after the last number"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1 2 3
1 2 3
1 2 3"}, {"stdin": "5", "stdout": "1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5
1 2 3 4 5"}, {"stdin": "1", "stdout": "1"}, {"stdin": "2", "stdout": "1 2
1 2"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  85,
  E'Indented Star Triangle',
  E'Print a right-aligned triangle of stars.

For row i (1..n): print exactly (n-i) leading spaces, then i asterisks.

Character set: space '' '' and ''*'' only.

Spacing: Leading spaces matter and must match the samples. Do not print trailing spaces after the last star.

Input: one integer n.

Examples (literal output; · shown here only in this comment as space — real output uses spaces):

n = 3
  *
 **
***

n = 5
    *
   **
  ***
 ****
*****',
  E'EASY',
  E'[{"input": "3", "output": "  *
 **
***"}, {"input": "5", "output": "    *
   **
  ***
 ****
*****"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Leading spaces required", "No trailing spaces after the last star"]'::jsonb,
  E'[{"stdin": "3", "stdout": "  *
 **
***"}, {"stdin": "5", "stdout": "    *
   **
  ***
 ****
*****"}, {"stdin": "1", "stdout": "*"}, {"stdin": "2", "stdout": " *
**"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO problems (id, title, description, difficulty, examples, constraints_data, test_cases, created_at, topics)
VALUES (
  86,
  E'Counting Triangle',
  E'Print a number triangle where row i depends on i: on row i print 1 2 … i separated by single spaces.

Character set: decimal digits and single spaces between numbers.

Spacing: No trailing space after the last number on each line.

Input: one integer n.

Examples (literal output):

n = 3
1
1 2
1 2 3

n = 5
1
1 2
1 2 3
1 2 3 4
1 2 3 4 5',
  E'EASY',
  E'[{"input": "3", "output": "1
1 2
1 2 3"}, {"input": "5", "output": "1
1 2
1 2 3
1 2 3 4
1 2 3 4 5"}]'::jsonb,
  E'["1 ≤ n ≤ 20", "Row i prints 1..i", "No trailing space after the last number"]'::jsonb,
  E'[{"stdin": "3", "stdout": "1
1 2
1 2 3"}, {"stdin": "5", "stdout": "1
1 2
1 2 3
1 2 3 4
1 2 3 4 5"}, {"stdin": "1", "stdout": "1"}, {"stdin": "4", "stdout": "1
1 2
1 2 3
1 2 3 4"}]'::jsonb,
  TIMESTAMP '2026-07-28 09:11:30.365842',
  E'["Pattern Basics"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('problems', 'id'), (SELECT MAX(id) FROM problems));
COMMIT;

SELECT id, title FROM problems WHERE id > 31 ORDER BY id;
