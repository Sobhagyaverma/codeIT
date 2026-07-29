-- ============================================================
-- Rewrite problem descriptions for ids 80-140 (teaching style).
-- Run in pgAdmin only. DO NOT run from the agent.
-- ============================================================

UPDATE problems SET description = E'Printing a line of stars is one of the gentlest ways to meet loops and character output. You are not building a fancy shape yet — you only need to repeat one character a fixed number of times so you can see how "do this n times" turns into real code.

Read a single integer n. Your program must print exactly n asterisk characters (''*'') on one line, then end that line. That is the whole contract: one integer in, one line of stars out.

Think of n as a counter for how many times to write ''*''. A loop that runs from 1 to n (or 0 to n-1) and prints one star each time works, and so does building a string of length n filled with ''*''. Either way you are saying the same thing: repeat this character n times, then stop.

Use only the ''*'' character — no spaces between stars, and no leading or trailing spaces on the line. A trailing newline after the stars is fine and expected so the judge sees one complete line.' WHERE id = 80 AND title = E'Star Line';
UPDATE problems SET description = E'Many later patterns and grids start with a simple idea: print a run of integers on one line with careful spacing. Getting the spaces right here will save you headaches when rows get longer.

Read one integer n. Print the integers from 1 through n inclusive on a single line, with exactly one space between neighboring numbers. Do not invent extra blanks or commas.

Walk a counter from 1 to n. Between values you need a single space; after the last value you do not. A reliable habit is to print the first number alone, then for each later number print a space and then the number — that way a trailing space never sneaks in.

Allowed characters on the line are decimal digits and the single spaces between numbers. No trailing space after the last number, and finish with a newline.' WHERE id = 81 AND title = E'Number Line';
UPDATE problems SET description = E'Nested structure shows up as soon as patterns have both rows and columns. Here the outer idea is "which row am I on?" and the inner idea is "how many stars belong on this row?" Each row is a little longer than the one above it, so the shape grows into a right triangle of stars.

Read one integer n. Print a right triangle of asterisks that grows horizontally: for row i where i runs from 1 to n, that row must contain exactly i asterisks and nothing else.

Use an outer loop for the row index i from 1 to n. For each i, print i stars with no gaps, then a newline. Row 1 is just ''*'', row 2 is ''**'', and so on until row n is a solid run of n stars. You can implement the inner part with another loop or with string repetition — both are valid.

Character set is only ''*''. There are no leading or trailing spaces on any line, and you must produce exactly n lines of output.' WHERE id = 82 AND title = E'Growing Star Rows';
UPDATE problems SET description = E'A solid square of stars is nested loops in their simplest form: n identical rows, each with n stars. Once you can write "n rows of n stars," you can vary length or content later with much less confusion.

Read one integer n. Print n identical rows stacked vertically. Each row is exactly n asterisks, forming an n×n solid block of stars.

The outer loop runs once per row (n times). Inside each row, print n asterisks — with an inner loop or a string of length n. Every row looks the same; only the vertical stack grows with n. That sameness is intentional: you are practicing repeating a full row, not changing it.

Use only ''*'', with no spaces anywhere on a line. Each row’s length is exactly n, and the output has exactly n lines.' WHERE id = 83 AND title = E'Stacked Star Rows';
UPDATE problems SET description = E'When people say "nested loops," they usually mean an outer loop for the row and an inner loop for the column. This problem keeps every row identical so you can focus on that row/column mental model without row-dependent values getting in the way.

Read one integer n. Using nested loops (outer = row, inner = column), print an n×n grid. On every row, print the column indices 1 2 … n separated by single spaces. All n rows are identical.

For each of the n rows, print 1 through n with a single space between numbers, then a newline. The row number does not change what you print — only the column index matters inside the inner loop. That is the lesson: the outer loop controls how many times you repeat the row, not which numbers appear.

Use decimal digits and single spaces between numbers only. Do not leave a trailing space after the last number on a line.' WHERE id = 84 AND title = E'Row-Column Number Grid';
UPDATE problems SET description = E'Right-aligning a triangle means every row is a partnership between leading spaces and stars. Counting spaces carefully is just as important as counting stars — one wrong blank and the whole shape slides.

Read one integer n. Print a right-aligned triangle of stars. For row i (from 1 through n), print exactly (n - i) leading spaces, then i asterisks.

On row i, first write (n - i) space characters, then write i asterisks with no gaps between them. As i grows, the space count shrinks and the star count grows, until the last row is all stars with zero leading spaces. That trade-off between spaces and stars is the whole pattern.

Allowed characters are the space '' '' and ''*''. Leading spaces matter and must match the rule exactly. Do not print trailing spaces after the last star on a row.' WHERE id = 85 AND title = E'Indented Star Triangle';
UPDATE problems SET description = E'This is the number version of a growing triangle: each row’s length depends on the row index, and the values on a row are a simple count from 1 up to that length. Nesting a number-printing loop inside a row loop is the natural fit.

Read one integer n. Print a number triangle where row i depends on i: on row i print the integers 1 2 … i separated by single spaces.

Outer loop: i from 1 to n. Inner loop: print 1 through i with a single space between values, then a newline. Row 1 is just "1"; the last row is "1 2 … n". You are not inventing a new sequence each row — you always restart from 1 and stop at i.

Character set: decimal digits and single spaces between numbers. No trailing space after the last number on each line.' WHERE id = 86 AND title = E'Counting Triangle';
UPDATE problems SET description = E'Addition is the friendliest arithmetic warm-up: read two values, combine them with +, and show the result. It also trains the habit of separating "read input" from "compute" from "print."

Read two integers a and b (typically one per line). Print their sum a + b on one line — nothing else, no labels, no extra words.

Once both numbers are in memory, compute a + b and print that integer. Negative values are allowed; ordinary integer addition still applies, so you do not need special cases for signs.

Output is a single integer on one line. Preserve normal integer addition and do not add any extra text around the answer.' WHERE id = 87 AND title = E'Add Two Numbers';
UPDATE problems SET description = E'Area of a rectangle is length times width — multiplication is the natural operator when two positive dimensions define a flat region. This problem is that formula with plain I/O, so you can practice reading two values and printing one computed result without extra formatting.

Read two positive integers length and width. Print length * width, which is the rectangle’s area.

Read the two dimensions, multiply them, and print the product. Mentally keep the school formula nearby: area = length × width. You are not computing perimeter, diagonal, or volume — only the flat area covered by those two sides.

Inputs are positive integers. Output exactly one integer: the area. Do not print units, labels, or extra spaces around the number.' WHERE id = 88 AND title = E'Area of Rectangle';
UPDATE problems SET description = E'Temperature conversion is a classic place to meet formulas and integer arithmetic together. The Fahrenheit scale relates to Celsius by a fixed multiply, divide, and offset — and with integers, that division truncates any leftover fraction.

Read an integer C (Celsius). Print Fahrenheit as an integer using F = (C * 9) // 5 + 32 — the same as C++/Java int ops / Python // for the division part.

Multiply C by 9 first, then integer-divide by 5, then add 32. Order matters: do not divide C by 5 before multiplying by 9 if you want this exact formula. Doing the multiply first keeps more of the value before the integer division chops the remainder.

Use integer arithmetic exactly as written: compute (C * 9) // 5 + 32 and print one integer F. No floating-point rounding and no extra labels.' WHERE id = 89 AND title = E'Celsius to Fahrenheit';
UPDATE problems SET description = E'An integer average is just "add everything, then divide by how many there were," with the understanding that integer division drops any leftover fraction. For beginners, that truncation is a feature of the contract, not a bug.

Read three integers a, b, and c. Print their integer average: (a + b + c) // 3 (floor toward zero for non-negative; use integer division as in C++/Java ints).

Add the three numbers into a sum, then divide that sum by 3 with integer division. For these tests the values are non-negative, so floor division and toward-zero division agree — you can trust a single integer divide by 3 after the sum.

Output a single integer. Use (a + b + c) // 3 style integer division, not a floating-point mean.' WHERE id = 90 AND title = E'Average of Three Numbers';
UPDATE problems SET description = E'A tiny calculator is branching practice: the operator character tells you which arithmetic to apply. Once you can switch on ''+'', ''-'', ''*'', and ''/'', the same pattern scales to larger menus.

Read two integers a and b, then a character op which is one of + - * /. Print the integer result of applying that operator to a and b. For / use integer division. When op is /, b is never 0.

After reading a, b, and op, use if/else or switch-like structure to choose the operation. When op is ''/'', divide with integer division (toward zero in C++/Java; // in Python for the non-negative cases your language’s integer / covers as specified). The other three operators are ordinary +, -, and *.

op is guaranteed to be one of + - * /. Output one integer. When op is /, b is never 0, so you do not need a divide-by-zero branch here.' WHERE id = 91 AND title = E'Simple Calculator';
UPDATE problems SET description = E'Account updates are often written as "take the old balance and add this deposit." Compound assignment (balance += deposit) keeps that read-change-write idea in one clear step and matches how real updates are written in code.

Read integers balance and deposit. Set balance = balance + deposit (or use +=). Print the new balance on one line.

Read the starting balance and the deposit amount. Add the deposit into balance, then print the updated value. Using += is encouraged because it says "increase balance by deposit" without repeating the variable name on both sides of an equals sign.

Output one integer: the balance after the deposit. No currency symbols or extra words.' WHERE id = 92 AND title = E'Balance Deposit';
UPDATE problems SET description = E'Compound assignments can be chained in a fixed order, and each step mutates x before the next operator runs. The final answer depends on that sequence — rearranging the steps changes the math, even if the same operators appear.

Read an integer x. Apply these updates in order: x += 2; x *= 3; x -= 1. Print the final x.

Start from the input value. First add 2, then multiply by 3, then subtract 1. Do not rearrange the steps. Mentally, you can expand the chain as ((x + 2) * 3) - 1, which is exactly what those three updates do when applied left to right.

Apply exactly: x += 2; x *= 3; x -= 1. Print the final x on one line with no extra text.' WHERE id = 93 AND title = E'Compound Chain';
UPDATE problems SET description = E'Multiplying by k and then dividing by k with integer operators shows that *= and /= are ordinary integer updates. When nothing overflows, scaling up and shrinking back returns you to the original value — a useful mental check while you practice the operators.

Read x and k (k ≠ 0). Do x *= k then x /= k using integer division (x = x / k). Print the final x. For these tests values stay small so overflow is not a concern; after x*=k then x/=k you get back x if no overflow.

Scale x up by multiplying by k, then shrink it by dividing by k with integer division. Print whatever integer remains after both updates. Think of it as two mutations in sequence, not as a single mathematical identity you skip in code — you must actually perform both operations.

k is never 0. Use integer multiply then integer divide. Output one integer.' WHERE id = 94 AND title = E'Scale Then Shrink';
UPDATE problems SET description = E'Comparing two values is not the same as assigning one into the other. The classic beginner trap is writing a single ''='' (assign) when you meant ''=='' (compare). This problem makes you choose the comparison deliberately and print a clear word result.

Read a and b. Print EQUAL if a == b, otherwise print DIFF. Do not assign inside the comparison.

Read both numbers. Ask whether they are equal using ==. If they match, print EQUAL; otherwise print DIFF. Never use a single ''='' in the condition — that would overwrite a value instead of testing equality, which is exactly the trap this problem is named for.

Output exactly one of the words EQUAL or DIFF on one line — no quotes, no extra spaces.' WHERE id = 95 AND title = E'Assign vs Compare Trap';
UPDATE problems SET description = E'Finding the larger of two numbers is a direct comparison: keep the one that is greater. When they tie, either value is fine because they are the same number. This pattern shows up constantly in sorting, clamping, and scoreboards.

Read a and b. Print the larger of the two (print either when they are equal).

Compare a and b. If a is greater, print a; if b is greater, print b; if they are equal, print that shared value. An if/else or a simple max-style expression both satisfy the contract — the judge only checks the numeric answer, not which branch you took on a tie.

Output one integer: the larger of the two, or either when tied. No labels, no second line, and no extra spaces around the number.' WHERE id = 96 AND title = E'Largest of Two Numbers';
UPDATE problems SET description = E'Many real rules are threshold checks: "at least this age," "at least this score," "at least this amount." Here the threshold is 18, and the comparison operator >= captures "at least" in one clean test instead of writing separate > and == cases.

Read an integer age. Print YES if age >= 18, otherwise print NO.

Read the age. If it is greater than or equal to 18, the person is eligible — print YES. Otherwise print NO. Age 18 itself must be YES because the rule is inclusive on the boundary; only ages strictly below 18 are NO.

Output exactly YES or NO — those words only, one line, matching case. Do not print true/false or any explanation text.' WHERE id = 97 AND title = E'Eligible to Vote';
UPDATE problems SET description = E'Relative comparisons often need three outcomes, not two: older, younger, or the same. Branching on >, <, and == keeps those meanings separate so a tie is never mislabeled as older or younger.

Read ageA and ageB. Print OLDER if ageA > ageB, YOUNGER if ageA < ageB, and SAME if they are equal.

Compare ageA to ageB from ageA’s point of view. Greater means OLDER, less means YOUNGER, equal means SAME. Check equality carefully (or handle the greater/less cases first and leave equality as the remaining path) so you do not mislabel a tie as OLDER or YOUNGER.

Output exactly one of: OLDER, YOUNGER, SAME — matching those spellings and uppercase. One word on one line, with no extra spaces.' WHERE id = 98 AND title = E'Compare Ages';
UPDATE problems SET description = E'Grading programs often decide PASS vs FAIL with a threshold: meet or exceed the pass mark and you pass. The >= operator is the natural way to say "marks are good enough," and the pass mark here is not hard-coded — it comes from input so you can reuse the same logic for different bars.

Read marks and passMark. Print PASS if marks >= passMark, otherwise print FAIL.

Read the earned marks and the required pass mark. If marks meet or exceed the pass mark, print PASS; otherwise print FAIL. Equality on the boundary is PASS — that is what >= means. A score one below the pass mark must be FAIL.

Output exactly PASS or FAIL — matching case, one word, one line, with no scores reprinted beside the label.' WHERE id = 99 AND title = E'Compare Marks';
UPDATE problems SET description = E'Access control often needs both checks to succeed: a valid user and a valid password. Logical AND expresses "both must be true" in one decision, which is clearer than nested ifs that deny for different reasons without naming the combined rule.

Read two integers userOk and passOk (each is 0 or 1). Print ACCESS if userOk == 1 AND passOk == 1, otherwise print DENY.

Both flags must be 1. If either is 0, deny access. Use a logical AND (&& / and) or check both conditions in one if. Think of 1 as "ok" and 0 as "not ok" for each flag — a single 1 is never enough by itself.

Each input is 0 or 1. Output exactly ACCESS or DENY. Matching case matters; do not print true/false or numeric codes.' WHERE id = 100 AND title = E'Login Validation';
UPDATE problems SET description = E'A withdrawal is only sensible when the amount is positive and does not exceed the available balance. Logical AND keeps both rules in one decision so you do not approve a zero withdrawal or an overdraft by accident.

Read balance and amount. Print OK if amount > 0 AND amount <= balance, otherwise print NO.

A withdrawal is OK only when the amount is strictly greater than 0 and does not exceed the balance. Zero or negative amounts must print NO, and so must amounts larger than balance. Both conditions have to pass together — satisfying only one is not enough.

Output exactly OK or NO. Matching case matters. Do not print the new balance or any other message on success or failure.' WHERE id = 101 AND title = E'ATM Withdrawal';
UPDATE problems SET description = E'Scholarship rules often combine a marks floor with an income ceiling: you need strong marks and income that is not too high. Both conditions must hold before you say YES — this is another natural place for logical AND.

Read marks and income. Print YES if marks >= 80 AND income <= 200000, otherwise print NO.

Check marks first (at least 80) and income second (at most 200000). Only when both are true should you print YES. Missing either threshold means NO, even if the other looks perfect. The boundaries are inclusive: marks of exactly 80 and income of exactly 200000 both still qualify on their own sides of the rule.

Output exactly YES or NO — one word, matching case, with no extra explanation.' WHERE id = 102 AND title = E'Scholarship Eligibility';
UPDATE problems SET description = E'Even and odd are about the least significant bit in binary: even numbers have that bit clear (0), odd numbers have it set (1). Bitwise AND with 1 reads that bit without using the remainder operator, which is a useful early peek at bit tricks.

Read a non-negative integer n. Print EVEN if (n & 1) == 0, otherwise print ODD.

Compute n & 1. If the result is 0, n is even; otherwise it is odd. This is the same idea as looking at the last binary digit. You are required to use this (n & 1) style test for the decision, not a different approach that happens to agree.

n is non-negative. Output exactly EVEN or ODD. Use the (n & 1) test.' WHERE id = 103 AND title = E'Check Even/Odd';
UPDATE problems SET description = E'Toggling a bit means flipping it from 0 to 1 or from 1 to 0 while leaving every other bit alone. XOR with a mask that has only bit k set is the standard tool for that flip.

Read n and k, where k is a 0-based bit index counted from the right (the least significant bit is index 0). Print n XOR (1 << k) — that expression toggles bit k.

Build a mask with only bit k set using (1 << k). XOR that mask with n. At position k, a 0 becomes 1 and a 1 becomes 0; all other bits stay the same because XOR with 0 leaves a bit unchanged. That is why a one-hot shifted mask is perfect for a single-bit toggle.

k is a 0-based index from the right. Output the integer result of n XOR (1 << k).' WHERE id = 104 AND title = E'Toggle Bit';
UPDATE problems SET description = E'The number of 1-bits in a value’s binary form is its set-bit count (sometimes called population count). Learning to walk bits until none remain is a foundation for many later bit problems.

Read a non-negative integer n. Print how many 1-bits are in its binary form. Brian Kernighan’s trick or a simple loop both work.

One approach: while n is not zero, clear the lowest set bit with n = n & (n - 1) and count each step — that is Brian Kernighan’s method, and it runs once per set bit. Another approach: inspect each bit with shifts or masks until n becomes 0, counting every 1 you see. Either is acceptable.

n is non-negative. Output a single integer: the count of set bits.' WHERE id = 105 AND title = E'Count Set Bits';
UPDATE problems SET description = E'Post-increment style behavior saves the old value, then updates the variable. Simulating that with explicit steps makes the two printed lines easy to reason about without relying on language-specific ++ quirks in expressions.

Read n. Simulate: a = n; n = n + 1; then print a and then n on two separate lines. (This is post-increment style.)

Copy n into a first so you still have the original value. Then add 1 to n. Print a on the first line and the new n on the second line. The first line is "what you would have used before the bump," and the second is "what n became after."

Print exactly two lines: a, then n (after the increment). No extra spaces or labels.' WHERE id = 106 AND title = E'Predict Output';
UPDATE problems SET description = E'A counter that increments from 1 to n is the heartbeat of many for-loops. This problem is that pattern with careful spacing on a single printed line — the same spacing discipline you used on number lines earlier.

Read n. Print the integers from 1 to n inclusive, space-separated on one line. (Uses a counter that increments.)

Start a counter at 1. While it is at most n, print it (with spaces between values), then increment the counter. Stop after n is printed. Mentally this mirrors "for i = 1; i <= n; i++" in languages that write loops that way.

One line, numbers 1..n separated by single spaces. No trailing space after the last number.' WHERE id = 107 AND title = E'Loop Counter';
UPDATE problems SET description = E'Pre-increment and post-increment style updates are easier to trust when you name the temporary values and print them. This problem asks you to follow a fixed sequence of bumps and show exactly what each step produced.

Read n. Then perform: pre = n + 1; n = pre; post_old = n; n = n + 1. Print three lines: pre, post_old, and n.

First compute pre as n + 1 and store that into n — that is the pre-style bump. Then snapshot the current n into post_old and increment n again — that second bump is post-style in spirit because you keep the old snapshot. The three printed values are the pre result, the value before the second bump, and the final n.

Print exactly three lines in order: pre, post_old, n. One integer per line.' WHERE id = 108 AND title = E'Bump Trace';
UPDATE problems SET description = E'Finding a maximum is the same comparison idea as "largest of two," often written compactly with a conditional (ternary) expression. Compact is optional; correctness is not. Ties still produce that shared maximum value.

Read a and b. Print the maximum of the two. Using a conditional expression is fine if you like.

Compare a and b and select the larger value. You may write it as if/else, max-style logic, or a ternary of the form condition ? a : b. When they are equal, either branch’s value is the maximum, so you do not need a special tie case beyond returning that common number.

Output one integer: the maximum of a and b. No labels and no second printed value.' WHERE id = 109 AND title = E'Maximum of Two Numbers';
UPDATE problems SET description = E'The remainder operator % is the everyday way to classify even and odd: dividing by 2 leaves remainder 0 exactly when the number is even. A ternary can pick the label in one expression once you trust that test, which is handy for short programs.

Read n. Print EVEN if n % 2 == 0, otherwise print ODD (a ternary is OK).

Compute n % 2. Remainder 0 means even; any other remainder means odd. You may use if/else or a ternary that picks the string "EVEN" or "ODD". Stick to the % 2 rule for this problem rather than rewriting it with bit tricks — the contract is about modulo classification.

Output exactly EVEN or ODD — matching case, one word on one line.' WHERE id = 110 AND title = E'Even/Odd';
UPDATE problems SET description = E'A pass threshold turns a numeric score into a pass/fail decision. Here the bar is fixed at 40: meet it and you pass. Conditional expressions are optional sugar around that same comparison, useful once you are comfortable choosing a string based on a boolean test.

Read marks in the range 0–100. Print PASS if marks >= 40, otherwise print FAIL (a conditional expression is OK).

If marks are at least 40, print PASS; otherwise print FAIL. A ternary or a plain if both satisfy the contract — pick whichever reads clearly to you. Marks of exactly 40 must be PASS because the check is inclusive.

marks is in 0..100. Output exactly PASS or FAIL — no percentage reprinted beside the word.' WHERE id = 111 AND title = E'Grade Checker';
UPDATE problems SET description = E'Operator precedence decides which parts of an expression run first when there are no parentheses. Multiplication binds tighter than addition, so a + b * c multiplies first even though + appears earlier in the text. Learning that rule early prevents silent wrong answers.

Read a, b, and c. Print the value of a + b * c on one line.

Evaluate as a + (b * c), not (a + b) * c. Compute the product of b and c, then add a. Trust normal precedence instead of inserting parentheses that change the meaning — this problem wants the language’s default order, not a rewritten grouping.

Output one integer: the value of a + b * c with normal precedence. No extra text, labels, or spaces around the number beyond a normal integer print.' WHERE id = 112 AND title = E'Eval Without Parens';
UPDATE problems SET description = E'Parentheses override default precedence. Grouping (a + b) forces addition before multiplication, which is a different expression from a + b * c. This problem asks for that forced grouping on purpose so you see how the same three numbers can produce a different result.

Read a, b, and c. Print (a + b) * c.

Add a and b first, then multiply that sum by c. The parentheses are required by the problem’s meaning even though your language would otherwise prefer to multiply earlier. Write the expression so the sum truly happens before the multiply — do not rely on default precedence here.

Output one integer: (a + b) * c. No labels and no intermediate prints of the sum alone.' WHERE id = 113 AND title = E'Force With Parens';
UPDATE problems SET description = E'Subtraction associates left-to-right, and parentheses can change that grouping. (a - b) - c is not always the same as a - (b - c), which is why tracing both results side by side is such a useful teaching example.

Read a, b, and c. Print two lines: (1) (a - b) - c and (2) a - (b - c).

On the first line, subtract b from a, then subtract c from that result. On the second line, subtract c from b, then subtract that from a. Print each integer result on its own line so you can see how the grouping changed the value.

Print exactly two lines: first (a - b) - c, then a - (b - c). No labels on those lines.' WHERE id = 114 AND title = E'Associativity Trace';
UPDATE problems SET description = E'Integer division gives a quotient; the remainder tells you whether the split was exact. A remainder of zero means the parts divide the total evenly — that is the PASS case here.

Read total and parts (parts ≠ 0). Print two lines: the integer quotient total/parts, then PASS if the remainder is 0, otherwise FAIL.

Divide total by parts with integer division for the first line. Separately check total % parts: if the remainder is 0, print PASS on the second line; otherwise print FAIL. You need both pieces of information — quotient and remainder status — not just one of them.

parts is never 0. Line 1 is the quotient. Line 2 is exactly PASS or FAIL.' WHERE id = 115 AND title = E'Even Split or Fail';
UPDATE problems SET description = E'Budgets in code often change through a short chain of compound updates, then get compared to a limit. The order of +=, *=, and -= matters because each step feeds the next, just like the earlier compound-chain warm-up.

Read budget and limit. Apply: budget += 5; budget *= 2; budget -= 3. Print OK if budget <= limit, otherwise print OVER.

Update the budget in the given order, then compare the final budget to the limit. Within the limit inclusive prints OK; strictly above the limit prints OVER. Do not rearrange the three updates — a different order would be a different budget — and do not compare against the limit until after all three updates finish.

Apply exactly += 5, then *= 2, then -= 3. Output OK or OVER — matching case, one word.' WHERE id = 116 AND title = E'Budget After Updates';
UPDATE problems SET description = E'A strictly increasing triple means each value is smaller than the next: a before b before c with no ties. Both neighboring comparisons must succeed, or the sequence is not strictly increasing. This is the building block behind sorted-order checks.

Read a, b, and c. Print YES if a < b AND b < c, otherwise print NO.

Check a < b and b < c. Both must be true for YES. Equality anywhere in the chain means the triple is not strictly increasing — print NO. You are not checking a < c alone; the middle links matter, because a < c can still be true when b sits outside the strict climb.

Output exactly YES or NO — matching case, one word on one line.' WHERE id = 117 AND title = E'Ordered Triple Check';
UPDATE problems SET description = E'Safe division starts by refusing a zero denominator, then decides whether the numerator divides evenly. Guarding first prevents crashes; checking the remainder second decides whether an integer quotient is honest to print.

Read dens and num. If dens == 0 print SAFE-SKIP. Else if num % dens == 0 print the quotient. Otherwise print NOT-EVEN.

First protect against divide-by-zero: when dens is 0, print SAFE-SKIP and stop. Otherwise, if num is divisible by dens (remainder 0), print the integer quotient num/dens. If not divisible, print NOT-EVEN — do not invent a fractional result.

Possible outputs on one line: SAFE-SKIP, an integer quotient, or NOT-EVEN.' WHERE id = 118 AND title = E'Safe Divide Gate';
UPDATE problems SET description = E'Bitwise AND with a mask keeps only the bits you care about and clears the rest. After masking, a nonzero result means at least one of those selected bits was on; zero means none were.

Read flags and mask. Compute bits = flags & mask. Print ON if bits != 0 else OFF on the first line, then print bits on the second line.

AND flags with mask to keep only overlapping 1-bits. If that result is nonzero, the masked region includes at least one 1 → ON; otherwise OFF. Always print the numeric bits value on the next line so the judge can see both the label and the masked integer.

Print exactly two lines: ON or OFF, then the integer bits.' WHERE id = 119 AND title = E'Mask Then Pick';
UPDATE problems SET description = E'This problem puts precedence and parentheses in a small contest: evaluate both forms, then judge how close the precedence-based left value sits relative to a target compared with the parenthesized right value.

Read a, b, c, and target. Compute left = a + b * c and right = (a + b) * c. Print left, right, then MATCH if left == target else NEAR if |left - target| <= |right - target| else FAR.

Evaluate both expressions. Print left on line 1 and right on line 2. On line 3: if left equals target, print MATCH; otherwise compare absolute distances of left and right to target — print NEAR when left is at least as close as right (|left - target| <= |right - target|), otherwise FAR. Absolute distance means the non-negative difference.

Print three lines: left, right, then MATCH or NEAR or FAR.' WHERE id = 120 AND title = E'Star or Paren Race';
UPDATE problems SET description = E'Totals and percentages show up in every report card. Here you sum five subject marks, then turn that total into an integer percentage out of a maximum of 500, using only integer arithmetic so floating-point surprises never appear.

Read five integers (subject marks), one per line. Print exactly two lines:
SUM <total>
PERCENTAGE <integer>
where PERCENTAGE is floor((total * 100) / 500) using integer arithmetic toward zero for non-negative totals.

Add all five marks to get the total. For the percentage, multiply the total by 100 first, then integer-divide by 500 — that is (total * 100) // 500 style math (toward zero for non-negative totals). Label each output line with the words SUM and PERCENTAGE followed by a single space and the number.

Exactly two output lines: "SUM <total>" and "PERCENTAGE <integer>". PERCENTAGE = floor((total * 100) / 500) with integer arithmetic toward zero for non-negative totals. Watch the labels and the single space after each label.' WHERE id = 121 AND title = E'Sum and Percentage of Marks';
UPDATE problems SET description = E'Simple interest uses one closed formula on the original principal. Compound interest grows year by year: each year you earn interest on the current amount, so the base for next year is larger. Integer floor updates keep both results whole numbers.

Read three integers P (principal), R (rate percent), and T (time in years), one per line.

SI = (P * R * T) // 100
Start amount = P; for each of T years: amount = amount + (amount * R) // 100
CI = amount - P

Print exactly two lines:
SI <si>
CI <ci>

Simple interest is a single evaluation of (P * R * T) // 100. Compound interest loops T times; each year adds (amount * R) // 100 to amount. After the loop, CI is the final amount minus the original principal P — only the interest portion, not the whole final amount.

Use integer floor division exactly as written. Output exactly two labeled lines:
SI <si>
CI <ci>
with a single space after each label.' WHERE id = 122 AND title = E'Simple and Compound Interest';
UPDATE problems SET description = E'When a problem asks you to approximate π as 22/7, it wants integer formulas that multiply by 22 or 44 and divide by 7 — no floating-point π constant is needed. Area uses r²; circumference uses the familiar 2πr idea with those integer stand-ins.

Read one integer radius r. Use pi as 22/7 with integer arithmetic:
AREA = (22 * r * r) // 7
CIRCUMFERENCE = (44 * r) // 7
Print exactly two lines:
AREA <area>
CIRCUMFERENCE <circ>

Plug r into both formulas using integer multiplication and // 7. Area multiplies 22 by r by r before dividing; circumference multiplies 44 by r before dividing (because 2 × 22 = 44). Print the labeled AREA line first, then CIRCUMFERENCE.

Exactly two lines: "AREA <area>" and "CIRCUMFERENCE <circ>" with AREA = (22 * r * r) // 7 and CIRCUMFERENCE = (44 * r) // 7. Keep the labels, the spaces, and the integer floor divisions exact.' WHERE id = 123 AND title = E'Area and Circumference of a Circle';
UPDATE problems SET description = E'This conversion uses the same Celsius-to-Fahrenheit relationship as before, with an explicit rule that division truncates toward zero — matching C++/Java int division, including for negative Celsius values.

Read one integer C (Celsius). Print one integer F = (C * 9) / 5 + 32 using language integer division that truncates toward zero (C++/Java int division; in Python use int(C*9/5)+32 or equivalent toward-zero division).

Multiply C by 9, divide by 5 toward zero, then add 32. Be careful in Python: plain // floors toward negative infinity, which differs from toward-zero for negatives — follow the toward-zero rule stated in the contract so your answer matches the judge.

Output one integer F. Division truncates toward zero as in C++/Java int division. No labels.' WHERE id = 124 AND title = E'Celsius to Fahrenheit';
UPDATE problems SET description = E'Swapping two variables needs a temporary home for one value, or you will overwrite a number before you finish copying. The classic three-variable swap is the clearest way to learn that idea before meeting tricks that swap without a named temp.

Read two integers a and b (one per line). Swap them using a third variable. Print exactly two lines: the new a, then the new b.

Save a into temp, copy b into a, then copy temp into b (or any equivalent third-variable swap). After the swap, the first printed line is the original b and the second is the original a. You must actually use a third variable as the problem requires.

Must use a third variable. Print exactly two lines: new a, then new b — one integer per line.' WHERE id = 125 AND title = E'Swap Two Numbers';
UPDATE problems SET description = E'Equality checks deserve unambiguous labels. EQUAL vs NOT_EQUAL leaves no doubt about whether the two integers matched, and it trains you to use == for comparison rather than = for assignment — the same trap family as earlier compare-vs-assign practice.

Read two integers a and b. Print EQUAL if a == b, otherwise print NOT_EQUAL.

Use == to test equality. Matching values → EQUAL; anything else → NOT_EQUAL. There is no third outcome and no need to print the numbers themselves. Resist writing a single ''='' in the condition; that assigns instead of comparing.

Output exactly EQUAL or NOT_EQUAL — matching case and spelling, including the underscore, with no extra spaces.' WHERE id = 126 AND title = E'Check Numbers Equal';
UPDATE problems SET description = E'Finding the greatest of three values extends the two-number maximum: compare pairwise or keep a running champion as you go. Ties are allowed — when several share the top value, you still print that greatest number once, not a list of winners.

Read three integers a, b, and c. Print the greatest value once (ties allowed).

Compare the three values pairwise or keep a running maximum as you read them. When two or more share the top value, still print that value only once — do not print multiple lines or list every tied variable name. Any correct tournament of comparisons is fine.

Output a single integer: the maximum of a, b, and c. No labels and no extra blank lines.' WHERE id = 127 AND title = E'Greatest of Three Numbers';
UPDATE problems SET description = E'Modulo classification again: n % 2 tells you even vs odd. Zero is an even number by definition because dividing 0 by 2 leaves remainder 0 — beginners sometimes second-guess that case, so the contract states it plainly.

Read one integer n. Print EVEN if n % 2 == 0, otherwise ODD. Zero is EVEN.

Compute n % 2. Remainder 0 → EVEN (including when n is 0). Otherwise → ODD. Negative inputs, if they appear, still follow the remainder-zero rule for EVEN as implemented by your language’s % with this contract’s EVEN/ODD labels for the tested cases. Prefer a clear if/else or ternary on the remainder rather than inventing a different rule for zero.

Output exactly EVEN or ODD. Zero is EVEN. Matching case only — no extra words.' WHERE id = 128 AND title = E'Even or Odd';
UPDATE problems SET description = E'Gregorian leap years are not "divisible by 4" alone. Century years need the 400 rule: years divisible by 100 are not leap years unless they are also divisible by 400. Checking in the right order prevents classic mistakes like calling 1900 a leap year.

Read one integer year. Print LEAP or NOT_LEAP using this chain: divisible by 400 → LEAP; else divisible by 100 → NOT_LEAP; else divisible by 4 → LEAP; else NOT_LEAP.

Check divisibility by 400 first (leap), then by 100 (not leap), then by 4 (leap), otherwise not leap. Order matters: 1900 is NOT_LEAP; 2000 is LEAP. A lone "year % 4 == 0" test is not enough for this problem.

Output exactly LEAP or NOT_LEAP following the 400 / 100 / 4 rule chain.' WHERE id = 129 AND title = E'Leap Year Check';
UPDATE problems SET description = E'Letter grades map a percentage into bands. Working from the top band downward (or with clear inclusive ranges) keeps boundary values in the higher band as the problem defines them.

Read an integer percentage p in 0..100. Print A if 90–100, B if 80–89, C if 60–79, and D if 0–59.

Compare p against the band thresholds from the top down, or use inclusive range checks. 90 and above is A; 80 through 89 is B; 60 through 79 is C; below 60 is D. On a boundary like 80 or 90, the value belongs to the higher band listed for that threshold.

p is in 0..100. Output exactly one letter: A, B, C, or D — no extra words.' WHERE id = 130 AND title = E'Grade Calculator';
UPDATE problems SET description = E'Switch-style branching on an operator character is the structured way to build a small calculator. Each case performs one operation; division uses toward-zero integer division so results match C++/Java-style int math.

Read integer a, integer b, then a single character operator op on its own line. op is one of + - * /. Print the integer result. For / use toward-zero integer division. When op is /, b is never 0. Use a switch (or equivalent branching) on op.

Read a, b, then op. Branch on op to add, subtract, multiply, or divide. Prefer a switch/case (or your language’s equivalent) as the problem requests, rather than a long unrelated structure that hides the operator dispatch.

Toward-zero integer division for /. b is never 0 when op is /. Output one integer with no extra text.' WHERE id = 131 AND title = E'Calculator Using Switch';
UPDATE problems SET description = E'Summing 1 through N is a classic loop (or the closed formula N*(N+1)/2 if you prefer). The edge case N = 0 matters: there are no positive integers to add, so the sum is 0. Getting that edge right is part of reading the contract carefully.

Read integer N. Print the sum of all integers from 1 to N inclusive. If N = 0, print 0.

If N is 0, the sum is 0. Otherwise add every integer from 1 to N with a loop, or use the optional closed formula carefully with integer arithmetic. Be explicit about the N = 0 path so you do not accidentally print something else or skip a required zero answer.

Output one integer. When N = 0, print 0. No labels like SUM and no trailing spaces.' WHERE id = 132 AND title = E'Sum of N Numbers';
UPDATE problems SET description = E'Factorial N! is the product of all positive integers up to N. By definition 0! is 1 — that special case keeps many formulas consistent, and your program must honor it instead of treating zero as an error or returning 0.

Read a non-negative integer N. Print N! (and remember 0! = 1).

Start a result at 1. Multiply by each integer from 1 to N in turn. When N is 0, the loop body never multiplies anything extra, so the result stays 1 — which is exactly 0!. Do not treat 0 as an error, and do not start the product at 0 (that would zero out every factorial).

N is non-negative. Output N! as a single integer. 0! is 1.' WHERE id = 133 AND title = E'Factorial of a Number';
UPDATE problems SET description = E'Walking from 1 to N once while maintaining two running totals — one for evens, one for odds — keeps the categories clear and avoids two separate passes. N = 0 means both totals stay zero.

Read integer N. From 1 to N inclusive, compute the sum of even numbers and the sum of odd numbers. If N = 0, both sums are 0. Print exactly two lines:
EVEN <even_sum>
ODD <odd_sum>

Loop i from 1 to N. If i is even, add it to the even sum; if odd, add it to the odd sum. For N = 0, skip the loop and keep both sums at 0. Then print the two labeled lines with a single space after each label.

Exactly two lines: "EVEN <even_sum>" and "ODD <odd_sum>". When N = 0, both sums are 0. Watch spacing after the labels and avoid trailing spaces.' WHERE id = 134 AND title = E'Sum of Even and Odd Numbers';
UPDATE problems SET description = E'The Fibonacci sequence starts 0, 1, 1, 2, 3, … where each new term is the sum of the previous two. Generating the first N terms teaches you to keep a short sliding window of recent values.

Read integer N (N ≥ 1). Print the first N Fibonacci terms starting with 0 1 1 2 3 … Terms on one line, separated by single spaces, with no trailing space.

Handle small N carefully: if N is 1, print just 0; if N is 2, print 0 1. For larger N, keep the last two terms and repeatedly append their sum until you have N terms. Always begin the sequence at 0, then 1 — do not start at 1 1.

N ≥ 1. One line, space-separated terms, no trailing space. The sequence begins 0 1 1 2 …' WHERE id = 135 AND title = E'Fibonacci Series';
UPDATE problems SET description = E'A prime number has exactly two distinct positive divisors: 1 and itself. Small edge cases matter a lot for beginners: 0 and 1 are not prime, and 2 is the smallest prime (and the only even one).

Read integer n. Print PRIME if n is prime, otherwise NOT_PRIME. 0 and 1 are NOT_PRIME. 2 is PRIME.

If n < 2, it is NOT_PRIME. For n ≥ 2, check for a divisor from 2 through sqrt(n) (or up to n-1 if you prefer a simpler loop). If any such divisor divides n evenly, it is NOT_PRIME; otherwise it is PRIME. You only need one confirming divisor to reject primality.

Output exactly PRIME or NOT_PRIME. Remember: 0 and 1 → NOT_PRIME; 2 → PRIME.' WHERE id = 136 AND title = E'Prime Number Check';
UPDATE problems SET description = E'Decimal digits peel off from the right: n % 10 is the last digit, and integer-dividing n by 10 drops that digit. Adding those digits as you go yields the digit sum — a building block for many later digit problems such as reverse and Armstrong checks.

Read a non-negative integer n. Print the sum of its decimal digits.

While n is not zero, add n % 10 to a running total and replace n with n / 10 (integer division). When n starts as 0, there are no loop iterations and the digit sum is 0 — which is correct for the single digit 0. Keep using integer division so you do not introduce fractional leftovers.

n is non-negative. Output one integer: the sum of its decimal digits. No spaces between digits and no labels around the total.' WHERE id = 137 AND title = E'Sum of Digits';
UPDATE problems SET description = E'Reversing a number’s decimal digits means building a new integer whose digits appear in the opposite order. Storing the answer as an integer automatically drops leading zeros that would have appeared at the front of the reversed digit sequence.

Read a non-negative integer n. Print its reverse as an integer (leading zeros in the reverse are dropped). For instance, reversing 120 yields 21; reversing 100 yields 1; reversing 0 yields 0.

Repeatedly take n % 10 as the next digit of the answer, multiply the answer so far by 10 and add that digit, then integer-divide n by 10 until n becomes 0. That process walks the original digits from right to left while assembling the reversed value from left to right.

n is non-negative. Output the reversed value as an integer (no leading zeros in the printed number, except for 0 itself).' WHERE id = 138 AND title = E'Reverse a Number';
UPDATE problems SET description = E'An Armstrong number equals the sum of its own digits each raised to the power of how many digits it has. Single-digit numbers are Armstrong under that definition, and listing them in a fixed range is a nice workout for digit extraction plus powering.

You do not need the input value for the answer (any single integer may be provided and must be ignored). Print all Armstrong numbers from 1 to 1000 inclusive, separated by single spaces on one line, in ascending order, with no trailing space.

An Armstrong number equals the sum of its own digits each raised to the power of the count of digits. (Single-digit numbers 1..9 are Armstrong. 1000 is not.)

Read and ignore the input. For each candidate from 1 to 1000, count its digits, compute the sum of each digit raised to that power, and compare the sum to the number itself. Collect the matches and print them space-separated in ascending order.

Ignore the input integer. The range is 1..1000 inclusive. One line, spaces between values, no trailing space. 1000 is not Armstrong; 1..9 are.' WHERE id = 139 AND title = E'Armstrong Numbers';
UPDATE problems SET description = E'Binary and decimal are two ways to write the same integer value. This problem asks you to convert in either direction depending on a mode flag: mode 1 reads bits as a string and prints decimal; mode 2 reads a decimal integer and prints its binary digits.

Read an integer mode, then a second line of input.
If mode = 1: the second line is a binary string (digits 0/1 only, length 1..31). Print its decimal value.
If mode = 2: the second line is a non-negative decimal integer. Print its binary representation without leading zeros (except 0 itself is 0).

Branch on mode. For mode 1, interpret the bit string as base-2 (leftmost bit is the highest place value) and print the resulting decimal integer. For mode 2, emit the binary digits of the number with no extra leading zeros — when the value is 0, print a single 0.

Mode is 1 or 2. Mode 1: binary string length 1..31, digits 0/1 only → decimal. Mode 2: non-negative decimal → binary without leading zeros (0 → 0). Print only the converted value, with no labels or extra spaces.' WHERE id = 140 AND title = E'Binary–Decimal Conversion';

SELECT id, title, left(description, 100) AS preview FROM problems WHERE id BETWEEN 80 AND 140 ORDER BY id;
