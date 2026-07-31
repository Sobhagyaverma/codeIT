import type { LessonSection } from "../types";

export const PATTERN_BASICS_SECTION: LessonSection = {
  id: "pattern-basics",
  title: "Pattern Basics",
  subtitle:
    "Learn how nested loops draw shapes — stars, numbers, and spaces — before tackling Pattern Problems.",
  lessons: [
    {
      slug: "why-patterns-feel-scary",
      order: 1,
      title: "Why patterns feel scary",
      estMinutes: 6,
      kind: "read",
      teaser: "They're not magic art — they're loops with a plan.",
      blocks: [
        {
          type: "hook",
          text: "Pattern problems look like someone asked you to paint a cathedral with a for-loop. Beginners freeze. Pros see rows, columns, and a rule.",
        },
        {
          type: "paragraph",
          text: "Almost every star pyramid is the same idea: outer loop = rows, inner loop = what to print on this row. Once you own that split, the \"scary\" shapes become small recipes.",
        },
        {
          type: "analogy",
          text: "Like knitting: one row of stitches, then the next. You don't invent the whole sweater at once — you repeat a row pattern.",
        },
        {
          type: "heading",
          text: "What you'll practice next",
        },
        {
          type: "list",
          items: [
            "Print a single line of characters",
            "Print numbers in a line",
            "Grow patterns horizontally and vertically",
            "Use nested loops for 2D shapes",
            "Place spaces on purpose",
            "Let row index decide how many symbols to print",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Always dry-run on paper for n = 3 before coding. If you can fill the grid by hand, the loops will follow.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Don't memorize 50 shapes. Memorize the row/column thinking — then adapt.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Patterns = nested loops + a rule per row.",
            "Outer loop walks rows; inner loop builds one row.",
            "Sketch n=3 before you type.",
          ],
        },
      ],
    },
    {
      slug: "printing-a-line",
      order: 2,
      title: "Printing a line",
      estMinutes: 7,
      kind: "read+problem",
      linkedProblemId: 80,
      teaser: "Repeat one character n times on a single line.",
      blocks: [
        {
          type: "hook",
          text: "Before pyramids, master one brick: print the same character several times, then a newline.",
        },
        {
          type: "paragraph",
          text: "A loop from 1 to n (or 0 to n-1) that prints '*' without a newline builds one row. After the loop, print a newline to finish the line.",
        },
        {
          type: "analogy",
          text: "Like laying n tiles in a straight hallway — one after another — then stepping to the next floor.",
        },
        {
          type: "heading",
          text: "n stars on one line",
        },
        {
          type: "code",
          caption: "Print n asterisks, then newline",
          code: {
            python: 'n = int(input())\nprint("*" * n)',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 0; i < n; i++) {\n      System.out.print("*");\n    }\n    System.out.println();\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 0; i < n; i++) {\n    cout << "*";\n  }\n  cout << endl;\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3", output: "***" },
            { label: "n = 5", output: "*****" },
          ],
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Using println/print with a newline inside the loop creates a column of single stars instead of one row.",
        },
        {
          type: "keyTakeaways",
          items: [
            "print without newline builds a row.",
            "One newline after the loop ends the row.",
            "Python's '*' * n is the same idea as a loop.",
          ],
        },
      ],
    },
    {
      slug: "printing-numbers",
      order: 3,
      title: "Printing numbers",
      estMinutes: 7,
      kind: "read+problem",
      linkedProblemId: 81,
      teaser: "Same loop idea — but the character is a digit that may change.",
      blocks: [
        {
          type: "hook",
          text: "Stars are one symbol. Numbers are a sequence. The loop still walks positions; only what you print changes.",
        },
        {
          type: "paragraph",
          text: "To print 1 2 3 … n on one line (space-separated), loop i from 1 to n and print i. Watch spacing — trailing spaces often fail judges.",
        },
        {
          type: "analogy",
          text: "Numbering seats in a theater row: seat 1, seat 2, seat 3… same walk, different label each time.",
        },
        {
          type: "heading",
          text: "Count across one row",
        },
        {
          type: "code",
          caption: "Print 1..n separated by spaces",
          code: {
            python:
              'n = int(input())\nprint(*range(1, n + 1))',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      System.out.print(i);\n      if (i < n) System.out.print(" ");\n    }\n    System.out.println();\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    cout << i;\n    if (i < n) cout << " ";\n  }\n  cout << endl;\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3", output: "1 2 3" },
            { label: "n = 5", output: "1 2 3 4 5" },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Prefer \"print space only between numbers\" over \"space after every number\" — trailing spaces break many checkers.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Mixing up 0-based loop counters with 1-based printed values is a classic off-by-one for number patterns.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Number rows still use one loop.",
            "Control spaces carefully.",
            "Decide whether values are 1..n or 0..n-1.",
          ],
        },
      ],
    },
    {
      slug: "horizontal-patterns",
      order: 4,
      title: "Horizontal patterns",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 82,
      teaser: "Grow or shrink width — still one row at a time, but length changes.",
      blocks: [
        {
          type: "hook",
          text: "A triangle pointing sideways is just: row 1 has 1 star, row 2 has 2, … row n has n. Horizontal growth, vertical stacking.",
        },
        {
          type: "paragraph",
          text: "Outer loop i = 1..n. Inner loop prints i stars. That's a right triangle of '*'. Same skeleton powers many \"easy\" patterns.",
        },
        {
          type: "analogy",
          text: "Building a staircase of books: shelf 1 holds 1 book, shelf 2 holds 2… each shelf is wider.",
        },
        {
          type: "heading",
          text: "Growing star rows",
        },
        {
          type: "code",
          caption: "Right triangle of stars",
          code: {
            python:
              'n = int(input())\nfor i in range(1, n + 1):\n    print("*" * i)',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      for (int j = 0; j < i; j++) {\n        System.out.print("*");\n      }\n      System.out.println();\n    }\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    for (int j = 0; j < i; j++) {\n      cout << "*";\n    }\n    cout << endl;\n  }\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3", output: "*\n**\n***" },
            { label: "n = 5", output: "*\n**\n***\n****\n*****" },
          ],
        },
        {
          type: "callout",
          tone: "mistake",
          text: "If both loops run to n always, you get a solid rectangle — not a triangle. The inner bound must depend on the outer index.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Horizontal growth = inner count depends on row.",
            "Outer loop still means \"next line.\"",
            "Invert the count (n down to 1) for upside-down triangles.",
          ],
        },
      ],
    },
    {
      slug: "vertical-patterns",
      order: 5,
      title: "Vertical patterns",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 83,
      teaser: "Same width every row — height is what changes.",
      blocks: [
        {
          type: "hook",
          text: "A solid square is the calm cousin of triangles: every row prints exactly n stars. Vertical stacking, fixed width.",
        },
        {
          type: "paragraph",
          text: "Outer loop n times; each inner loop also n times. Result: n lines of n characters. Hollow shapes later only change which positions print a star vs a space.",
        },
        {
          type: "analogy",
          text: "A window screen: every row has the same number of holes. You just stack identical rows.",
        },
        {
          type: "heading",
          text: "n × n star square",
        },
        {
          type: "code",
          caption: "Solid square",
          code: {
            python:
              'n = int(input())\nfor _ in range(n):\n    print("*" * n)',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 0; i < n; i++) {\n      for (int j = 0; j < n; j++) {\n        System.out.print("*");\n      }\n      System.out.println();\n    }\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n      cout << "*";\n    }\n    cout << endl;\n  }\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3", output: "***\n***\n***" },
            { label: "n = 5", output: "*****\n*****\n*****\n*****\n*****" },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "When debugging, print row and column indices temporarily — vertical vs horizontal bugs show up immediately.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Putting the newline inside the inner loop turns a square into a tall column of single characters.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Fixed-width rows + n rows = rectangle/square.",
            "Newline once per outer iteration.",
            "Hollow versions later: print space in the middle.",
          ],
        },
      ],
    },
    {
      slug: "nested-loops-for-shapes",
      order: 6,
      title: "Nested loops for shapes",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 84,
      teaser: "Two loops, one job each — rows outside, cells inside.",
      blocks: [
        {
          type: "hook",
          text: "If you only remember one pattern mantra: outer = which row, inner = what goes in this row. Everything else is details.",
        },
        {
          type: "paragraph",
          text: "Nested loops multiply work: for each of n rows, you may do up to n prints. That's why n≤20 is common — O(n²) characters is fine; O(n³) starts to hurt.",
        },
        {
          type: "analogy",
          text: "A spreadsheet: rows down the side, columns across. Nested loops visit every cell.",
        },
        {
          type: "heading",
          text: "Name your indices",
        },
        {
          type: "code",
          caption: "i = row, j = column",
          code: {
            python:
              'n = int(input())\nfor i in range(n):\n    for j in range(n):\n        print("*", end="")\n    print()',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 0; i < n; i++) {\n      for (int j = 0; j < n; j++) {\n        System.out.print("*");\n      }\n      System.out.println();\n    }\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n      cout << "*";\n    }\n    cout << endl;\n  }\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3 · stars", output: "***\n***\n***" },
            { label: "n = 3 · column numbers", output: "1 2 3\n1 2 3\n1 2 3" },
          ],
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Reusing the same variable for both loops (or forgetting braces) merges loops and produces garbage shapes.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Outer → rows; inner → columns/cells.",
            "Total prints often ≈ rows × cols.",
            "Clear names (i/j or r/c) prevent mix-ups.",
          ],
        },
      ],
    },
    {
      slug: "using-spaces-on-purpose",
      order: 7,
      title: "Using spaces on purpose",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 85,
      teaser: "Leading spaces push shapes right — they're real characters, not decoration.",
      blocks: [
        {
          type: "hook",
          text: "Right-aligned triangles aren't magic. They're spaces first, then stars. Judges count every space.",
        },
        {
          type: "paragraph",
          text: "For a right-aligned star triangle of size n: on row i (1..n), print (n-i) spaces, then i stars. Two inner loops (or one string of spaces + stars) keep it clear.",
        },
        {
          type: "analogy",
          text: "Indentation in code: blank characters push the visible text to the right. Same here.",
        },
        {
          type: "heading",
          text: "Spaces then stars",
        },
        {
          type: "code",
          caption: "Right-aligned triangle",
          code: {
            python:
              'n = int(input())\nfor i in range(1, n + 1):\n    print(" " * (n - i) + "*" * i)',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      for (int s = 0; s < n - i; s++) System.out.print(" ");\n      for (int j = 0; j < i; j++) System.out.print("*");\n      System.out.println();\n    }\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    for (int s = 0; s < n - i; s++) cout << " ";\n    for (int j = 0; j < i; j++) cout << "*";\n    cout << endl;\n  }\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see (spaces are real)",
          samples: [
            { label: "n = 3", output: "  *\n **\n***" },
            { label: "n = 5", output: "    *\n   **\n  ***\n ****\n*****" },
          ],
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Trailing spaces after stars usually don't matter for left-aligned shapes — but leading spaces for alignment always matter. Match the sample exactly.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Spaces are printed characters.",
            "Alignment = spaces + symbols.",
            "Compare your output to samples character-by-character.",
          ],
        },
      ],
    },
    {
      slug: "rows-that-depend-on-i",
      order: 8,
      title: "Rows that depend on i",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 86,
      teaser: "The row index is the recipe — stars, numbers, or both.",
      blocks: [
        {
          type: "hook",
          text: "Once row i decides the count (or the digit), you've unlocked most beginner patterns: triangles, number pyramids, staircases.",
        },
        {
          type: "paragraph",
          text: "Classic number triangle: row i prints 1..i. Same nested structure as the star triangle — only the printed value is the column index (or a fixed digit per row).",
        },
        {
          type: "analogy",
          text: "A seating chart where row 3 always has seats 1, 2, 3. The row number tells you how far to count.",
        },
        {
          type: "heading",
          text: "Number triangle",
        },
        {
          type: "code",
          caption: "Row i prints 1..i",
          code: {
            python:
              'n = int(input())\nfor i in range(1, n + 1):\n    print(*range(1, i + 1))',
            java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    for (int i = 1; i <= n; i++) {\n      for (int j = 1; j <= i; j++) {\n        System.out.print(j);\n        if (j < i) System.out.print(" ");\n      }\n      System.out.println();\n    }\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  for (int i = 1; i <= n; i++) {\n    for (int j = 1; j <= i; j++) {\n      cout << j;\n      if (j < i) cout << " ";\n    }\n    cout << endl;\n  }\n  return 0;\n}',
          },
        },
        {
          type: "outputPattern",
          caption: "What you should see",
          samples: [
            { label: "n = 3", output: "1\n1 2\n1 2 3" },
            { label: "n = 5", output: "1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5" },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Ask: does this row's length depend on i? Does the symbol depend on i, j, or both? Answer those two questions before coding.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Printing the row index i on every column when you meant the column index j (or vice versa) is the #1 number-pattern bug.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Row index i drives length and often values.",
            "Column index j is what you print in many triangles.",
            "You're ready for Pattern Problems Easy → Hard.",
          ],
        },
      ],
    },
  ],
};
