-- ============================================================
-- Getting Used to Operators — 34 problems (rich module rebuild)
-- Topic MUST be exactly ["Getting Used to Operators"]
-- Run ONE BATCH AT A TIME in pgAdmin.
-- Paste each RETURNING id, title back into chat.
-- DO NOT run from the agent.
-- ============================================================
-- Wiring map after IDs return:
-- Batch1 (5) -> arithmetic-operators linkedProblemIds
-- Batch2 (4) -> assignment-operators
-- Batch3 (4) -> comparison-operators
-- Batch4 (3) -> logical-operators
-- Batch5 (3) -> bitwise-operators
-- Batch6 (3) -> increment-decrement
-- Batch7 (3) -> ternary-operator
-- Batch8 (3) -> operator-precedence-and-associativity
-- Batch9 (6) -> mixed-operator-problems
-- ============================================================

-- ============================================================
-- BATCH 1: Arithmetic (5 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Add Two Numbers',
  E'Read two integers a and b.
Print their sum a + b on one line.

Examples (literal output):

Input:
3
5
Output:
8

Input:
-2
7
Output:
5',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
5', 'output', E'8'),
    jsonb_build_object('input', E'-2
7', 'output', E'5')
  ),
  jsonb_build_array(E'-1000 ≤ a, b ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
5', 'stdout', E'8'),
    jsonb_build_object('stdin', E'-2
7', 'stdout', E'5'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'100
-50', 'stdout', E'50')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Area of Rectangle',
  E'Read two positive integers length and width.
Print length * width (area).

Examples:

Input:
4
3
Output:
12',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'4
3', 'output', E'12'),
    jsonb_build_object('input', E'10
5', 'output', E'50')
  ),
  jsonb_build_array(E'1 ≤ length, width ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'4
3', 'stdout', E'12'),
    jsonb_build_object('stdin', E'10
5', 'stdout', E'50'),
    jsonb_build_object('stdin', E'1
1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'7
8', 'stdout', E'56')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Celsius to Fahrenheit',
  E'Read an integer C (Celsius).
Print Fahrenheit as integer: F = C * 9 / 5 + 32 using integer arithmetic (same as C++/Java int ops / Python // for the division part: compute (C * 9) // 5 + 32).

Examples:

Input:
0
Output:
32

Input:
100
Output:
212',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'0', 'output', E'32'),
    jsonb_build_object('input', E'100', 'output', E'212')
  ),
  jsonb_build_array(E'-100 ≤ C ≤ 100'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'32'),
    jsonb_build_object('stdin', E'100', 'stdout', E'212'),
    jsonb_build_object('stdin', E'25', 'stdout', E'77'),
    jsonb_build_object('stdin', E'-40', 'stdout', E'-40')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Average of Three Numbers',
  E'Read three integers a, b, c.
Print their integer average: (a + b + c) // 3 (floor toward zero for non-negative; use integer division as in C++/Java ints).

For these tests all values are non-negative.

Examples:

Input:
3
6
9
Output:
6',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
6
9', 'output', E'6'),
    jsonb_build_object('input', E'1
2
3', 'output', E'2')
  ),
  jsonb_build_array(E'0 ≤ a, b, c ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
6
9', 'stdout', E'6'),
    jsonb_build_object('stdin', E'1
2
3', 'stdout', E'2'),
    jsonb_build_object('stdin', E'10
10
10', 'stdout', E'10'),
    jsonb_build_object('stdin', E'0
0
2', 'stdout', E'0')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Simple Calculator',
  E'Read two integers a and b, then a character op which is one of + - * /.
Print the integer result of a op b.
For / use integer division. b is never 0 when op is /.

Examples:

Input:
8
2
/
Output:
4

Input:
5
3
+
Output:
8',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'8
2
/', 'output', E'4'),
    jsonb_build_object('input', E'5
3
+', 'output', E'8')
  ),
  jsonb_build_array(E'-1000 ≤ a, b ≤ 1000', E'op is one of + - * /', E'if op is / then b ≠ 0'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'8
2
/', 'stdout', E'4'),
    jsonb_build_object('stdin', E'5
3
+', 'stdout', E'8'),
    jsonb_build_object('stdin', E'5
3
-', 'stdout', E'2'),
    jsonb_build_object('stdin', E'5
3
*', 'stdout', E'15'),
    jsonb_build_object('stdin', E'7
2
/', 'stdout', E'3')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 2: Assignment (4 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Balance Deposit',
  E'Read integers balance and deposit.
Set balance = balance + deposit (or +=).
Print the new balance.

Examples:
Input:
100
25
Output:
125',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'100
25', 'output', E'125'),
    jsonb_build_object('input', E'0
10', 'output', E'10')
  ),
  jsonb_build_array(E'-1000 ≤ balance, deposit ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'100
25', 'stdout', E'125'),
    jsonb_build_object('stdin', E'0
10', 'stdout', E'10'),
    jsonb_build_object('stdin', E'50
-20', 'stdout', E'30')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Compound Chain',
  E'Read x. Apply: x += 2; x *= 3; x -= 1. Print x.

Examples:
Input:
4
Output:
17',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'4', 'output', E'17', 'explanation', E'4→6→18→17'),
    jsonb_build_object('input', E'1', 'output', E'8')
  ),
  jsonb_build_array(E'-100 ≤ x ≤ 100'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'4', 'stdout', E'17'),
    jsonb_build_object('stdin', E'1', 'stdout', E'8'),
    jsonb_build_object('stdin', E'0', 'stdout', E'5'),
    jsonb_build_object('stdin', E'2', 'stdout', E'11')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Scale Then Shrink',
  E'Read x and k (k ≠ 0).
Do x *= k then x /= k using integer division (x = x / k).
Print final x.
Note: integer multiply then divide may not restore x when overflow is ignored — for these tests values stay small.

Actually for int math: after x*=k then x/=k you get back x if no overflow.
Print the final value.

Examples:
Input:
10
3
Output:
10',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'10
3', 'output', E'10'),
    jsonb_build_object('input', E'7
2', 'output', E'7')
  ),
  jsonb_build_array(E'-100 ≤ x ≤ 100', E'1 ≤ |k| ≤ 10'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'10
3', 'stdout', E'10'),
    jsonb_build_object('stdin', E'7
2', 'stdout', E'7'),
    jsonb_build_object('stdin', E'5
1', 'stdout', E'5')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Assign vs Compare Trap',
  E'Read a and b.
Print EQUAL if a == b else DIFF.
Do not assign inside the comparison.

Examples:
Input:
5
5
Output:
EQUAL

Input:
5
6
Output:
DIFF',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5
5', 'output', E'EQUAL'),
    jsonb_build_object('input', E'5
6', 'output', E'DIFF')
  ),
  jsonb_build_array(E'-1000 ≤ a, b ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'5
5', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'5
6', 'stdout', E'DIFF'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'EQUAL')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 3: Comparison (4 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Largest of Two Numbers',
  E'Read a and b. Print the larger (either if equal).

Examples:
Input:
3
8
Output:
8',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
8', 'output', E'8'),
    jsonb_build_object('input', E'5
5', 'output', E'5')
  ),
  jsonb_build_array(E'-1000 ≤ a, b ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
8', 'stdout', E'8'),
    jsonb_build_object('stdin', E'5
5', 'stdout', E'5'),
    jsonb_build_object('stdin', E'-2
-9', 'stdout', E'-2')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Eligible to Vote',
  E'Read age. Print YES if age >= 18 else NO.

Examples:
Input:
18
Output:
YES

Input:
17
Output:
NO',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'18', 'output', E'YES'),
    jsonb_build_object('input', E'17', 'output', E'NO')
  ),
  jsonb_build_array(E'0 ≤ age ≤ 120'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'18', 'stdout', E'YES'),
    jsonb_build_object('stdin', E'17', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'21', 'stdout', E'YES'),
    jsonb_build_object('stdin', E'0', 'stdout', E'NO')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Compare Ages',
  E'Read ageA and ageB.
Print OLDER if ageA > ageB, YOUNGER if ageA < ageB, SAME if equal.

Examples:
Input:
30
25
Output:
OLDER',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'30
25', 'output', E'OLDER'),
    jsonb_build_object('input', E'20
20', 'output', E'SAME'),
    jsonb_build_object('input', E'10
12', 'output', E'YOUNGER')
  ),
  jsonb_build_array(E'0 ≤ ages ≤ 120'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'30
25', 'stdout', E'OLDER'),
    jsonb_build_object('stdin', E'20
20', 'stdout', E'SAME'),
    jsonb_build_object('stdin', E'10
12', 'stdout', E'YOUNGER')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Compare Marks',
  E'Read marks and passMark.
Print PASS if marks >= passMark else FAIL.

Examples:
Input:
75
40
Output:
PASS',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'75
40', 'output', E'PASS'),
    jsonb_build_object('input', E'39
40', 'output', E'FAIL')
  ),
  jsonb_build_array(E'0 ≤ marks, passMark ≤ 100'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'75
40', 'stdout', E'PASS'),
    jsonb_build_object('stdin', E'39
40', 'stdout', E'FAIL'),
    jsonb_build_object('stdin', E'40
40', 'stdout', E'PASS')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 4: Logical (3 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Login Validation',
  E'Read two integers userOk and passOk (each 0 or 1).
Print ACCESS if userOk==1 AND passOk==1 else DENY.

Examples:
Input:
1
1
Output:
ACCESS

Input:
1
0
Output:
DENY',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'1
1', 'output', E'ACCESS'),
    jsonb_build_object('input', E'1
0', 'output', E'DENY')
  ),
  jsonb_build_array(E'userOk, passOk ∈ {0,1}'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1
1', 'stdout', E'ACCESS'),
    jsonb_build_object('stdin', E'1
0', 'stdout', E'DENY'),
    jsonb_build_object('stdin', E'0
1', 'stdout', E'DENY'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'DENY')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'ATM Withdrawal',
  E'Read balance and amount.
Print OK if amount > 0 AND amount <= balance else NO.

Examples:
Input:
100
40
Output:
OK

Input:
100
0
Output:
NO',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'100
40', 'output', E'OK'),
    jsonb_build_object('input', E'100
0', 'output', E'NO'),
    jsonb_build_object('input', E'50
60', 'output', E'NO')
  ),
  jsonb_build_array(E'0 ≤ balance ≤ 100000', E'0 ≤ amount ≤ 100000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'100
40', 'stdout', E'OK'),
    jsonb_build_object('stdin', E'100
0', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'50
60', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'50
50', 'stdout', E'OK')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Scholarship Eligibility',
  E'Read marks and income.
Print YES if marks >= 80 AND income <= 200000 else NO.

Examples:
Input:
85
150000
Output:
YES',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'85
150000', 'output', E'YES'),
    jsonb_build_object('input', E'85
250000', 'output', E'NO'),
    jsonb_build_object('input', E'70
100000', 'output', E'NO')
  ),
  jsonb_build_array(E'0 ≤ marks ≤ 100', E'0 ≤ income ≤ 1000000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'85
150000', 'stdout', E'YES'),
    jsonb_build_object('stdin', E'85
250000', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'70
100000', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'80
200000', 'stdout', E'YES')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 5: Bitwise (3 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Check Even/Odd',
  E'Read non-negative n.
Print EVEN if (n & 1) == 0 else ODD.

Examples:
Input:
4
Output:
EVEN

Input:
7
Output:
ODD',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'4', 'output', E'EVEN'),
    jsonb_build_object('input', E'7', 'output', E'ODD')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'4', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'7', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'0', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'1', 'stdout', E'ODD')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Toggle Bit',
  E'Read n and k (0-based bit index from the right).
Print n XOR (1 << k) — toggles bit k.

Examples:
Input:
8
1
Output:
10

Explanation: 8 is 1000, toggle bit1 → 1010 = 10.',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'8
1', 'output', E'10'),
    jsonb_build_object('input', E'5
0', 'output', E'4')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 1000', E'0 ≤ k ≤ 10'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'8
1', 'stdout', E'10'),
    jsonb_build_object('stdin', E'5
0', 'stdout', E'4'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'1'),
    jsonb_build_object('stdin', E'1
0', 'stdout', E'0')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Count Set Bits',
  E'Read non-negative n.
Print how many 1-bits are in its binary form (Brian Kernighan or loop).

Examples:
Input:
7
Output:
3

Input:
8
Output:
1',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'7', 'output', E'3'),
    jsonb_build_object('input', E'8', 'output', E'1')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'7', 'stdout', E'3'),
    jsonb_build_object('stdin', E'8', 'stdout', E'1'),
    jsonb_build_object('stdin', E'0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'15', 'stdout', E'4')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 6: Increment (3 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Predict Output',
  E'Read n.
Simulate: a = n; n = n + 1; print a then n on two lines.
(This is post-increment style.)

Examples:
Input:
5
Output:
5
6',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'5
6'),
    jsonb_build_object('input', E'0', 'output', E'0
1')
  ),
  jsonb_build_array(E'-100 ≤ n ≤ 100'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'5', 'stdout', E'5
6'),
    jsonb_build_object('stdin', E'0', 'stdout', E'0
1'),
    jsonb_build_object('stdin', E'-1', 'stdout', E'-1
0')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Loop Counter',
  E'Read n.
Print integers from 1 to n inclusive, space-separated on one line.
(Uses a counter that increments.)

Examples:
Input:
3
Output:
1 2 3',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3', 'output', E'1 2 3'),
    jsonb_build_object('input', E'1', 'output', E'1')
  ),
  jsonb_build_array(E'1 ≤ n ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3', 'stdout', E'1 2 3'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1 2 3 4 5')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Bump Trace',
  E'Read n.
pre = n+1; n = pre;
post_old = n; n = n+1;
Print three lines: pre, post_old, n.

Examples:
Input:
5
Output:
6
6
7',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'6
6
7'),
    jsonb_build_object('input', E'0', 'output', E'1
1
2')
  ),
  jsonb_build_array(E'-50 ≤ n ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'5', 'stdout', E'6
6
7'),
    jsonb_build_object('stdin', E'0', 'stdout', E'1
1
2'),
    jsonb_build_object('stdin', E'1', 'stdout', E'2
2
3')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 7: Ternary (3 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Maximum of Two Numbers',
  E'Read a and b. Print the max using a conditional expression if you like.

Examples:
Input:
3
8
Output:
8',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
8', 'output', E'8'),
    jsonb_build_object('input', E'5
5', 'output', E'5')
  ),
  jsonb_build_array(E'-1000 ≤ a, b ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
8', 'stdout', E'8'),
    jsonb_build_object('stdin', E'5
5', 'stdout', E'5'),
    jsonb_build_object('stdin', E'-2
-9', 'stdout', E'-2')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Even/Odd',
  E'Read n. Print EVEN if n%2==0 else ODD (ternary OK).

Examples:
Input:
4
Output:
EVEN',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'4', 'output', E'EVEN'),
    jsonb_build_object('input', E'7', 'output', E'ODD')
  ),
  jsonb_build_array(E'-1000 ≤ n ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'4', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'7', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'0', 'stdout', E'EVEN')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Grade Checker',
  E'Read marks (0-100).
Print PASS if marks >= 40 else FAIL (conditional expression OK).

Examples:
Input:
55
Output:
PASS',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'55', 'output', E'PASS'),
    jsonb_build_object('input', E'39', 'output', E'FAIL')
  ),
  jsonb_build_array(E'0 ≤ marks ≤ 100'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'55', 'stdout', E'PASS'),
    jsonb_build_object('stdin', E'39', 'stdout', E'FAIL'),
    jsonb_build_object('stdin', E'40', 'stdout', E'PASS')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 8: Precedence (3 EASY)
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Eval Without Parens',
  E'Read a b c. Print a + b * c (one line).

Examples:
Input:
2
3
4
Output:
14',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'2
3
4', 'output', E'14'),
    jsonb_build_object('input', E'1
1
1', 'output', E'2')
  ),
  jsonb_build_array(E'-50 ≤ a,b,c ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'2
3
4', 'stdout', E'14'),
    jsonb_build_object('stdin', E'1
1
1', 'stdout', E'2'),
    jsonb_build_object('stdin', E'5
0
10', 'stdout', E'5')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Force With Parens',
  E'Read a b c. Print (a + b) * c.

Examples:
Input:
2
3
4
Output:
20',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'2
3
4', 'output', E'20'),
    jsonb_build_object('input', E'1
1
1', 'output', E'2')
  ),
  jsonb_build_array(E'-50 ≤ a,b,c ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'2
3
4', 'stdout', E'20'),
    jsonb_build_object('stdin', E'1
1
1', 'stdout', E'2'),
    jsonb_build_object('stdin', E'5
0
10', 'stdout', E'50')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Associativity Trace',
  E'Read a b c.
Print two lines:
1) (a - b) - c
2) a - (b - c)

Examples:
Input:
10
3
2
Output:
5
9',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'10
3
2', 'output', E'5
9'),
    jsonb_build_object('input', E'5
1
1', 'output', E'3
5')
  ),
  jsonb_build_array(E'-50 ≤ a,b,c ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'10
3
2', 'stdout', E'5
9'),
    jsonb_build_object('stdin', E'5
1
1', 'stdout', E'3
5'),
    jsonb_build_object('stdin', E'0
0
0', 'stdout', E'0
0')
  )
)
RETURNING id, title;


-- ============================================================
-- BATCH 9: Mixed (2 EASY, 2 EASY-MEDIUM as MEDIUM label? plan says EASY-MED — use MEDIUM for step-up or EASY)
-- Plan: 2 Easy, 2 Easy-Med, 2 Medium. DB difficulty field: use EASY for first 2, MEDIUM for last 4 (no EASY-MEDIUM enum typically).
-- ============================================================
INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Even Split or Fail',
  E'Read total and parts (parts ≠ 0).
Print two lines: integer quotient total/parts, then PASS if remainder==0 else FAIL.

Examples:
Input:
10
5
Output:
2
PASS',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'10
5', 'output', E'2
PASS'),
    jsonb_build_object('input', E'10
3', 'output', E'3
FAIL')
  ),
  jsonb_build_array(E'-1000 ≤ total ≤ 1000', E'1 ≤ |parts| ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'10
5', 'stdout', E'2
PASS'),
    jsonb_build_object('stdin', E'10
3', 'stdout', E'3
FAIL'),
    jsonb_build_object('stdin', E'7
7', 'stdout', E'1
PASS')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Budget After Updates',
  E'Read budget and limit.
budget += 5; budget *= 2; budget -= 3;
Print OK if budget <= limit else OVER.

Examples:
Input:
10
27
Output:
OK',
  E'EASY',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'10
27', 'output', E'OK'),
    jsonb_build_object('input', E'10
26', 'output', E'OVER')
  ),
  jsonb_build_array(E'-100 ≤ budget ≤ 100', E'-1000 ≤ limit ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'10
27', 'stdout', E'OK'),
    jsonb_build_object('stdin', E'10
26', 'stdout', E'OVER'),
    jsonb_build_object('stdin', E'0
7', 'stdout', E'OK')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Ordered Triple Check',
  E'Read a b c. Print YES if a < b AND b < c else NO.

Examples:
Input:
1
2
3
Output:
YES',
  E'EASY-MEDIUM',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'1
2
3', 'output', E'YES'),
    jsonb_build_object('input', E'1
1
2', 'output', E'NO')
  ),
  jsonb_build_array(E'-1000 ≤ a,b,c ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1
2
3', 'stdout', E'YES'),
    jsonb_build_object('stdin', E'1
1
2', 'stdout', E'NO'),
    jsonb_build_object('stdin', E'3
2
1', 'stdout', E'NO')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Safe Divide Gate',
  E'Read dens and num.
If dens==0 print SAFE-SKIP.
Else if num%dens==0 print quotient.
Else print NOT-EVEN.

Examples:
Input:
0
10
Output:
SAFE-SKIP',
  E'EASY-MEDIUM',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'0
10', 'output', E'SAFE-SKIP'),
    jsonb_build_object('input', E'5
15', 'output', E'3'),
    jsonb_build_object('input', E'4
10', 'output', E'NOT-EVEN')
  ),
  jsonb_build_array(E'-1000 ≤ dens,num ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0
10', 'stdout', E'SAFE-SKIP'),
    jsonb_build_object('stdin', E'5
15', 'stdout', E'3'),
    jsonb_build_object('stdin', E'4
10', 'stdout', E'NOT-EVEN'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'SAFE-SKIP')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Mask Then Pick',
  E'Read flags and mask.
bits = flags & mask.
Print ON/OFF if bits!=0, then bits on second line.

Examples:
Input:
5
1
Output:
ON
1',
  E'MEDIUM',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5
1', 'output', E'ON
1'),
    jsonb_build_object('input', E'4
1', 'output', E'OFF
0')
  ),
  jsonb_build_array(E'0 ≤ flags,mask ≤ 1000'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'5
1', 'stdout', E'ON
1'),
    jsonb_build_object('stdin', E'4
1', 'stdout', E'OFF
0'),
    jsonb_build_object('stdin', E'15
8', 'stdout', E'ON
8')
  )
)
RETURNING id, title;

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Star or Paren Race',
  E'Read a b c target.
left = a+b*c; right=(a+b)*c;
Print left, right, then MATCH if left==target else NEAR if |left-target|<=|right-target| else FAR.

Examples:
Input:
2
3
4
14
Output:
14
20
MATCH',
  E'MEDIUM',
  '["Getting Used to Operators"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'2
3
4
14', 'output', E'14
20
MATCH'),
    jsonb_build_object('input', E'2
3
4
20', 'output', E'14
20
FAR'),
    jsonb_build_object('input', E'2
3
4
15', 'output', E'14
20
NEAR')
  ),
  jsonb_build_array(E'-50 ≤ a,b,c,target ≤ 50'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'2
3
4
14', 'stdout', E'14
20
MATCH'),
    jsonb_build_object('stdin', E'2
3
4
20', 'stdout', E'14
20
FAR'),
    jsonb_build_object('stdin', E'2
3
4
15', 'stdout', E'14
20
NEAR')
  )
)
RETURNING id, title;
