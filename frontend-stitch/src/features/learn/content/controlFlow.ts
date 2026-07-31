import type { LessonSection } from "../types";

export const CONTROL_FLOW_SECTION: LessonSection = {
  id: "control-flow",
  title: "Control Flow",
  subtitle:
    "Teach your program to choose and repeat — ifs, switches, and loops in C++, Java, or Python.",
  lessons: [
    {
      slug: "if-statement",
      order: 1,
      title: "The if statement",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 40,
      teaser: "Run a block of code only when a condition is true.",
      blocks: [
        {
          type: "hook",
          text: "Without choices, every program is a straight hallway. The if statement is a door that opens only when a condition is true.",
        },
        {
          type: "paragraph",
          text: "You write a condition that evaluates to true or false. If it's true, the indented (or braced) block runs. If it's false, the program skips that block and continues.",
        },
        {
          type: "analogy",
          text: "Like an umbrella rule: \"If it's raining, open the umbrella.\" On a sunny day, you never open it — you just keep walking.",
        },
        {
          type: "heading",
          text: "Check one condition",
        },
        {
          type: "paragraph",
          text: "Here's a tiny gate: if a number is positive, print Positive. Switch languages to see braces vs indentation.",
        },
        {
          type: "code",
          caption: "If n is positive, print Positive",
          code: {
            python:
              "n = int(input())\nif n > 0:\n    print(\"Positive\")",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    if (n > 0) {\n      System.out.println(\"Positive\");\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  if (n > 0) {\n    cout << \"Positive\" << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "syntaxWords",
          caption: "Words that matter here",
          words: {
            python: [
              {
                term: "if",
                meaning: "Starts a condition check. The next line(s) run only when the condition is true.",
              },
              {
                term: "n > 0",
                meaning: "A comparison that becomes True or False.",
              },
              {
                term: ":",
                meaning: "Ends the if header in Python. The indented block below belongs to this if.",
              },
            ],
            java: [
              {
                term: "if",
                meaning: "Starts a condition check.",
              },
              {
                term: "(n > 0)",
                meaning: "Condition in parentheses — required in Java.",
              },
              {
                term: "{ ... }",
                meaning: "Body that runs only when the condition is true.",
              },
            ],
            cpp: [
              {
                term: "if",
                meaning: "Starts a condition check.",
              },
              {
                term: "(n > 0)",
                meaning: "Condition in parentheses — required in C++.",
              },
              {
                term: "{ ... }",
                meaning: "Body that runs only when the condition is true.",
              },
            ],
          },
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Don't put a semicolon right after if (...). That ends the if early and the next block always runs (or never attaches).",
        },
        {
          type: "keyTakeaways",
          items: [
            "if runs a block only when a condition is true.",
            "False conditions skip the block — the program continues.",
            "Python uses indentation; C++/Java use braces.",
          ],
        },
      ],
    },
    {
      slug: "if-else",
      order: 2,
      title: "if / else",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 41,
      teaser: "Two paths — one when true, another when false.",
      blocks: [
        {
          type: "hook",
          text: "Sometimes skipping isn't enough. You need a Plan B: if this, do A; otherwise, do B. That's if / else.",
        },
        {
          type: "paragraph",
          text: "Exactly one of the two branches runs. The condition is checked once. True → if body. False → else body. Never both.",
        },
        {
          type: "analogy",
          text: "A fork in the road: left if the sign says Open, right if it says Closed. You don't walk both paths.",
        },
        {
          type: "heading",
          text: "Even or odd",
        },
        {
          type: "paragraph",
          text: "Read an integer. Print Even if divisible by 2, otherwise Odd.",
        },
        {
          type: "code",
          caption: "Even vs Odd with if / else",
          code: {
            python:
              "n = int(input())\nif n % 2 == 0:\n    print(\"Even\")\nelse:\n    print(\"Odd\")",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    if (n % 2 == 0) {\n      System.out.println(\"Even\");\n    } else {\n      System.out.println(\"Odd\");\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  if (n % 2 == 0) {\n    cout << \"Even\" << endl;\n  } else {\n    cout << \"Odd\" << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Use == for equality checks. A single = is assignment — a classic bug inside if conditions (especially in C++/Java).",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Don't assume else means \"everything else you can imagine.\" It only means \"the if condition was false\" — nothing more.",
        },
        {
          type: "keyTakeaways",
          items: [
            "if / else picks exactly one of two branches.",
            "else runs only when the if condition is false.",
            "Compare with ==, assign with =.",
          ],
        },
      ],
    },
    {
      slug: "else-if",
      order: 3,
      title: "else if chains",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 42,
      teaser: "More than two options — check conditions in order.",
      blocks: [
        {
          type: "hook",
          text: "Life rarely has only two buckets. Grades, traffic lights, and menus need a chain: check A, else check B, else check C.",
        },
        {
          type: "paragraph",
          text: "An else-if (elif in Python) chain tests conditions top to bottom. The first true condition wins; later ones are skipped. A final else is optional for \"none of the above.\"",
        },
        {
          type: "analogy",
          text: "Sorting mail into slots: try Slot A first. If it doesn't fit, try Slot B. If not B, try Slot C. Stop at the first fit.",
        },
        {
          type: "heading",
          text: "Sign of a number",
        },
        {
          type: "paragraph",
          text: "Print Positive, Zero, or Negative based on one integer.",
        },
        {
          type: "code",
          caption: "Three-way sign check",
          code: {
            python:
              "n = int(input())\nif n > 0:\n    print(\"Positive\")\nelif n == 0:\n    print(\"Zero\")\nelse:\n    print(\"Negative\")",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    if (n > 0) {\n      System.out.println(\"Positive\");\n    } else if (n == 0) {\n      System.out.println(\"Zero\");\n    } else {\n      System.out.println(\"Negative\");\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  if (n > 0) {\n    cout << \"Positive\" << endl;\n  } else if (n == 0) {\n    cout << \"Zero\" << endl;\n  } else {\n    cout << \"Negative\" << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Order matters. Put the most specific checks first. A broad condition early can \"steal\" cases you meant for later branches.",
        },
        {
          type: "keyTakeaways",
          items: [
            "else-if / elif chains check conditions in order.",
            "Only the first matching branch runs.",
            "A final else covers \"none matched.\"",
          ],
        },
      ],
    },
    {
      slug: "switch",
      order: 4,
      title: "switch (and Python's alternative)",
      estMinutes: 10,
      kind: "read+problem",
      linkedProblemId: 43,
      teaser: "Pick a branch by matching a value — switch in C++/Java; if/elif in Python.",
      blocks: [
        {
          type: "hook",
          text: "When one value picks among many fixed options — like a day number or a menu choice — a switch (or a clean if/elif chain) keeps the code readable.",
        },
        {
          type: "paragraph",
          text: "C++ and Java have a classic switch: compare one expression against case labels, run the matching arm, usually break out. Python has no classic switch statement — use if/elif (or a dict) instead.",
        },
        {
          type: "analogy",
          text: "A vending machine: press button 1, 2, or 3. Each button maps to one snack. Wrong button → \"Invalid.\"",
        },
        {
          type: "heading",
          text: "Day name from a number",
        },
        {
          type: "paragraph",
          text: "Read an integer 1–3 and print Mon, Tue, or Wed. Anything else → Invalid.",
        },
        {
          type: "code",
          caption: "Match a day number",
          code: {
            python:
              "d = int(input())\nif d == 1:\n    print(\"Mon\")\nelif d == 2:\n    print(\"Tue\")\nelif d == 3:\n    print(\"Wed\")\nelse:\n    print(\"Invalid\")",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int d = sc.nextInt();\n    switch (d) {\n      case 1:\n        System.out.println(\"Mon\");\n        break;\n      case 2:\n        System.out.println(\"Tue\");\n        break;\n      case 3:\n        System.out.println(\"Wed\");\n        break;\n      default:\n        System.out.println(\"Invalid\");\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int d;\n  cin >> d;\n  switch (d) {\n    case 1:\n      cout << \"Mon\" << endl;\n      break;\n    case 2:\n      cout << \"Tue\" << endl;\n      break;\n    case 3:\n      cout << \"Wed\" << endl;\n      break;\n    default:\n      cout << \"Invalid\" << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "fun-fact",
          text: "Python has no classic switch/case like C++ and Java. Idiomatic Python uses if/elif/else (or a dictionary of handlers). That's not a weakness — it's the usual style.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "In C++/Java, forgetting break lets execution \"fall through\" into the next case. Add break unless you intentionally want fall-through.",
        },
        {
          type: "keyTakeaways",
          items: [
            "switch matches one value against several cases (C++/Java).",
            "Python uses if/elif (or dicts) instead of classic switch.",
            "Remember break in C++/Java to avoid fall-through.",
          ],
        },
      ],
    },
    {
      slug: "for-loop",
      order: 5,
      title: "for loops",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 44,
      teaser: "Repeat work a known number of times — or walk a range.",
      blocks: [
        {
          type: "hook",
          text: "Copy-pasting the same line ten times is how you invent bugs. A for loop says: do this, for each value in this range.",
        },
        {
          type: "paragraph",
          text: "Use a for loop when you know how many times to repeat, or when you want to walk a sequence of numbers. The loop variable changes each trip; the body runs once per trip.",
        },
        {
          type: "analogy",
          text: "Numbered lockers 1 to n. You open locker 1, then 2, then 3… until n. Same action, different locker number each time.",
        },
        {
          type: "heading",
          text: "Print 1 to n",
        },
        {
          type: "paragraph",
          text: "Read n, then print each integer from 1 through n on its own line.",
        },
        {
          type: "code",
          caption: "Count from 1 to n",
          code: {
            python: "n = int(input())\nfor i in range(1, n + 1):\n    print(i)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      System.out.println(i);\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    cout << i << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "syntaxWords",
          caption: "Loop pieces",
          words: {
            python: [
              {
                term: "for i in range(...)",
                meaning: "i takes each value from the range, one per iteration.",
              },
              {
                term: "range(1, n + 1)",
                meaning: "Values 1, 2, …, n. The end is exclusive, so add 1 to include n.",
              },
            ],
            java: [
              {
                term: "for (init; cond; step)",
                meaning: "Classic three-part for: start, keep-going test, update each lap.",
              },
              {
                term: "i++",
                meaning: "Add 1 to i after each iteration.",
              },
            ],
            cpp: [
              {
                term: "for (init; cond; step)",
                meaning: "Classic three-part for: start, keep-going test, update each lap.",
              },
              {
                term: "i++",
                meaning: "Add 1 to i after each iteration.",
              },
            ],
          },
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Off-by-one errors are common: range(n) in Python is 0..n-1, not 1..n. Check whether you need inclusive or exclusive ends.",
        },
        {
          type: "keyTakeaways",
          items: [
            "for loops repeat for a known range or count.",
            "The loop variable changes each iteration.",
            "Watch off-by-one mistakes at the start and end.",
          ],
        },
      ],
    },
    {
      slug: "while-loop",
      order: 6,
      title: "while loops",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 45,
      teaser: "Keep going while a condition stays true.",
      blocks: [
        {
          type: "hook",
          text: "Sometimes you don't know the trip count up front — you know when to stop. while means: keep looping as long as this stays true.",
        },
        {
          type: "paragraph",
          text: "Before each iteration, the condition is checked. True → run the body. False → leave the loop. Something inside the body (or the condition) must eventually make it false, or you loop forever.",
        },
        {
          type: "analogy",
          text: "Eating chips while the bag isn't empty. You don't count chips first — you stop when the bag is empty.",
        },
        {
          type: "heading",
          text: "Count down to 1",
        },
        {
          type: "paragraph",
          text: "Read n, print n, n-1, …, 1 — one number per line — using while.",
        },
        {
          type: "code",
          caption: "Countdown with while",
          code: {
            python:
              "n = int(input())\nwhile n >= 1:\n    print(n)\n    n -= 1",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    while (n >= 1) {\n      System.out.println(n);\n      n--;\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  while (n >= 1) {\n    cout << n << endl;\n    n--;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Infinite loops usually mean you forgot to update the variable in the condition. Always ask: what makes this eventually false?",
        },
        {
          type: "keyTakeaways",
          items: [
            "while checks the condition before each lap.",
            "Great when the stop rule is clearer than the count.",
            "Update something so the loop can end.",
          ],
        },
      ],
    },
    {
      slug: "do-while",
      order: 7,
      title: "do-while (and Python's emulation)",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 46,
      teaser: "Run the body at least once — real do-while in C++/Java; while True + break in Python.",
      blocks: [
        {
          type: "hook",
          text: "Some actions must happen at least once — ask a question, then decide whether to ask again. That's the spirit of do-while.",
        },
        {
          type: "paragraph",
          text: "C++ and Java have do { ... } while (condition): the body runs first, then the condition is checked. Python has no do-while keyword — emulate it with while True and break when done.",
        },
        {
          type: "analogy",
          text: "Taste the soup once, then decide if it needs more salt. You always taste at least once.",
        },
        {
          type: "heading",
          text: "Print, then maybe continue",
        },
        {
          type: "paragraph",
          text: "Read numbers until you see 0. Print each non-zero number. Stop when 0 appears (0 itself is not printed).",
        },
        {
          type: "code",
          caption: "Repeat until 0",
          code: {
            python:
              "while True:\n    n = int(input())\n    if n == 0:\n        break\n    print(n)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n;\n    do {\n      n = sc.nextInt();\n      if (n != 0) {\n        System.out.println(n);\n      }\n    } while (n != 0);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  do {\n    cin >> n;\n    if (n != 0) {\n      cout << n << endl;\n    }\n  } while (n != 0);\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "fun-fact",
          text: "Python has no do-while statement. The usual pattern is while True: … if done: break. Same idea: body first, exit when ready.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "In do-while, the condition uses a semicolon after while (...); — missing it is a syntax error. In Python, forgetting break inside while True is an infinite loop.",
        },
        {
          type: "keyTakeaways",
          items: [
            "do-while runs the body at least once (C++/Java).",
            "Python emulates it with while True + break.",
            "Use it when \"once, then maybe again\" matches the problem.",
          ],
        },
      ],
    },
    {
      slug: "break",
      order: 8,
      title: "break",
      estMinutes: 7,
      kind: "read+problem",
      linkedProblemId: 47,
      teaser: "Leave a loop immediately when you're done.",
      blocks: [
        {
          type: "hook",
          text: "Sometimes you find what you need mid-loop. break is the emergency exit: leave the loop right now.",
        },
        {
          type: "paragraph",
          text: "break ends the innermost loop. Code after the loop continues. It doesn't \"skip one iteration\" — that's continue. break means done with this loop entirely.",
        },
        {
          type: "analogy",
          text: "Searching a drawer for keys. The moment you find them, you stop digging — you don't empty the whole drawer first.",
        },
        {
          type: "heading",
          text: "Find the first multiple",
        },
        {
          type: "paragraph",
          text: "Read n. Print the first multiple of 7 that is ≥ n, then stop. (Scan upward from n.)",
        },
        {
          type: "code",
          caption: "break when found",
          code: {
            python:
              "n = int(input())\nx = n\nwhile True:\n    if x % 7 == 0:\n        print(x)\n        break\n    x += 1",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int x = n;\n    while (true) {\n      if (x % 7 == 0) {\n        System.out.println(x);\n        break;\n      }\n      x++;\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  int x = n;\n  while (true) {\n    if (x % 7 == 0) {\n      cout << x << endl;\n      break;\n    }\n    x++;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "mistake",
          text: "break only exits the innermost loop. In nested loops, an outer loop keeps going unless you structure an exit for it too.",
        },
        {
          type: "keyTakeaways",
          items: [
            "break exits the innermost loop immediately.",
            "Use it when further iterations aren't needed.",
            "It is not the same as continue.",
          ],
        },
      ],
    },
    {
      slug: "continue",
      order: 9,
      title: "continue",
      estMinutes: 7,
      kind: "read+problem",
      linkedProblemId: 48,
      teaser: "Skip the rest of this iteration — start the next one.",
      blocks: [
        {
          type: "hook",
          text: "Sometimes one lap is a dud, but the race isn't over. continue skips the rest of this iteration and jumps to the next.",
        },
        {
          type: "paragraph",
          text: "When continue runs, anything below it in the loop body is skipped for this lap. The loop updates (for) or rechecks (while) and continues. The loop itself does not end.",
        },
        {
          type: "analogy",
          text: "Grading papers: if one is blank, skip writing comments on it and move to the next paper. You don't leave the classroom.",
        },
        {
          type: "heading",
          text: "Print odds only",
        },
        {
          type: "paragraph",
          text: "Read n. Print every odd integer from 1 to n, one per line. Use continue to skip evens.",
        },
        {
          type: "code",
          caption: "Skip evens with continue",
          code: {
            python:
              "n = int(input())\nfor i in range(1, n + 1):\n    if i % 2 == 0:\n        continue\n    print(i)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      if (i % 2 == 0) {\n        continue;\n      }\n      System.out.println(i);\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    if (i % 2 == 0) {\n      continue;\n    }\n    cout << i << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "You can often rewrite continue with an opposite if. Use whichever keeps the happy-path code flatter and clearer.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Don't confuse continue with break. continue = skip this lap. break = leave the loop.",
        },
        {
          type: "keyTakeaways",
          items: [
            "continue skips the rest of the current iteration.",
            "The loop keeps going for remaining values.",
            "break exits; continue advances.",
          ],
        },
      ],
    },
    {
      slug: "nested-loops",
      order: 10,
      title: "Nested loops",
      estMinutes: 10,
      kind: "read+problem",
      linkedProblemId: 49,
      teaser: "A loop inside a loop — rows and columns, grids and patterns.",
      blocks: [
        {
          type: "hook",
          text: "One loop walks a line. Two loops walk a grid. Nesting is how you print patterns, fill tables, and compare every pair.",
        },
        {
          type: "paragraph",
          text: "The outer loop runs slowly (rows). For each outer value, the inner loop runs fully (columns). Total work is often outer_count × inner_count — keep that in mind as problems grow.",
        },
        {
          type: "analogy",
          text: "A calendar: months on the outside, days on the inside. For each month, you walk all its days before moving to the next month.",
        },
        {
          type: "heading",
          text: "Print a square of stars",
        },
        {
          type: "paragraph",
          text: "Read n. Print an n×n square of * characters (n rows, each with n stars, no spaces).",
        },
        {
          type: "code",
          caption: "n × n star square",
          code: {
            python:
              "n = int(input())\nfor _ in range(n):\n    print(\"*\" * n)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 0; i < n; i++) {\n      for (int j = 0; j < n; j++) {\n        System.out.print(\"*\");\n      }\n      System.out.println();\n    }\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n      cout << '*';\n    }\n    cout << endl;\n  }\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Name outer/inner variables clearly (r/c or i/j). When debugging, print both indices — nested off-by-ones hide in the wrong loop.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Putting cout << endl (or print()) inside the inner loop when you meant once per row creates a tall column of single characters instead of a grid.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Nested loops = loop inside a loop.",
            "Outer often means rows; inner means columns.",
            "Total iterations multiply — start small when testing.",
          ],
        },
      ],
    },
  ],
};
