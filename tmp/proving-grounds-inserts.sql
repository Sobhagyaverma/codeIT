-- ============================================================
-- The Proving Grounds — 20 problems
-- Topic MUST be exactly ["The Proving Grounds"]
-- Descriptions intentionally omit Input/Output examples (those live in examples jsonb).
-- 10-20 deterministic test cases each (exactly one stdout per stdin).
-- Run ONE BATCH AT A TIME in pgAdmin.
-- Paste RETURNING id, title (or SELECT by topic) back into chat.
-- DO NOT run from the agent.
-- ============================================================


-- ################################################################
-- BATCH 1 — problems 1-10
-- ################################################################

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Sum and Percentage of Marks',
  E'Read five integers (subject marks), one per line.
Print exactly two lines:
SUM <total>
PERCENTAGE <integer>
where PERCENTAGE is floor((total * 100) / 500) using integer arithmetic toward zero for non-negative totals.',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'80
70
90
60
50', 'output', E'SUM 350
PERCENTAGE 70'),
    jsonb_build_object('input', E'100
100
100
100
100', 'output', E'SUM 500
PERCENTAGE 100')
  ),
  jsonb_build_array(E'0 ≤ each mark ≤ 100', E'Exactly five marks', E'PERCENTAGE = (sum * 100) // 500', E'Labels exactly SUM and PERCENTAGE'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'80
70
90
60
50', 'stdout', E'SUM 350
PERCENTAGE 70'),
    jsonb_build_object('stdin', E'100
100
100
100
100', 'stdout', E'SUM 500
PERCENTAGE 100'),
    jsonb_build_object('stdin', E'0
0
0
0
0', 'stdout', E'SUM 0
PERCENTAGE 0'),
    jsonb_build_object('stdin', E'100
0
0
0
0', 'stdout', E'SUM 100
PERCENTAGE 20'),
    jsonb_build_object('stdin', E'99
99
99
99
99', 'stdout', E'SUM 495
PERCENTAGE 99'),
    jsonb_build_object('stdin', E'1
1
1
1
1', 'stdout', E'SUM 5
PERCENTAGE 1'),
    jsonb_build_object('stdin', E'50
50
50
50
50', 'stdout', E'SUM 250
PERCENTAGE 50'),
    jsonb_build_object('stdin', E'75
75
75
75
75', 'stdout', E'SUM 375
PERCENTAGE 75'),
    jsonb_build_object('stdin', E'20
40
60
80
100', 'stdout', E'SUM 300
PERCENTAGE 60'),
    jsonb_build_object('stdin', E'10
20
30
40
51', 'stdout', E'SUM 151
PERCENTAGE 30'),
    jsonb_build_object('stdin', E'100
100
100
100
0', 'stdout', E'SUM 400
PERCENTAGE 80'),
    jsonb_build_object('stdin', E'33
33
34
33
33', 'stdout', E'SUM 166
PERCENTAGE 33')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Simple and Compound Interest',
  E'Read three integers P (principal), R (rate percent), T (time in years), one per line.

SI = (P * R * T) // 100
Start amount = P; for each of T years: amount = amount + (amount * R) // 100
CI = amount - P

Print exactly two lines:
SI <si>
CI <ci>',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'1000
10
2', 'output', E'SI 200
CI 210'),
    jsonb_build_object('input', E'100
10
1', 'output', E'SI 10
CI 10')
  ),
  jsonb_build_array(E'1 ≤ P ≤ 100000', E'1 ≤ R ≤ 100', E'1 ≤ T ≤ 10', E'Integer floor formulas as specified', E'Labels exactly SI and CI'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1000
10
2', 'stdout', E'SI 200
CI 210'),
    jsonb_build_object('stdin', E'100
10
1', 'stdout', E'SI 10
CI 10'),
    jsonb_build_object('stdin', E'500
5
3', 'stdout', E'SI 75
CI 78'),
    jsonb_build_object('stdin', E'1
1
1', 'stdout', E'SI 0
CI 0'),
    jsonb_build_object('stdin', E'10000
1
1', 'stdout', E'SI 100
CI 100'),
    jsonb_build_object('stdin', E'2000
10
3', 'stdout', E'SI 600
CI 662'),
    jsonb_build_object('stdin', E'100
100
1', 'stdout', E'SI 100
CI 100'),
    jsonb_build_object('stdin', E'1000
10
5', 'stdout', E'SI 500
CI 610'),
    jsonb_build_object('stdin', E'2500
4
2', 'stdout', E'SI 200
CI 204'),
    jsonb_build_object('stdin', E'999
7
2', 'stdout', E'SI 139
CI 143'),
    jsonb_build_object('stdin', E'50
10
2', 'stdout', E'SI 10
CI 10'),
    jsonb_build_object('stdin', E'1000
5
4', 'stdout', E'SI 200
CI 214')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Area and Circumference of a Circle',
  E'Read one integer radius r.
Use pi as 22/7 with integer arithmetic:
AREA = (22 * r * r) // 7
CIRCUMFERENCE = (44 * r) // 7
Print exactly two lines:
AREA <area>
CIRCUMFERENCE <circ>',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'7', 'output', E'AREA 154
CIRCUMFERENCE 44'),
    jsonb_build_object('input', E'1', 'output', E'AREA 3
CIRCUMFERENCE 6')
  ),
  jsonb_build_array(E'1 ≤ r ≤ 1000', E'pi modeled as 22/7 with integer floor', E'Labels exactly AREA and CIRCUMFERENCE'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'7', 'stdout', E'AREA 154
CIRCUMFERENCE 44'),
    jsonb_build_object('stdin', E'1', 'stdout', E'AREA 3
CIRCUMFERENCE 6'),
    jsonb_build_object('stdin', E'2', 'stdout', E'AREA 12
CIRCUMFERENCE 12'),
    jsonb_build_object('stdin', E'14', 'stdout', E'AREA 616
CIRCUMFERENCE 88'),
    jsonb_build_object('stdin', E'3', 'stdout', E'AREA 28
CIRCUMFERENCE 18'),
    jsonb_build_object('stdin', E'10', 'stdout', E'AREA 314
CIRCUMFERENCE 62'),
    jsonb_build_object('stdin', E'21', 'stdout', E'AREA 1386
CIRCUMFERENCE 132'),
    jsonb_build_object('stdin', E'5', 'stdout', E'AREA 78
CIRCUMFERENCE 31'),
    jsonb_build_object('stdin', E'100', 'stdout', E'AREA 31428
CIRCUMFERENCE 628'),
    jsonb_build_object('stdin', E'8', 'stdout', E'AREA 201
CIRCUMFERENCE 50'),
    jsonb_build_object('stdin', E'9', 'stdout', E'AREA 254
CIRCUMFERENCE 56'),
    jsonb_build_object('stdin', E'15', 'stdout', E'AREA 707
CIRCUMFERENCE 94')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Celsius to Fahrenheit',
  E'Read one integer C (Celsius).
Print one integer F = (C * 9) / 5 + 32 using language integer division that truncates toward zero (C++/Java int division; in Python use int(C*9/5)+32 or equivalent toward-zero division).',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'0', 'output', E'32'),
    jsonb_build_object('input', E'100', 'output', E'212')
  ),
  jsonb_build_array(E'-100 ≤ C ≤ 100', E'Single integer output', E'Toward-zero integer division for (C*9)/5'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'32'),
    jsonb_build_object('stdin', E'100', 'stdout', E'212'),
    jsonb_build_object('stdin', E'25', 'stdout', E'77'),
    jsonb_build_object('stdin', E'-40', 'stdout', E'-40'),
    jsonb_build_object('stdin', E'37', 'stdout', E'98'),
    jsonb_build_object('stdin', E'1', 'stdout', E'33'),
    jsonb_build_object('stdin', E'-1', 'stdout', E'31'),
    jsonb_build_object('stdin', E'50', 'stdout', E'122'),
    jsonb_build_object('stdin', E'-10', 'stdout', E'14'),
    jsonb_build_object('stdin', E'99', 'stdout', E'210'),
    jsonb_build_object('stdin', E'-100', 'stdout', E'-148'),
    jsonb_build_object('stdin', E'20', 'stdout', E'68')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Swap Two Numbers',
  E'Read two integers a and b (one per line).
Swap them using a third variable.
Print exactly two lines: new a then new b.',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
7', 'output', E'7
3'),
    jsonb_build_object('input', E'0
0', 'output', E'0
0')
  ),
  jsonb_build_array(E'-10000 ≤ a, b ≤ 10000', E'Two lines of output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
7', 'stdout', E'7
3'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'0
0'),
    jsonb_build_object('stdin', E'-1
5', 'stdout', E'5
-1'),
    jsonb_build_object('stdin', E'100
-100', 'stdout', E'-100
100'),
    jsonb_build_object('stdin', E'1
2', 'stdout', E'2
1'),
    jsonb_build_object('stdin', E'9
9', 'stdout', E'9
9'),
    jsonb_build_object('stdin', E'-5
-8', 'stdout', E'-8
-5'),
    jsonb_build_object('stdin', E'42
0', 'stdout', E'0
42'),
    jsonb_build_object('stdin', E'0
1', 'stdout', E'1
0'),
    jsonb_build_object('stdin', E'999
1', 'stdout', E'1
999'),
    jsonb_build_object('stdin', E'-999
999', 'stdout', E'999
-999'),
    jsonb_build_object('stdin', E'12
34', 'stdout', E'34
12')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Check Numbers Equal',
  E'Read two integers a and b.
Print EQUAL if a == b, otherwise NOT_EQUAL.',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5
5', 'output', E'EQUAL'),
    jsonb_build_object('input', E'5
6', 'output', E'NOT_EQUAL')
  ),
  jsonb_build_array(E'-10000 ≤ a, b ≤ 10000', E'Output exactly EQUAL or NOT_EQUAL'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'5
5', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'5
6', 'stdout', E'NOT_EQUAL'),
    jsonb_build_object('stdin', E'0
0', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'-1
-1', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'-1
1', 'stdout', E'NOT_EQUAL'),
    jsonb_build_object('stdin', E'100
100', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'7
8', 'stdout', E'NOT_EQUAL'),
    jsonb_build_object('stdin', E'0
1', 'stdout', E'NOT_EQUAL'),
    jsonb_build_object('stdin', E'9999
9999', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'-9999
0', 'stdout', E'NOT_EQUAL'),
    jsonb_build_object('stdin', E'42
42', 'stdout', E'EQUAL'),
    jsonb_build_object('stdin', E'10
-10', 'stdout', E'NOT_EQUAL')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Greatest of Three Numbers',
  E'Read three integers a, b, c.
Print the greatest value once (ties allowed).',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'3
7
5', 'output', E'7'),
    jsonb_build_object('input', E'9
9
1', 'output', E'9')
  ),
  jsonb_build_array(E'-10000 ≤ a, b, c ≤ 10000', E'Single integer output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'3
7
5', 'stdout', E'7'),
    jsonb_build_object('stdin', E'9
9
1', 'stdout', E'9'),
    jsonb_build_object('stdin', E'1
2
3', 'stdout', E'3'),
    jsonb_build_object('stdin', E'-5
-2
-9', 'stdout', E'-2'),
    jsonb_build_object('stdin', E'0
0
0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'10
10
10', 'stdout', E'10'),
    jsonb_build_object('stdin', E'5
1
5', 'stdout', E'5'),
    jsonb_build_object('stdin', E'-1
0
1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'100
99
98', 'stdout', E'100'),
    jsonb_build_object('stdin', E'7
7
7', 'stdout', E'7'),
    jsonb_build_object('stdin', E'-100
-100
-99', 'stdout', E'-99'),
    jsonb_build_object('stdin', E'2
8
8', 'stdout', E'8')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Even or Odd',
  E'Read one integer n.
Print EVEN if n % 2 == 0, otherwise ODD. Zero is EVEN.',
  E'EASY',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'4', 'output', E'EVEN'),
    jsonb_build_object('input', E'7', 'output', E'ODD')
  ),
  jsonb_build_array(E'-10000 ≤ n ≤ 10000', E'Output exactly EVEN or ODD'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'4', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'7', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'0', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'1', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'2', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'-2', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'-3', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'100', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'99', 'stdout', E'ODD'),
    jsonb_build_object('stdin', E'-100', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'1000', 'stdout', E'EVEN'),
    jsonb_build_object('stdin', E'15', 'stdout', E'ODD')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Leap Year Check',
  E'Read one integer year.
Print LEAP or NOT_LEAP using:
divisible by 400 → LEAP; else by 100 → NOT_LEAP; else by 4 → LEAP; else NOT_LEAP.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'2000', 'output', E'LEAP'),
    jsonb_build_object('input', E'1900', 'output', E'NOT_LEAP')
  ),
  jsonb_build_array(E'1 ≤ year ≤ 9999', E'Output exactly LEAP or NOT_LEAP'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'2000', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'1900', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'2024', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'2023', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'1600', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'1700', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'1800', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'2100', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'2400', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'2012', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'2016', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'2019', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'4', 'stdout', E'LEAP'),
    jsonb_build_object('stdin', E'100', 'stdout', E'NOT_LEAP'),
    jsonb_build_object('stdin', E'400', 'stdout', E'LEAP')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Grade Calculator',
  E'Read integer percentage p (0..100).
Print A if 90-100, B if 80-89, C if 60-79, D if 0-59.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'90', 'output', E'A'),
    jsonb_build_object('input', E'59', 'output', E'D')
  ),
  jsonb_build_array(E'0 ≤ p ≤ 100', E'Output exactly one of A B C D'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'90', 'stdout', E'A'),
    jsonb_build_object('stdin', E'89', 'stdout', E'B'),
    jsonb_build_object('stdin', E'80', 'stdout', E'B'),
    jsonb_build_object('stdin', E'79', 'stdout', E'C'),
    jsonb_build_object('stdin', E'60', 'stdout', E'C'),
    jsonb_build_object('stdin', E'59', 'stdout', E'D'),
    jsonb_build_object('stdin', E'100', 'stdout', E'A'),
    jsonb_build_object('stdin', E'0', 'stdout', E'D'),
    jsonb_build_object('stdin', E'95', 'stdout', E'A'),
    jsonb_build_object('stdin', E'85', 'stdout', E'B'),
    jsonb_build_object('stdin', E'70', 'stdout', E'C'),
    jsonb_build_object('stdin', E'50', 'stdout', E'D'),
    jsonb_build_object('stdin', E'99', 'stdout', E'A'),
    jsonb_build_object('stdin', E'1', 'stdout', E'D')
  )
)
RETURNING id, title;


-- ################################################################
-- BATCH 2 — problems 11-20
-- ################################################################

INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Calculator Using Switch',
  E'Read integer a, integer b, then a single character operator op on its own line.
op is one of + - * /.
Print the integer result.
For / use toward-zero integer division. When op is /, b is never 0.

Use a switch (or equivalent branching) on op.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'8
2
/', 'output', E'4'),
    jsonb_build_object('input', E'5
3
+', 'output', E'8')
  ),
  jsonb_build_array(E'-10000 ≤ a, b ≤ 10000', E'op ∈ {+,-,*,/}', E'if op is / then b ≠ 0', E'Single integer output'),
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
/', 'stdout', E'3'),
    jsonb_build_object('stdin', E'0
5
+', 'stdout', E'5'),
    jsonb_build_object('stdin', E'-10
3
*', 'stdout', E'-30'),
    jsonb_build_object('stdin', E'9
0
+', 'stdout', E'9'),
    jsonb_build_object('stdin', E'100
7
/', 'stdout', E'14'),
    jsonb_build_object('stdin', E'-9
2
/', 'stdout', E'-4'),
    jsonb_build_object('stdin', E'15
4
-', 'stdout', E'11'),
    jsonb_build_object('stdin', E'1
1
*', 'stdout', E'1')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Sum of N Numbers',
  E'Read integer N.
Print the sum of all integers from 1 to N inclusive.
If N = 0, print 0.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'15'),
    jsonb_build_object('input', E'1', 'output', E'1')
  ),
  jsonb_build_array(E'0 ≤ N ≤ 10000', E'Single integer output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'2', 'stdout', E'3'),
    jsonb_build_object('stdin', E'3', 'stdout', E'6'),
    jsonb_build_object('stdin', E'5', 'stdout', E'15'),
    jsonb_build_object('stdin', E'10', 'stdout', E'55'),
    jsonb_build_object('stdin', E'0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'100', 'stdout', E'5050'),
    jsonb_build_object('stdin', E'20', 'stdout', E'210'),
    jsonb_build_object('stdin', E'7', 'stdout', E'28'),
    jsonb_build_object('stdin', E'15', 'stdout', E'120'),
    jsonb_build_object('stdin', E'50', 'stdout', E'1275'),
    jsonb_build_object('stdin', E'99', 'stdout', E'4950')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Factorial of a Number',
  E'Read non-negative integer N.
Print N! (0! = 1).',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'120'),
    jsonb_build_object('input', E'0', 'output', E'1')
  ),
  jsonb_build_array(E'0 ≤ N ≤ 12', E'Single integer output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'1'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'2', 'stdout', E'2'),
    jsonb_build_object('stdin', E'3', 'stdout', E'6'),
    jsonb_build_object('stdin', E'4', 'stdout', E'24'),
    jsonb_build_object('stdin', E'5', 'stdout', E'120'),
    jsonb_build_object('stdin', E'6', 'stdout', E'720'),
    jsonb_build_object('stdin', E'7', 'stdout', E'5040'),
    jsonb_build_object('stdin', E'8', 'stdout', E'40320'),
    jsonb_build_object('stdin', E'9', 'stdout', E'362880'),
    jsonb_build_object('stdin', E'10', 'stdout', E'3628800'),
    jsonb_build_object('stdin', E'12', 'stdout', E'479001600')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Sum of Even and Odd Numbers',
  E'Read integer N.
From 1 to N inclusive, compute sum of even numbers and sum of odd numbers.
If N = 0, both sums are 0.
Print exactly two lines:
EVEN <even_sum>
ODD <odd_sum>',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'EVEN 6
ODD 9'),
    jsonb_build_object('input', E'1', 'output', E'EVEN 0
ODD 1')
  ),
  jsonb_build_array(E'0 ≤ N ≤ 10000', E'Labels exactly EVEN and ODD'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1', 'stdout', E'EVEN 0
ODD 1'),
    jsonb_build_object('stdin', E'2', 'stdout', E'EVEN 2
ODD 1'),
    jsonb_build_object('stdin', E'3', 'stdout', E'EVEN 2
ODD 4'),
    jsonb_build_object('stdin', E'4', 'stdout', E'EVEN 6
ODD 4'),
    jsonb_build_object('stdin', E'5', 'stdout', E'EVEN 6
ODD 9'),
    jsonb_build_object('stdin', E'10', 'stdout', E'EVEN 30
ODD 25'),
    jsonb_build_object('stdin', E'0', 'stdout', E'EVEN 0
ODD 0'),
    jsonb_build_object('stdin', E'20', 'stdout', E'EVEN 110
ODD 100'),
    jsonb_build_object('stdin', E'7', 'stdout', E'EVEN 12
ODD 16'),
    jsonb_build_object('stdin', E'15', 'stdout', E'EVEN 56
ODD 64'),
    jsonb_build_object('stdin', E'100', 'stdout', E'EVEN 2550
ODD 2500'),
    jsonb_build_object('stdin', E'50', 'stdout', E'EVEN 650
ODD 625')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Fibonacci Series',
  E'Read integer N (N ≥ 1).
Print the first N Fibonacci terms starting with 0 1 1 2 3 ...
Terms on one line, separated by single spaces. No trailing space.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'5', 'output', E'0 1 1 2 3'),
    jsonb_build_object('input', E'1', 'output', E'0')
  ),
  jsonb_build_array(E'1 ≤ N ≤ 40', E'Single line, space-separated', E'Starts with 0'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1', 'stdout', E'0'),
    jsonb_build_object('stdin', E'2', 'stdout', E'0 1'),
    jsonb_build_object('stdin', E'3', 'stdout', E'0 1 1'),
    jsonb_build_object('stdin', E'5', 'stdout', E'0 1 1 2 3'),
    jsonb_build_object('stdin', E'7', 'stdout', E'0 1 1 2 3 5 8'),
    jsonb_build_object('stdin', E'10', 'stdout', E'0 1 1 2 3 5 8 13 21 34'),
    jsonb_build_object('stdin', E'4', 'stdout', E'0 1 1 2'),
    jsonb_build_object('stdin', E'6', 'stdout', E'0 1 1 2 3 5'),
    jsonb_build_object('stdin', E'8', 'stdout', E'0 1 1 2 3 5 8 13'),
    jsonb_build_object('stdin', E'9', 'stdout', E'0 1 1 2 3 5 8 13 21'),
    jsonb_build_object('stdin', E'12', 'stdout', E'0 1 1 2 3 5 8 13 21 34 55 89'),
    jsonb_build_object('stdin', E'11', 'stdout', E'0 1 1 2 3 5 8 13 21 34 55'),
    jsonb_build_object('stdin', E'15', 'stdout', E'0 1 1 2 3 5 8 13 21 34 55 89 144 233 377'),
    jsonb_build_object('stdin', E'20', 'stdout', E'0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181'),
    jsonb_build_object('stdin', E'13', 'stdout', E'0 1 1 2 3 5 8 13 21 34 55 89 144')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Prime Number Check',
  E'Read integer n.
Print PRIME if n is prime, otherwise NOT_PRIME.
0 and 1 are NOT_PRIME. 2 is PRIME.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'2', 'output', E'PRIME'),
    jsonb_build_object('input', E'1', 'output', E'NOT_PRIME'),
    jsonb_build_object('input', E'9', 'output', E'NOT_PRIME')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 100000', E'Output exactly PRIME or NOT_PRIME'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'1', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'2', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'3', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'4', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'5', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'9', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'17', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'25', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'29', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'97', 'stdout', E'PRIME'),
    jsonb_build_object('stdin', E'100', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'15', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'49', 'stdout', E'NOT_PRIME'),
    jsonb_build_object('stdin', E'91', 'stdout', E'NOT_PRIME')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Sum of Digits',
  E'Read a non-negative integer n.
Print the sum of its decimal digits.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'123', 'output', E'6'),
    jsonb_build_object('input', E'100', 'output', E'1')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 1000000000', E'Single integer output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'9', 'stdout', E'9'),
    jsonb_build_object('stdin', E'10', 'stdout', E'1'),
    jsonb_build_object('stdin', E'99', 'stdout', E'18'),
    jsonb_build_object('stdin', E'100', 'stdout', E'1'),
    jsonb_build_object('stdin', E'123', 'stdout', E'6'),
    jsonb_build_object('stdin', E'1000', 'stdout', E'1'),
    jsonb_build_object('stdin', E'10000', 'stdout', E'1'),
    jsonb_build_object('stdin', E'99999', 'stdout', E'45'),
    jsonb_build_object('stdin', E'7', 'stdout', E'7'),
    jsonb_build_object('stdin', E'45', 'stdout', E'9'),
    jsonb_build_object('stdin', E'808', 'stdout', E'16')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Reverse a Number',
  E'Read a non-negative integer n.
Print its reverse as an integer (leading zeros in the reverse are dropped).
Example: 120 reverses to 21; 100 reverses to 1; 0 reverses to 0.',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'123', 'output', E'321'),
    jsonb_build_object('input', E'120', 'output', E'21')
  ),
  jsonb_build_array(E'0 ≤ n ≤ 1000000000', E'Single integer output'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'10', 'stdout', E'1'),
    jsonb_build_object('stdin', E'100', 'stdout', E'1'),
    jsonb_build_object('stdin', E'123', 'stdout', E'321'),
    jsonb_build_object('stdin', E'120', 'stdout', E'21'),
    jsonb_build_object('stdin', E'1001', 'stdout', E'1001'),
    jsonb_build_object('stdin', E'7', 'stdout', E'7'),
    jsonb_build_object('stdin', E'99', 'stdout', E'99'),
    jsonb_build_object('stdin', E'1000', 'stdout', E'1'),
    jsonb_build_object('stdin', E'4567', 'stdout', E'7654'),
    jsonb_build_object('stdin', E'900', 'stdout', E'9')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Armstrong Numbers',
  E'You do not need the input value for the answer (any single integer may be provided and must be ignored).
Print all Armstrong numbers from 1 to 1000 inclusive, separated by single spaces on one line, in ascending order. No trailing space.

An Armstrong number equals the sum of its own digits each raised to the power of the count of digits.
(Single-digit numbers 1..9 are Armstrong. 1000 is not.)',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'0', 'output', E'1 2 3 4 5 6 7 8 9 153 370 371 407')
  ),
  jsonb_build_array(E'Input is one ignored integer', E'1..1000 inclusive', E'Space-separated ascending', E'Exactly one correct line'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'0', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'1', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'2', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'3', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'4', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'5', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'6', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'7', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'8', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407'),
    jsonb_build_object('stdin', E'9', 'stdout', E'1 2 3 4 5 6 7 8 9 153 370 371 407')
  )
)
RETURNING id, title;


INSERT INTO problems (title, description, difficulty, topics, examples, constraints_data, test_cases)
VALUES (
  E'Binary–Decimal Conversion',
  E'Read an integer mode, then a second line of input.
If mode = 1: the second line is a binary string (digits 0/1 only, length 1..31). Print its decimal value.
If mode = 2: the second line is a non-negative decimal integer. Print its binary representation without leading zeros (except 0 itself is 0).',
  E'MEDIUM',
  '["The Proving Grounds"]'::jsonb,
  jsonb_build_array(
    jsonb_build_object('input', E'1
1010', 'output', E'10'),
    jsonb_build_object('input', E'2
10', 'output', E'1010'),
    jsonb_build_object('input', E'1
0001', 'output', E'1')
  ),
  jsonb_build_array(E'mode ∈ {1,2}', E'mode 1: binary length 1..31', E'mode 2: 0 ≤ n ≤ 2^31-1', E'Single line output', E'Exactly one encoding as specified'),
  jsonb_build_array(
    jsonb_build_object('stdin', E'1
0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'1
1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'1
10', 'stdout', E'2'),
    jsonb_build_object('stdin', E'1
11', 'stdout', E'3'),
    jsonb_build_object('stdin', E'1
100', 'stdout', E'4'),
    jsonb_build_object('stdin', E'1
1010', 'stdout', E'10'),
    jsonb_build_object('stdin', E'1
1111', 'stdout', E'15'),
    jsonb_build_object('stdin', E'1
0001', 'stdout', E'1'),
    jsonb_build_object('stdin', E'1
11111111', 'stdout', E'255'),
    jsonb_build_object('stdin', E'1
101', 'stdout', E'5'),
    jsonb_build_object('stdin', E'2
0', 'stdout', E'0'),
    jsonb_build_object('stdin', E'2
1', 'stdout', E'1'),
    jsonb_build_object('stdin', E'2
2', 'stdout', E'10'),
    jsonb_build_object('stdin', E'2
5', 'stdout', E'101'),
    jsonb_build_object('stdin', E'2
8', 'stdout', E'1000'),
    jsonb_build_object('stdin', E'2
15', 'stdout', E'1111'),
    jsonb_build_object('stdin', E'2
16', 'stdout', E'10000'),
    jsonb_build_object('stdin', E'2
255', 'stdout', E'11111111'),
    jsonb_build_object('stdin', E'2
100', 'stdout', E'1100100'),
    jsonb_build_object('stdin', E'2
42', 'stdout', E'101010')
  )
)
RETURNING id, title;

