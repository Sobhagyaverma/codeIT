import type { LessonSection } from "../types";

export const OPERATORS_SECTION: LessonSection = {
  id: "operators",
  title: "Getting Used to Operators",
  subtitle:
    "Nine submodules — eight operator deep-dives with quizzes and practice, then a mixed problem set.",
  lessons: [
    {
      slug: "arithmetic-operators",
      order: 1,
      title: "Arithmetic Operators",
      estMinutes: 18,
      kind: "read+problem",
      linkedProblemIds: [87, 88, 89, 90, 91],
      teaser: "Add, subtract, multiply, divide, and remainder — especially integer division traps.",
      blocks: [
        {
          type: "intro",
          what: "Arithmetic operators (+ − * / %) combine numbers into new numbers.",
          why: "Almost every program calculates something — scores, prices, sizes, indices.",
          where: "Formulas, counters, averages, games, finance, and science code.",
        },
        {
          type: "analogy",
          caption: "Real-life analogy · Money",
          text: "A wallet: + deposits, − spends, * multiplies a tip rate, / splits a bill (whole coins only if you use integer division), % is coins left after equal split.",
        },
        { type: "heading", text: "The five operators" },
        {
          type: "list",
          items: [
            "+ addition",
            "− subtraction",
            "* multiplication",
            "/ division (watch integer vs float)",
            "% modulus (remainder)",
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: "Python 3: a / b is float division. Use a // b for floor division. a % b is remainder.",
            java: "Java: two ints with / drop the fraction toward zero. Use doubles for fractional results.",
            cpp: "C++: two ints with / drop the fraction toward zero. Use double for fractional results.",
          },
        },
        {
          type: "code",
          caption: "Quotient and remainder",
          code: {
            python: "a = int(input())\nb = int(input())\nprint(a // b)\nprint(a % b)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt();\n    int b = sc.nextInt();\n    System.out.println(a / b);\n    System.out.println(a % b);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a / b << endl;\n  cout << a % b << endl;\n  return 0;\n}",
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: "What prints for a=7, b=3 (integer division)?",
          code: {
            python: "print(7 // 3)\nprint(7 % 3)",
            java: "System.out.println(7 / 3);\nSystem.out.println(7 % 3);",
            cpp: "cout << 7 / 3 << endl;\ncout << 7 % 3 << endl;",
          },
          answer: "2 then 1 — three goes into seven twice, one left over.",
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: "Is 5 / 2 equal to 2.5 when both are ints in C++/Java?",
          code: {
            python: "print(5 / 2)   # float in Python 3\nprint(5 // 2)  # floor",
            java: "System.out.println(5 / 2);",
            cpp: "cout << 5 / 2 << endl;",
          },
          answer: "C++/Java print 2. Python / prints 2.5; // prints 2.",
        },
        {
          type: "mistakePair",
          note: "Expecting a fraction from integer division.",
          wrong: {
            python: "# Assuming this is always float — OK in Py3 for /\nx = 5 // 2  # this is 2, not 2.5",
            java: "int x = 5 / 2; // x is 2, not 2.5",
            cpp: "int x = 5 / 2; // x is 2, not 2.5",
          },
          correct: {
            python: "x = 5 / 2  # 2.5",
            java: "double x = 5 / 2.0; // 2.5",
            cpp: "double x = 5 / 2.0; // 2.5",
          },
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: "What is 10 % 4?",
              choices: ["2", "2.5", "0", "4"],
              answerIndex: 0,
              explanation: "4*2=8, remainder 2.",
            },
            {
              kind: "trueFalse",
              prompt: "In C++/Java, int a=5, b=2; then a/b is 2.",
              answer: true,
            },
            {
              kind: "predict",
              prompt: "Output of integer 9 / 2?",
              answer: "4",
            },
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Add Two Numbers", problemId: 87, difficulty: "EASY" },
            { title: "Area of Rectangle", problemId: 88, difficulty: "EASY" },
            { title: "Celsius to Fahrenheit", problemId: 89, difficulty: "EASY" },
            { title: "Average of Three Numbers", problemId: 90, difficulty: "EASY" },
            { title: "Simple Calculator", problemId: 91, difficulty: "EASY" },
          ],
        },
        {
          type: "keyTakeaways",
          items: [
            "+ − * / % are the core arithmetic ops.",
            "Integer / drops the fraction in C++/Java.",
            "% gives the remainder after division.",
          ],
        },
        {
          type: "bridge",
          nextTitle: "Assignment Operators",
          text: "Next you will store and update values in variables with = and += — the other half of every calculation.",
        },
      ],
    },
    {
      slug: "assignment-operators",
      order: 2,
      title: "Assignment Operators",
      estMinutes: 16,
      kind: "read+problem",
      linkedProblemIds: [92, 93, 94, 95],
      teaser: 'Store and update variables with =, +=, and friends.',
      blocks: [
        {
          type: "intro",
          what: 'Assignment puts a value into a variable. Compound forms update in place.',
          why: 'Programs need memory that changes over time — scores, balances, counters.',
          where: 'Loops, games, banking apps, and any stateful logic.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Bank account',
          text: 'Balance = 100. After += 20 the balance is 120. You did not invent a new account — you updated the same one.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            '= assign',
            '+= -= *= /= %=',
            '&= |= ^= (C++/Java bit compounds; not in Python)'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Python has = and arithmetic compounds (+= etc). It has no &= |= ^= for ints in the same everyday style as C++ — use x = x & mask.',
            java: 'Java supports = and compounds including &= |= ^=.',
            cpp: 'C++ supports = and compounds including &= |= ^=.',
          },
        },
        {
          type: "code",
          caption: 'Compound update chain',
          code: {
            python: 'x = int(input())\\nx += 2\\nx *= 3\\nprint(x)',
            java: 'import java.util.Scanner;\\n\\npublic class Main {\\n  public static void main(String[] args) {\\n    Scanner sc = new Scanner(System.in);\\n    int x = sc.nextInt();\\n    x += 2;\\n    x *= 3;\\n    System.out.println(x);\\n  }\\n}',
            cpp: '#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n  int x; cin >> x;\\n  x += 2; x *= 3;\\n  cout << x << endl;\\n  return 0;\\n}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: 'Start x=4. After x+=2 then x*=3, what is x?',
          code: {
            python: 'x = 4\\nx += 2\\nx *= 3\\nprint(x)',
            java: 'int x = 4; x += 2; x *= 3;',
            cpp: 'int x = 4; x += 2; x *= 3;',
          },
          answer: '18',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'Does = compare two values?',
          code: {
            python: '# = is assignment',
            java: '// = is assignment',
            cpp: '// = is assignment',
          },
          answer: 'No — == compares. = assigns.',
        },
        {
          type: "mistakePair",
          note: 'Using = inside an if condition in C++/Java.',
          wrong: {
            python: '# Python forbids assignment in if by default',
            java: 'if (x = 5) { /* assigns, often a bug */ }',
            cpp: 'if (x = 5) { /* assigns, often a bug */ }',
          },
          correct: {
            python: 'if x == 5:\\n    pass',
            java: 'if (x == 5) { }',
            cpp: 'if (x == 5) { }',
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Read compounds as \"take the old value, change it, store it back.\" Order of += then *= matters.",
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: 'x=10; x-=3; x is?',
              choices: ['7', '13', '30', '3'],
              answerIndex: 0,
            },
            {
              kind: "trueFalse",
              prompt: 'x += 1 means x = x + 1.',
              answer: true,
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Balance Deposit", problemId: 92, difficulty: "EASY" },
            { title: "Compound Chain", problemId: 93, difficulty: "EASY" },
            { title: "Scale Then Shrink", problemId: 94, difficulty: "EASY" },
            { title: "Assign vs Compare Trap", problemId: 95, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['= stores; compounds update in place.', 'Right side runs before the write.', 'Never confuse = with ==.'],
        },
        {
          type: "bridge",
          nextTitle: 'Comparison Operators',
          text: 'Next: ask true/false questions with == and < so programs can choose paths.',
        },
      ],
    },
    {
      slug: "comparison-operators",
      order: 3,
      title: "Comparison Operators",
      estMinutes: 15,
      kind: "read+problem",
      linkedProblemIds: [96, 97, 98, 99],
      teaser: 'Ask true/false questions with == != < > <= >=.',
      blocks: [
        {
          type: "intro",
          what: 'Comparisons return true or false.',
          why: 'Decisions need yes/no answers.',
          where: 'Ifs, loops, sorting keys, validation.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Exam marks',
          text: 'Is 85 >= 40? Yes — you passed. Comparisons are the questions; booleans are the answers.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            '== equal',
            '!= not equal',
            '< > <= >='
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Comparisons produce True/False. Chaining a < b < c works in Python.',
            java: 'Comparisons produce boolean. Do not write a < b < c — use &&.',
            cpp: 'Comparisons produce bool. Do not write a < b < c — use &&.',
          },
        },
        {
          type: "code",
          caption: 'Compare two numbers',
          code: {
            python: 'a=int(input()); b=int(input())\\nprint(\\"YES\\" if a>b else \\"NO\\")',
            java: 'import java.util.Scanner;\\npublic class Main {\\n  public static void main(String[] args) {\\n    Scanner sc=new Scanner(System.in);\\n    int a=sc.nextInt(), b=sc.nextInt();\\n    System.out.println(a>b?\\"YES\\":\\"NO\\");\\n  }\\n}',
            cpp: '#include <iostream>\\nusing namespace std;\\nint main(){int a,b;cin>>a>>b;cout<<(a>b?\\"YES\\":\\"NO\\")<<endl;}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: 'Is 3 == 3.0 true in these languages for ints/doubles carefully?',
          code: {
            python: 'print(3 == 3)',
            java: 'System.out.println(3 == 3);',
            cpp: 'cout << (3 == 3);',
          },
          answer: 'Yes for matching types here — true/True/1 style true.',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'What does != mean?',
          code: {
            python: 'print(1 != 2)',
            java: 'System.out.println(1 != 2);',
            cpp: 'cout << (1 != 2);',
          },
          answer: 'Not equal — true when values differ.',
        },
        {
          type: "mistakePair",
          note: 'Chaining comparisons incorrectly in C++/Java.',
          wrong: {
            python: '# a < b < c is OK in Python',
            java: 'if (a < b < c) { /* wrong meaning */ }',
            cpp: 'if (a < b < c) { /* wrong meaning */ }',
          },
          correct: {
            python: 'if a < b < c:\\n    pass',
            java: 'if (a < b && b < c) { }',
            cpp: 'if (a < b && b < c) { }',
          },
        },
        {
          type: "truthTable",
          caption: "Tiny truth table for ==",
          headers: ["a", "b", "a == b"],
          rows: [["3", "3", "true"], ["3", "4", "false"], ["0", "0", "true"]],
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: '5 < 5 is?',
              choices: ['true', 'false'],
              answerIndex: 1,
            },
            {
              kind: "trueFalse",
              prompt: '<= means less or equal.',
              answer: true,
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Largest of Two Numbers", problemId: 96, difficulty: "EASY" },
            { title: "Eligible to Vote", problemId: 97, difficulty: "EASY" },
            { title: "Compare Ages", problemId: 98, difficulty: "EASY" },
            { title: "Compare Marks", problemId: 99, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['Comparisons yield booleans.', '== / != for equality; < > <= >= for order.', 'Use && for between-checks in C++/Java.'],
        },
        {
          type: "bridge",
          nextTitle: 'Logical Operators',
          text: 'Next: combine several true/false answers with AND, OR, and NOT.',
        },
      ],
    },
    {
      slug: "logical-operators",
      order: 4,
      title: "Logical Operators",
      estMinutes: 16,
      kind: "read+problem",
      linkedProblemIds: [100, 101, 102],
      teaser: 'Combine conditions with AND, OR, NOT — and short-circuit.',
      blocks: [
        {
          type: "intro",
          what: 'Logical operators combine booleans.',
          why: 'Real decisions need multiple checks.',
          where: 'Login, eligibility, safety guards.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Security system',
          text: 'Door opens only if badge is valid AND pin is correct (AND). Alarm if window OR door trips (OR). NOT flips a sensor.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            'AND (&& / and)',
            'OR (|| / or)',
            'NOT (! / not)',
            'Short-circuit evaluation'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Use and, or, not. Short-circuit skips the right side when the answer is already known.',
            java: 'Use && || !. Short-circuit skips the right side when possible.',
            cpp: 'Use && || !. Short-circuit skips the right side when possible.',
          },
        },
        {
          type: "code",
          caption: 'Inclusive range with AND',
          code: {
            python: 'n=int(input())\\nprint(\\"OK\\" if 1<=n<=100 else \\"NO\\")',
            java: 'import java.util.Scanner;\\npublic class Main{public static void main(String[]a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();System.out.println(n>=1&&n<=100?\\"OK\\":\\"NO\\");}}',
            cpp: '#include <iostream>\\nusing namespace std;int main(){int n;cin>>n;cout<<(n>=1&&n<=100?\\"OK\\":\\"NO\\")<<endl;}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: 'True and False → ?',
          code: {
            python: 'print(True and False)',
            java: 'System.out.println(true && false);',
            cpp: 'cout << (true && false);',
          },
          answer: 'false',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'If left of && is false, is the right evaluated?',
          code: {
            python: '# short-circuit',
            java: '// short-circuit',
            cpp: '// short-circuit',
          },
          answer: 'No — short-circuit skips it.',
        },
        {
          type: "mistakePair",
          note: 'Mixing bitwise & with logical && for conditions.',
          wrong: {
            python: 'if flags & mask and ready:  # bit & is OK but know the difference',
            java: 'if (a & b) { /* bitwise, not boolean && */ }',
            cpp: 'if (a & b) { /* bitwise */ }',
          },
          correct: {
            python: 'if ready and allowed:\\n    pass',
            java: 'if (ready && allowed) { }',
            cpp: 'if (ready && allowed) { }',
          },
        },
        {
          type: "truthTable",
          caption: "AND / OR",
          headers: ["A", "B", "A AND B", "A OR B"],
          rows: [
            ["F", "F", "F", "F"],
            ["F", "T", "F", "T"],
            ["T", "F", "F", "T"],
            ["T", "T", "T", "T"],
          ],
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: 'NOT true is?',
              choices: ['true', 'false'],
              answerIndex: 1,
            },
            {
              kind: "trueFalse",
              prompt: 'OR is true if either side is true.',
              answer: true,
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Login Validation", problemId: 100, difficulty: "EASY" },
            { title: "ATM Withdrawal", problemId: 101, difficulty: "EASY" },
            { title: "Scholarship Eligibility", problemId: 102, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['AND needs both; OR needs one; NOT flips.', 'Short-circuit may skip work.', 'Use logical ops for conditions.'],
        },
        {
          type: "bridge",
          nextTitle: 'Bitwise Operators',
          text: 'Next: work on individual bits with & | ^ — different from && ||.',
        },
      ],
    },
    {
      slug: "bitwise-operators",
      order: 5,
      title: "Bitwise Operators",
      estMinutes: 18,
      kind: "read+problem",
      linkedProblemIds: [103, 104, 105],
      teaser: 'Bit manipulation with & | ^ ~ << — not the same as && ||.',
      blocks: [
        {
          type: "intro",
          what: 'Bitwise ops flip and combine bits of integers.',
          why: 'Flags, masks, and fast tricks use bits.',
          where: 'Graphics, protocols, compression, interviews.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Light switches',
          text: 'Each bit is a switch. & = both ON. | = either ON. ^ = exactly one ON. << slides the row left.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            '& AND',
            '| OR',
            '^ XOR',
            '~ NOT',
            '<< left shift (>> briefly)'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Python ints support & | ^ ~ << >>. ~n is -(n+1).',
            java: 'Java ints support & | ^ ~ << >>. Parenthesize when printing.',
            cpp: 'C++ ints support & | ^ ~ << >>. Parenthesize bit ops with cout.',
          },
        },
        {
          type: "code",
          caption: 'Bitwise AND',
          code: {
            python: 'print(12 & 10)',
            java: 'System.out.println(12 & 10);',
            cpp: 'cout << (12 & 10) << endl;',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: '12 & 10 equals?',
          code: {
            python: 'print(12 & 10)',
            java: 'System.out.println(12 & 10);',
            cpp: 'cout<<(12&10);',
          },
          answer: '8',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'Is n & 1 a parity check?',
          code: {
            python: 'print(7 & 1)',
            java: 'System.out.println(7 & 1);',
            cpp: 'cout<<(7&1);',
          },
          answer: 'Yes — 1 means odd.',
        },
        {
          type: "mistakePair",
          note: 'Confusing & with &&.',
          wrong: {
            python: 'if a & b:  # bitwise — may surprise',
            java: 'if (a && b) { } // logical — good for booleans',
            cpp: 'if (a & b) { } // bitwise',
          },
          correct: {
            python: 'if a and b:\\n    pass',
            java: 'if (ready && ok) { }',
            cpp: 'if (ready && ok) { }',
          },
        },
        {
          type: "expressionSteps",
          caption: "Binary view",
          expression: "12 & 10",
          steps: [
            "12 in binary is 1100",
            "10 in binary is 1010",
            "AND bit-by-bit → 1000",
            "1000 in decimal is 8",
          ],
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: '7 & 3?',
              choices: ['7', '3', '1', '0'],
              answerIndex: 1,
            },
            {
              kind: "predict",
              prompt: '1 << 3 equals?',
              answer: '8',
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Check Even/Odd", problemId: 103, difficulty: "EASY" },
            { title: "Toggle Bit", problemId: 104, difficulty: "EASY" },
            { title: "Count Set Bits", problemId: 105, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['Bitwise ≠ logical.', '& | ^ ~ << work on bits.', 'Parenthesize bit expressions in C++.'],
        },
        {
          type: "bridge",
          nextTitle: 'Increment & Decrement',
          text: 'Next: bump counters by one — and learn why ++i and i++ differ.',
        },
      ],
    },
    {
      slug: "increment-decrement",
      order: 6,
      title: "Increment & Decrement",
      estMinutes: 18,
      kind: "read+problem",
      linkedProblemIds: [106, 107, 108],
      teaser: "Pre vs post ++/-- — and Python's += 1 instead.",
      blocks: [
        {
          type: "intro",
          what: 'Increment/decrement change a value by one.',
          why: 'Loops and counters need a tiny bump.',
          where: 'for-loops, indexes, timers.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Ticket counter',
          text: "Pre-increment stamps the new number then hands it over. Post-increment hands today's number then bumps for tomorrow.",
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            '++i pre-increment',
            'i++ post-increment',
            '--i / i--',
            'Python: i += 1 / i -= 1 (no ++/-- )'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Python has no ++ or --. Always write i += 1 or i -= 1.',
            java: '++i returns new value; i++ returns old value then bumps.',
            cpp: '++i returns new value; i++ returns old value then bumps.',
          },
        },
        {
          type: "code",
          caption: 'Bump then print',
          code: {
            python: 'n=int(input())\\nn += 1\\nprint(n)',
            java: 'import java.util.Scanner;\\npublic class Main{public static void main(String[]a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();++n;System.out.println(n);}}',
            cpp: '#include <iostream>\\nusing namespace std;int main(){int n;cin>>n;++n;cout<<n<<endl;}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: 'After int i=5; int x=i++; what are x and i? (C++/Java)',
          code: {
            python: 'i=5\\nx=i\\ni+=1\\nprint(x,i)',
            java: 'int i=5; int x=i++;',
            cpp: 'int i=5; int x=i++;',
          },
          answer: 'x=5, i=6',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'After int i=5; int x=++i; ?',
          code: {
            python: 'i=5\\ni+=1\\nx=i\\nprint(x,i)',
            java: 'int i=5; int x=++i;',
            cpp: 'int i=5; int x=++i;',
          },
          answer: 'x=6, i=6',
        },
        {
          type: "mistakePair",
          note: 'Writing i++ in Python.',
          wrong: {
            python: 'i++  # SyntaxError',
            java: '/* fine in Java */',
            cpp: '/* fine in C++ */',
          },
          correct: {
            python: 'i += 1',
            java: 'i++;',
            cpp: 'i++;',
          },
        },
        {
          type: "stateTrace",
          caption: "Memory steps for post-increment idea",
          steps: [
            { label: "Start", state: "n = 5" },
            { label: "Capture", state: "a = 5 (old n)" },
            { label: "Bump", state: "n = 6" },
            { label: "Use", state: "a = a + n → 11" },
          ],
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "trueFalse",
              prompt: 'Python supports ++i.',
              answer: false,
            },
            {
              kind: "mcq",
              prompt: 'Pre-increment returns?',
              choices: ['old value', 'new value'],
              answerIndex: 1,
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Predict Output", problemId: 106, difficulty: "EASY" },
            { title: "Loop Counter", problemId: 107, difficulty: "EASY" },
            { title: "Bump Trace", problemId: 108, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['Pre returns new; post returns old.', 'Python uses += 1 / -= 1.', 'State traces clarify confusion.'],
        },
        {
          type: "bridge",
          nextTitle: 'Ternary Operator',
          text: 'Next: pick one of two values in a single expression.',
        },
      ],
    },
    {
      slug: "ternary-operator",
      order: 7,
      title: "Ternary Operator",
      estMinutes: 14,
      kind: "read+problem",
      linkedProblemIds: [109, 110, 111],
      teaser: "Pick one of two values: ?: or Python's if-else expression.",
      blocks: [
        {
          type: "intro",
          what: 'Conditional expression chooses a value without a full if block.',
          why: 'Short choices keep code compact.',
          where: 'Defaults, max/min, labels.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Vending machine',
          text: 'If you paid enough, dispense drink; else dispense nothing — one condition, two outcomes.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            'condition ? value1 : value2 (C++/Java)',
            'value1 if condition else value2 (Python)'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: 'Use a if cond else b — there is no ?:. ',
            java: 'Use cond ? a : b.',
            cpp: 'Use cond ? a : b.',
          },
        },
        {
          type: "code",
          caption: 'Max of two',
          code: {
            python: 'a=int(input());b=int(input())\\nprint(a if a>=b else b)',
            java: 'import java.util.Scanner;\\npublic class Main{public static void main(String[]a){Scanner sc=new Scanner(System.in);int x=sc.nextInt(),y=sc.nextInt();System.out.println(x>=y?x:y);}}',
            cpp: '#include <iostream>\\nusing namespace std;int main(){int a,b;cin>>a>>b;cout<<(a>=b?a:b)<<endl;}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: '3>=8?3:8 → ?',
          code: {
            python: 'print(3 if 3>=8 else 8)',
            java: 'System.out.println(3>=8?3:8);',
            cpp: 'cout<<(3>=8?3:8);',
          },
          answer: '8',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: 'Does Python have ?: ?',
          code: {
            python: '# no',
            java: '// yes',
            cpp: '// yes',
          },
          answer: 'No — use if-else expression.',
        },
        {
          type: "mistakePair",
          note: 'Inventing ?: in Python.',
          wrong: {
            python: 'x = a ? b : c  # invalid',
            java: '/* valid in Java */',
            cpp: '/* valid in C++ */',
          },
          correct: {
            python: 'x = b if a else c',
            java: 'x = a ? b : c;',
            cpp: 'x = a ? b : c;',
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Keep ternaries short. Nested ternaries are hard to read — prefer if/else when logic grows.",
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: 'Python ternary word order starts with?',
              choices: ['condition', 'true value', 'false value'],
              answerIndex: 1,
            },
            {
              kind: "predict",
              prompt: 'max via ternary of 2 and 9',
              answer: '9',
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Maximum of Two Numbers", problemId: 109, difficulty: "EASY" },
            { title: "Even/Odd", problemId: 110, difficulty: "EASY" },
            { title: "Grade Checker", problemId: 111, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['Ternary picks one of two values.', 'C++/Java: ?: · Python: if/else expr.', 'Avoid deep nesting.'],
        },
        {
          type: "bridge",
          nextTitle: 'Operator Precedence & Associativity',
          text: 'Next: learn which operator runs first when expressions get crowded.',
        },
      ],
    },
    {
      slug: "operator-precedence-and-associativity",
      order: 8,
      title: "Operator Precedence & Associativity",
      estMinutes: 16,
      kind: "read+problem",
      linkedProblemIds: [112, 113, 114],
      teaser: 'Who runs first — and left vs right when operators tie.',
      blocks: [
        {
          type: "intro",
          what: 'Precedence and associativity decide evaluation order.',
          why: 'Wrong order causes silent wrong answers.',
          where: 'Every non-trivial expression.',
        },
        {
          type: "analogy",
          caption: 'Real-life analogy · Cooking recipe',
          text: '\\"Mix flour and sugar, then add eggs\\" vs a vague list — parentheses are the commas that make order clear.',
        },
        { type: "heading", text: "Topics" },
        {
          type: "list",
          items: [
            'Precedence (* / before + -)',
            'Associativity (usually left-to-right)',
            'Parentheses always win'
          ],
        },
        {
          type: "langParagraph",
          text: {
            python: '* and / bind tighter than + and -. Use parentheses liberally.',
            java: 'Same idea — when unsure, parenthesize.',
            cpp: 'Same idea — when unsure, parenthesize. Bit shifts need care next to <<.',
          },
        },
        {
          type: "code",
          caption: 'Two evaluations',
          code: {
            python: 'a,b,c=map(int,input().split())\\nprint(a+b*c)\\nprint((a+b)*c)',
            java: 'import java.util.Scanner;\\npublic class Main{public static void main(String[]a){Scanner sc=new Scanner(System.in);int x=sc.nextInt(),y=sc.nextInt(),z=sc.nextInt();System.out.println(x+y*z);System.out.println((x+y)*z);}}',
            cpp: '#include <iostream>\\nusing namespace std;int main(){int a,b,c;cin>>a>>b>>c;cout<<a+b*c<<endl<<(a+b)*c<<endl;}',
          },
        },
        {
          type: "predictReveal",
          caption: "Interactive example 1",
          question: '2+3*4 = ?',
          code: {
            python: 'print(2+3*4)',
            java: 'System.out.println(2+3*4);',
            cpp: 'cout<<(2+3*4);',
          },
          answer: '14',
        },
        {
          type: "predictReveal",
          caption: "Interactive example 2",
          question: '(2+3)*4 = ?',
          code: {
            python: 'print((2+3)*4)',
            java: 'System.out.println((2+3)*4);',
            cpp: 'cout<<((2+3)*4);',
          },
          answer: '20',
        },
        {
          type: "mistakePair",
          note: 'Relying on memory of the full precedence table.',
          wrong: {
            python: 'x = a + b << 2  # hard to read',
            java: 'x = a + b << 2;',
            cpp: 'x = a + b << 2;',
          },
          correct: {
            python: 'x = (a + b) << 2',
            java: 'x = (a + b) << 2;',
            cpp: 'x = (a + b) << 2;',
          },
        },
        {
          type: "expressionSteps",
          caption: "Expression tree (text)",
          expression: "a + b * c",
          steps: [
            "First evaluate b * c (higher precedence)",
            "Then add a",
            "Tree: + ( a , * ( b , c ) )",
          ],
        },
        {
          type: "quiz",
          caption: "Quick quiz",
          questions: [
            {
              kind: "mcq",
              prompt: 'Which runs first in a-b*c?',
              choices: ['-', '*'],
              answerIndex: 1,
            },
            {
              kind: "trueFalse",
              prompt: 'Parentheses override precedence.',
              answer: true,
            }
          ],
        },
        {
          type: "practiceList",
          caption: "Practice problems",
          items: [
            { title: "Eval Without Parens", problemId: 112, difficulty: "EASY" },
            { title: "Force With Parens", problemId: 113, difficulty: "EASY" },
            { title: "Associativity Trace", problemId: 114, difficulty: "EASY" }
          ],
        },
        {
          type: "keyTakeaways",
          items: ['* / before + -.', 'Associativity breaks ties.', 'Parentheses document intent.'],
        },
        {
          type: "bridge",
          nextTitle: 'Mixed Operator Problems',
          text: 'Finally: practice problems that combine several operator kinds — no new theory.',
        },
      ],
    },
    {
      slug: "mixed-operator-problems",
      order: 9,
      title: "Mixed Operator Problems",
      estMinutes: 40,
      kind: "solve",
      linkedProblemIds: [115, 116, 117, 118, 119, 120],
      teaser: "No theory — only problems that mix operator types. Easy → Easy-Medium → Medium.",
      blocks: [
        {
          type: "practiceList",
          caption: "Mixed set (Easy → Medium)",
          items: [
            { title: "Even Split or Fail", problemId: 115, difficulty: "EASY" },
            { title: "Budget After Updates", problemId: 116, difficulty: "EASY" },
            { title: "Ordered Triple Check", problemId: 117, difficulty: "EASY-MEDIUM" },
            { title: "Safe Divide Gate", problemId: 118, difficulty: "EASY-MEDIUM" },
            { title: "Mask Then Pick", problemId: 119, difficulty: "MEDIUM" },
            { title: "Star or Paren Race", problemId: 120, difficulty: "MEDIUM" },
          ],
        },
      ],
    },
  ],
};
