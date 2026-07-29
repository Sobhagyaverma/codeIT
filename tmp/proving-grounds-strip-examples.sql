-- ============================================================
-- Strip duplicated Examples from Proving Grounds descriptions (ids 121-140).
-- Structured examples jsonb is unchanged — UI Examples section renders those.
-- Run in pgAdmin. DO NOT run from the agent.
-- ============================================================

UPDATE problems SET description = E'Read five integers (subject marks), one per line.
Print exactly two lines:
SUM <total>
PERCENTAGE <integer>
where PERCENTAGE is floor((total * 100) / 500) using integer arithmetic toward zero for non-negative totals.' WHERE id = 121 AND title = E'Sum and Percentage of Marks';
UPDATE problems SET description = E'Read three integers P (principal), R (rate percent), T (time in years), one per line.

SI = (P * R * T) // 100
Start amount = P; for each of T years: amount = amount + (amount * R) // 100
CI = amount - P

Print exactly two lines:
SI <si>
CI <ci>' WHERE id = 122 AND title = E'Simple and Compound Interest';
UPDATE problems SET description = E'Read one integer radius r.
Use pi as 22/7 with integer arithmetic:
AREA = (22 * r * r) // 7
CIRCUMFERENCE = (44 * r) // 7
Print exactly two lines:
AREA <area>
CIRCUMFERENCE <circ>' WHERE id = 123 AND title = E'Area and Circumference of a Circle';
UPDATE problems SET description = E'Read one integer C (Celsius).
Print one integer F = (C * 9) / 5 + 32 using language integer division that truncates toward zero (C++/Java int division; in Python use int(C*9/5)+32 or equivalent toward-zero division).' WHERE id = 124 AND title = E'Celsius to Fahrenheit';
UPDATE problems SET description = E'Read two integers a and b (one per line).
Swap them using a third variable.
Print exactly two lines: new a then new b.' WHERE id = 125 AND title = E'Swap Two Numbers';
UPDATE problems SET description = E'Read two integers a and b.
Print EQUAL if a == b, otherwise NOT_EQUAL.' WHERE id = 126 AND title = E'Check Numbers Equal';
UPDATE problems SET description = E'Read three integers a, b, c.
Print the greatest value once (ties allowed).' WHERE id = 127 AND title = E'Greatest of Three Numbers';
UPDATE problems SET description = E'Read one integer n.
Print EVEN if n % 2 == 0, otherwise ODD. Zero is EVEN.' WHERE id = 128 AND title = E'Even or Odd';
UPDATE problems SET description = E'Read one integer year.
Print LEAP or NOT_LEAP using:
divisible by 400 → LEAP; else by 100 → NOT_LEAP; else by 4 → LEAP; else NOT_LEAP.' WHERE id = 129 AND title = E'Leap Year Check';
UPDATE problems SET description = E'Read integer percentage p (0..100).
Print A if 90-100, B if 80-89, C if 60-79, D if 0-59.' WHERE id = 130 AND title = E'Grade Calculator';
UPDATE problems SET description = E'Read integer a, integer b, then a single character operator op on its own line.
op is one of + - * /.
Print the integer result.
For / use toward-zero integer division. When op is /, b is never 0.

Use a switch (or equivalent branching) on op.' WHERE id = 131 AND title = E'Calculator Using Switch';
UPDATE problems SET description = E'Read integer N.
Print the sum of all integers from 1 to N inclusive.
If N = 0, print 0.' WHERE id = 132 AND title = E'Sum of N Numbers';
UPDATE problems SET description = E'Read non-negative integer N.
Print N! (0! = 1).' WHERE id = 133 AND title = E'Factorial of a Number';
UPDATE problems SET description = E'Read integer N.
From 1 to N inclusive, compute sum of even numbers and sum of odd numbers.
If N = 0, both sums are 0.
Print exactly two lines:
EVEN <even_sum>
ODD <odd_sum>' WHERE id = 134 AND title = E'Sum of Even and Odd Numbers';
UPDATE problems SET description = E'Read integer N (N ≥ 1).
Print the first N Fibonacci terms starting with 0 1 1 2 3 ...
Terms on one line, separated by single spaces. No trailing space.' WHERE id = 135 AND title = E'Fibonacci Series';
UPDATE problems SET description = E'Read integer n.
Print PRIME if n is prime, otherwise NOT_PRIME.
0 and 1 are NOT_PRIME. 2 is PRIME.' WHERE id = 136 AND title = E'Prime Number Check';
UPDATE problems SET description = E'Read a non-negative integer n.
Print the sum of its decimal digits.' WHERE id = 137 AND title = E'Sum of Digits';
UPDATE problems SET description = E'Read a non-negative integer n.
Print its reverse as an integer (leading zeros in the reverse are dropped).
Example: 120 reverses to 21; 100 reverses to 1; 0 reverses to 0.' WHERE id = 138 AND title = E'Reverse a Number';
UPDATE problems SET description = E'You do not need the input value for the answer (any single integer may be provided and must be ignored).
Print all Armstrong numbers from 1 to 1000 inclusive, separated by single spaces on one line, in ascending order. No trailing space.

An Armstrong number equals the sum of its own digits each raised to the power of the count of digits.
(Single-digit numbers 1..9 are Armstrong. 1000 is not.)' WHERE id = 139 AND title = E'Armstrong Numbers';
UPDATE problems SET description = E'Read an integer mode, then a second line of input.
If mode = 1: the second line is a binary string (digits 0/1 only, length 1..31). Print its decimal value.
If mode = 2: the second line is a non-negative decimal integer. Print its binary representation without leading zeros (except 0 itself is 0).' WHERE id = 140 AND title = E'Binary–Decimal Conversion';

SELECT id, title, left(description, 80) AS description_preview FROM problems WHERE id BETWEEN 121 AND 140 ORDER BY id;