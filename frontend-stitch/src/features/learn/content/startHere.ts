import type { LessonSection } from "../types";

export const START_HERE_SECTION: LessonSection = {
  id: "start-here",
  title: "Start Here",
  subtitle:
    "Absolute beginner track — learn what programming is, then write your first real programs in C++, Java, or Python.",
  lessons: [
    {
      slug: "what-is-programming",
      order: 1,
      title: "What is programming?",
      estMinutes: 6,
      kind: "read",
      teaser: "Computers only know on and off — programming is how we talk to them.",
      blocks: [
        {
          type: "hook",
          text: "Your device doesn't understand English, Python, or Java. It only knows on and off. Programming is how we turn that into useful work.",
        },
        {
          type: "paragraph",
          text: "You write exact steps. The computer follows them — same way, every time. It never guesses what you meant.",
        },
        {
          type: "analogy",
          text: "Like a recipe: humans get \"a pinch of salt.\" Computers need \"exactly 2 grams.\"",
        },
        {
          type: "heading",
          text: "A tiny program",
        },
        {
          type: "paragraph",
          text: "Same job in three languages — print a greeting. Don't memorize yet; just notice the spelling differs, the goal doesn't.",
        },
        {
          type: "code",
          caption: "Print a greeting",
          code: {
            python: 'print("Hello, world!")',
            java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, world!" << endl;\n  return 0;\n}',
          },
        },
        {
          type: "callout",
          tone: "fun-fact",
          text: "\"Hello, world!\" is a tradition. Almost every programmer's first program prints some version of that phrase.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Don't try to memorize every keyword. Pros look things up. Focus on thinking in clear steps.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Computers follow exact instructions only.",
            "A program is a step-by-step recipe in a language.",
            "Same idea, different spelling across languages.",
          ],
        },
      ],
    },
    {
      slug: "how-computers-execute-code",
      order: 2,
      title: "How computers execute code",
      estMinutes: 7,
      kind: "read",
      teaser: "Your code becomes machine instructions — one step at a time, top to bottom.",
      blocks: [
        {
          type: "hook",
          text: "Your code is not magic ink. It's more like sheet music — silent until something plays it. That \"something\" is the computer running your program, one instruction after another.",
        },
        {
          type: "paragraph",
          text: "When you hit Run, your source code gets translated into a form the machine can execute. Some languages compile first (C++, Java). Others interpret as they go (Python). Either way, the machine ends up doing a sequence of tiny actions.",
        },
        {
          type: "analogy",
          text: "Imagine a GPS reading turn-by-turn directions. It doesn't skip to the destination and invent the route. It does step 1, then step 2, then step 3. Programs work the same way — top to bottom, unless you later learn tools that jump around on purpose (loops, functions, conditions).",
        },
        {
          type: "heading",
          text: "A program with two steps",
        },
        {
          type: "paragraph",
          text: "This prints two lines. The second line never runs before the first. Order matters.",
        },
        {
          type: "code",
          caption: "Two instructions in order",
          code: {
            python: 'print("Step 1")\nprint("Step 2")',
            java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Step 1");\n    System.out.println("Step 2");\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Step 1" << endl;\n  cout << "Step 2" << endl;\n  return 0;\n}',
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "When something breaks, read your code like the computer does: line by line from the top. Ask \"what is true right now?\" after each line.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "A classic beginner trip-up: assuming the computer \"knows what you meant\" if one line is wrong. One missing quote or semicolon can stop the whole program — the machine won't shrug and continue.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Running a program means converting your code into machine-executable steps.",
            "Execution is usually top to bottom, one instruction at a time.",
            "Order matters — later lines see the results of earlier ones.",
            "Debugging starts by following the same path the computer takes.",
          ],
        },
      ],
    },
    {
      slug: "hello-world",
      order: 3,
      title: "Hello, world!",
      estMinutes: 12,
      kind: "read+problem",
      linkedProblemId: 32,
      teaser:
        "Your first real program — and a word-by-word tour of the syntax in C++, Java, or Python.",
      blocks: [
        {
          type: "hook",
          text: "Before you read input or invent variables, you need one superpower: make the computer say something. \"Hello, world!\" is that first handshake.",
        },
        {
          type: "paragraph",
          text: "This lesson is a slow walk through one tiny program. Switch the language picker — the code and the word-by-word glossary both change. Don't skim. Every symbol is there for a reason.",
        },
        {
          type: "analogy",
          text: "Learning \"Hello, world!\" is like learning to say \"hi\" in a new country. Same friendly intent — totally different spelling and grammar in each language.",
        },
        {
          type: "heading",
          text: "The program",
        },
        {
          type: "langParagraph",
          text: {
            python:
              "Python keeps Hello World tiny. One function call, one string, done. Use the glossary below to learn what each piece means.",
            java: "Java needs a class and a main method before it will run anything. That looks like ceremony at first — the glossary unpacks every keyword.",
            cpp: "C++ pulls in a library for printing, names a main function as the entry point, then streams text to the screen. Every token below matters.",
          },
        },
        {
          type: "code",
          caption: "Print Hello, world!",
          code: {
            python: 'print("Hello, world!")',
            java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, world!" << endl;\n  return 0;\n}',
          },
        },
        {
          type: "heading",
          text: "Word-by-word syntax",
        },
        {
          type: "langParagraph",
          text: {
            python:
              "Read this list top to bottom while looking at the Python line above. By the end, nothing on that line should feel mysterious.",
            java: "Read this list top to bottom while looking at the Java program above. Class, main, System.out.println — each piece earns its place.",
            cpp: "Read this list top to bottom while looking at the C++ program above. Includes, main, cout, endl — none of it is decoration.",
          },
        },
        {
          type: "syntaxWords",
          caption: "Syntax glossary (changes with language)",
          words: {
            python: [
              {
                term: "print",
                meaning:
                  "A built-in function. Its job is to send text (or other values) to the screen / output.",
              },
              {
                term: "(",
                meaning:
                  "Opens the function call. Everything until the matching ) is input to print.",
              },
              {
                term: '"Hello, world!"',
                meaning:
                  "A string literal — text data. The double quotes mark the start and end of the text. The characters inside are what get printed.",
              },
              {
                term: "Hello, world!",
                meaning:
                  "The actual message. Letters, comma, space, and exclamation mark are all part of the string.",
              },
              {
                term: ")",
                meaning:
                  "Closes the function call. Together, print(...) means: run print with this argument.",
              },
              {
                term: "(end of line)",
                meaning:
                  "Python usually does not need a semicolon here. The newline ends the statement.",
              },
            ],
            java: [
              {
                term: "public",
                meaning:
                  "An access modifier. On the class, it means other parts of the program can see this class. On main, it means the runtime is allowed to call it.",
              },
              {
                term: "class",
                meaning:
                  "Declares a class — a named blueprint / container for code in Java. Almost all Java code lives inside a class.",
              },
              {
                term: "Main",
                meaning:
                  "The class name. By convention it matches the file name (Main.java). You could name it something else, but beginners usually keep Main.",
              },
              {
                term: "{ ... }",
                meaning:
                  "Curly braces define a block — the body of the class or method. What sits between { and } belongs to that class or method.",
              },
              {
                term: "public static void main",
                meaning:
                  "The standard entry point signature. The Java Virtual Machine looks for this exact shape to know where to start running.",
              },
              {
                term: "static",
                meaning:
                  "Means main belongs to the class itself, not to one object instance. The JVM can call it without creating a Main object first.",
              },
              {
                term: "void",
                meaning:
                  "Return type. void means main does not return a value to its caller.",
              },
              {
                term: "main",
                meaning:
                  "The method name. Special only because the JVM looks for this name as the starting method.",
              },
              {
                term: "String[] args",
                meaning:
                  "Parameter list. String[] is an array of text values; args holds command-line arguments. Even if you ignore them, the signature usually keeps them.",
              },
              {
                term: "String",
                meaning:
                  "Java's type for text. Each command-line argument is one String.",
              },
              {
                term: "[]",
                meaning:
                  "Array notation — more than one String can be passed in.",
              },
              {
                term: "args",
                meaning:
                  "The parameter name (short for arguments). You choose the name; args is the usual convention.",
              },
              {
                term: "System",
                meaning:
                  "A built-in class that talks to the environment (including standard output).",
              },
              {
                term: ".",
                meaning:
                  "The dot operator. It means \"look inside\" — System.out is the out field of System.",
              },
              {
                term: "out",
                meaning:
                  "The standard output stream — usually the console where text appears.",
              },
              {
                term: "println",
                meaning:
                  "A method on out that prints its argument, then moves to a new line (print + line).",
              },
              {
                term: '("Hello, world!")',
                meaning:
                  "Argument to println: a String literal. Quotes wrap the text; Hello, world! is what appears on screen.",
              },
              {
                term: ";",
                meaning:
                  "Ends the statement. In Java, most statements need a semicolon or the compiler complains.",
              },
            ],
            cpp: [
              {
                term: "#include",
                meaning:
                  "A preprocessor directive. It pastes another file's declarations into yours before compiling.",
              },
              {
                term: "<iostream>",
                meaning:
                  "The header for input/output streams. You need it to use cout and endl for console printing.",
              },
              {
                term: "using namespace std;",
                meaning:
                  "Lets you write cout instead of std::cout. std is the standard library's namespace — a named scope that avoids name clashes.",
              },
              {
                term: "using",
                meaning:
                  "Keyword that brings names from a namespace into the current scope.",
              },
              {
                term: "namespace",
                meaning:
                  "A named region for identifiers. The C++ standard library lives in namespace std.",
              },
              {
                term: "std",
                meaning:
                  "Short for standard. Home of cout, endl, string, and much more.",
              },
              {
                term: ";",
                meaning:
                  "Ends a statement (and also ends the using-directive line).",
              },
              {
                term: "int",
                meaning:
                  "Return type of main. main returns an integer status code to the operating system (0 usually means success).",
              },
              {
                term: "main",
                meaning:
                  "The entry point function. When you run the program, execution starts inside main.",
              },
              {
                term: "()",
                meaning:
                  "Empty parameter list — this main takes no arguments. (There is also a form that accepts command-line args.)",
              },
              {
                term: "{ ... }",
                meaning:
                  "Function body. Statements between the braces run when main runs.",
              },
              {
                term: "cout",
                meaning:
                  "Character output stream (see-out). Writing to cout sends text to the console.",
              },
              {
                term: "<<",
                meaning:
                  "Stream insertion operator. Think \"send this into the stream\": cout << value.",
              },
              {
                term: '"Hello, world!"',
                meaning:
                  "A string literal — quoted text to print. The quotes are not printed; the characters inside are.",
              },
              {
                term: "endl",
                meaning:
                  "End line — prints a newline and flushes the stream so output shows up promptly.",
              },
              {
                term: "return 0;",
                meaning:
                  "Leaves main and reports success (0) to the OS. In modern C++ you can sometimes omit it in main, but writing it is clear for beginners.",
              },
              {
                term: "0",
                meaning:
                  "The exit code. By convention, 0 = OK; non-zero often means an error.",
              },
            ],
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Flip C++ / Java / Python and re-read the glossary each time. Same goal — different grammar. That comparison is the whole point of this lesson.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Copying Hello World from another language without matching quotes, braces, or semicolons. Python is picky about indentation; Java and C++ are picky about { } and ; — mixing the rules breaks the program.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Hello World proves your toolchain can compile/run and print.",
            "Every keyword and symbol in the starter program has a job — none are random.",
            "Python is short; Java and C++ need an explicit entry point (main).",
            "Use the language picker and glossary together until the syntax feels familiar.",
          ],
        },
      ],
    },
    {
      slug: "input-and-output",
      order: 4,
      title: "Input and output",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 33,
      teaser: "Talk to the program — read values in, print results out.",
      blocks: [
        {
          type: "hook",
          text: "A program that never listens and never speaks is a locked diary. Input is how the outside world talks to your code. Output is how your code talks back.",
        },
        {
          type: "paragraph",
          text: "On CodeIT, input usually arrives as text from the judge (stdin). Your program reads it, does work, then prints the answer (stdout). Matching the expected output exactly — spaces and newlines included — is part of the job.",
        },
        {
          type: "analogy",
          text: "Think of a coffee shop. The customer's order is input. The drink they receive is output. If they ask for a latte and you hand them a muffin, you \"failed the test case\" — even if the muffin was delicious.",
        },
        {
          type: "heading",
          text: "Read a number, print it back",
        },
        {
          type: "paragraph",
          text: "Here's a minimal echo: read one integer, print the same integer. Switch languages with the picker to see how I/O looks in each.",
        },
        {
          type: "code",
          caption: "Echo one integer",
          code: {
            python: "n = int(input())\nprint(n)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    System.out.println(n);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n  cout << n << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "Always check the problem statement for the exact output format. Extra spaces or a missing newline can turn a correct idea into a Wrong Answer.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Beginners often print friendly messages like \"Enter a number:\" in judged problems. Don't. The judge only compares your output to the expected answer — prompts usually break the match.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Input = data coming into your program; output = what you print.",
            "On this platform, think stdin in and stdout out.",
            "Output must match the expected format exactly.",
            "Skip chatty prompts in competitive / judged problems.",
          ],
        },
      ],
    },
    {
      slug: "variables",
      order: 5,
      title: "Variables",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 34,
      teaser: "Named boxes that hold values you can reuse and change.",
      blocks: [
        {
          type: "hook",
          text: "If you had to recalculate your age every time you mentioned it, you'd go crazy. Variables exist so you can name a value once and reuse it — like putting a sticky label on a box.",
        },
        {
          type: "paragraph",
          text: "A variable is a named place in memory that holds a value. You can read it, print it, and (usually) change it later. Good names make programs readable: score is better than x.",
        },
        {
          type: "analogy",
          text: "A locker at the gym has a number (the name) and stuff inside (the value). You can replace what's inside without changing the locker number. Same idea: the variable name stays; the value can change.",
        },
        {
          type: "heading",
          text: "Store and print a value",
        },
        {
          type: "paragraph",
          text: "We create a variable called lives with value 3, then print it.",
        },
        {
          type: "code",
          caption: "Create and use a variable",
          code: {
            python: "lives = 3\nprint(lives)",
            java: "public class Main {\n  public static void main(String[] args) {\n    int lives = 3;\n    System.out.println(lives);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int lives = 3;\n  cout << lives << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "fun-fact",
          text: "In Python you often don't write the type. In Java and C++ you usually declare it (int, double, …). Same idea — a labeled box — different paperwork.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Using a variable before you create it (or misspelling the name) is a top beginner crash. The computer doesn't know \"livess\" if you only defined \"lives.\"",
        },
        {
          type: "keyTakeaways",
          items: [
            "A variable is a named container for a value.",
            "You can reuse and update that value through the name.",
            "Clear names beat clever one-letter puzzles.",
            "Create (declare/assign) before you use — spelling must match exactly.",
          ],
        },
      ],
    },
    {
      slug: "data-types",
      order: 6,
      title: "Data types",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 35,
      teaser: "Numbers, text, true/false — different kinds of values play by different rules.",
      blocks: [
        {
          type: "hook",
          text: "You wouldn't add your phone number to your shoe size and expect a meaningful result. Data types exist because values come in different flavors — and each flavor has rules.",
        },
        {
          type: "paragraph",
          text: "Common starter types: whole numbers (integers), decimals (floating point), text (strings), and true/false (booleans). The type tells the computer how to store the value and which operations make sense.",
        },
        {
          type: "analogy",
          text: "Kitchen containers: a bottle holds liquid, a jar holds jam, a box holds cereal. Pour cereal into a bottle-shaped plan and you'll make a mess. Types are the container shapes for your data.",
        },
        {
          type: "heading",
          text: "A few everyday types",
        },
        {
          type: "paragraph",
          text: "Watch how each language spells integer, decimal, text, and boolean. The ideas match even when the keywords don't.",
        },
        {
          type: "code",
          caption: "Integer, decimal, string, boolean",
          code: {
            python: 'age = 18\nheight = 1.75\nname = "Ada"\nready = True\nprint(age, height, name, ready)',
            java: 'public class Main {\n  public static void main(String[] args) {\n    int age = 18;\n    double height = 1.75;\n    String name = "Ada";\n    boolean ready = true;\n    System.out.println(age + " " + height + " " + name + " " + ready);\n  }\n}',
            cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  int age = 18;\n  double height = 1.75;\n  string name = "Ada";\n  bool ready = true;\n  cout << age << " " << height << " " << name << " " << ready << endl;\n  return 0;\n}',
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "If a problem says \"print an integer,\" don't print 3.0 unless it asks for a decimal. Match the type the problem expects.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Mixing text and numbers by accident — like trying to do math on \"12\" as if it were already a number without converting — confuses beginners constantly. Know whether you're holding text or a real number.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Types describe what kind of value you have (number, text, true/false, …).",
            "Operations depend on type — you add numbers; you join strings.",
            "Languages spell types differently; the concepts transfer.",
            "Read the problem: it usually tells you what type of answer to print.",
          ],
        },
      ],
    },
    {
      slug: "operators",
      order: 7,
      title: "Operators",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 36,
      teaser: "Symbols that calculate, compare, and combine values.",
      blocks: [
        {
          type: "hook",
          text: "Operators are the verbs of code. Without +, -, *, and friends, variables just sit there looking pretty. Operators make them do work.",
        },
        {
          type: "paragraph",
          text: "Arithmetic operators: + - * / and remainder (%). Comparison operators: == != < > <= >= — they ask yes/no questions. You'll use both constantly in every language.",
        },
        {
          type: "analogy",
          text: "A calculator's buttons are operators. The numbers you type are values. Pressing + between 2 and 3 is exactly what code does — apply a rule to one or two values and get a result.",
        },
        {
          type: "heading",
          text: "Math and a comparison",
        },
        {
          type: "paragraph",
          text: "Compute a sum, then check whether a score beats a high score. Notice == for \"equals\" — a single = usually means \"assign,\" not \"compare.\"",
        },
        {
          type: "code",
          caption: "Arithmetic and comparison",
          code: {
            python: "a = 7\nb = 3\nprint(a + b)\nprint(a % b)\nprint(a > b)",
            java: "public class Main {\n  public static void main(String[] args) {\n    int a = 7, b = 3;\n    System.out.println(a + b);\n    System.out.println(a % b);\n    System.out.println(a > b);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a = 7, b = 3;\n  cout << a + b << endl;\n  cout << a % b << endl;\n  cout << (a > b) << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "% gives the remainder after division. 7 % 3 is 1. It's perfect for \"every Nth\" logic and even/odd checks (n % 2).",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Writing = when you meant == (in Java/C++/many languages) is a legendary beginner bug. One equals stores a value; two equals asks \"are these the same?\"",
        },
        {
          type: "keyTakeaways",
          items: [
            "Operators perform math, comparisons, and more on values.",
            "Know the difference between assign (=) and compare (==) in typed languages.",
            "Remainder (%) is more useful than it first looks.",
            "Parentheses help you control order when expressions get busy.",
          ],
        },
      ],
    },
    {
      slug: "expressions",
      order: 8,
      title: "Expressions",
      estMinutes: 8,
      kind: "read+problem",
      linkedProblemId: 37,
      teaser: "Pieces of code that produce a value — building blocks of every program.",
      blocks: [
        {
          type: "hook",
          text: "An expression is anything that has an answer. 2 + 2 is an expression. So is score * 2. Programs are mostly \"compute a value, then do something with it.\"",
        },
        {
          type: "paragraph",
          text: "When the computer evaluates an expression, it reduces it to a single value. That value can be printed, stored in a variable, or used inside a bigger expression. Order of operations matters — just like in math class.",
        },
        {
          type: "analogy",
          text: "A smoothie recipe: blend fruit + yogurt + ice. The blender evaluates the \"expression\" and you get one drink. Nested cups (parentheses) control what gets blended first.",
        },
        {
          type: "heading",
          text: "Build a value, then use it",
        },
        {
          type: "paragraph",
          text: "We compute total from parts. Without parentheses, multiplication happens before addition — same rules as school math.",
        },
        {
          type: "code",
          caption: "Expressions with order of operations",
          code: {
            python: "price = 10\ntax = 2\nqty = 3\ntotal = (price + tax) * qty\nprint(total)",
            java: "public class Main {\n  public static void main(String[] args) {\n    int price = 10, tax = 2, qty = 3;\n    int total = (price + tax) * qty;\n    System.out.println(total);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int price = 10, tax = 2, qty = 3;\n  int total = (price + tax) * qty;\n  cout << total << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "fun-fact",
          text: "Even a lonely variable name is an expression — it evaluates to whatever value that variable currently holds.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Forgetting parentheses when you need addition before multiplication — writing price + tax * qty when you meant (price + tax) * qty — silently gives the wrong number.",
        },
        {
          type: "keyTakeaways",
          items: [
            "An expression evaluates to a value.",
            "You can nest expressions and store results in variables.",
            "Operator precedence matters; parentheses make intent obvious.",
            "Wrong order of operations is a silent logic bug — the program still runs.",
          ],
        },
      ],
    },
    {
      slug: "comments",
      order: 9,
      title: "Comments",
      estMinutes: 6,
      kind: "read+problem",
      linkedProblemId: 38,
      teaser: "Notes for humans — the computer skips them completely.",
      blocks: [
        {
          type: "hook",
          text: "Future-you will not remember why present-you wrote that weird line. Comments are sticky notes for humans. The computer politely ignores them.",
        },
        {
          type: "paragraph",
          text: "Use comments to explain why something exists, not to narrate every obvious line. In judged problems, comments never appear in output — they're only in your source code.",
        },
        {
          type: "analogy",
          text: "Stage directions in a play script: \"enter from the left.\" The audience never hears them. Actors (and future maintainers) do. Comments are stage directions for your code.",
        },
        {
          type: "heading",
          text: "Same program, with notes",
        },
        {
          type: "paragraph",
          text: "The comments below describe intent. Switch languages — comment syntax differs (# vs // vs /* */).",
        },
        {
          type: "code",
          caption: "Comments the computer ignores",
          code: {
            python: "# Read a score and double it\nscore = int(input())\n# Double means multiply by 2\nprint(score * 2)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    // Read a score and double it\n    Scanner sc = new Scanner(System.in);\n    int score = sc.nextInt();\n    // Double means multiply by 2\n    System.out.println(score * 2);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  // Read a score and double it\n  int score;\n  cin >> score;\n  // Double means multiply by 2\n  cout << score * 2 << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "If a beginner problem's starter code is full of comments describing what to implement, read those comments first — they're the real instructions.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Putting important instructions only in comments and forgetting to write the actual code. Comments don't run. If the logic isn't in real statements, nothing happens.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Comments are for humans; the runtime skips them.",
            "Explain why, not every obvious what.",
            "Comment syntax differs by language (#, //, /* */).",
            "Never rely on a comment to \"do\" the work — write real code.",
          ],
        },
      ],
    },
    {
      slug: "basic-debugging",
      order: 10,
      title: "Basic debugging",
      estMinutes: 9,
      kind: "read+problem",
      linkedProblemId: 39,
      teaser: "Find the tiny mistake — calm detective work beats random rewriting.",
      blocks: [
        {
          type: "hook",
          text: "Every programmer writes bugs. The skill isn't avoiding them forever — it's finding them without setting your keyboard on fire.",
        },
        {
          type: "paragraph",
          text: "Debugging means comparing what you expected with what actually happened. Read the error message. Check your input assumptions. Print intermediate values when you're stuck. Change one thing at a time.",
        },
        {
          type: "analogy",
          text: "A detective doesn't renovate the whole house to find a missing sock. They check the dryer, then the couch, then the backpack. Narrow the search. Same with bugs.",
        },
        {
          type: "heading",
          text: "A program with a deliberate oops",
        },
        {
          type: "paragraph",
          text: "This is supposed to print the sum of two integers. Look closely — one version in each language has a classic slip. Spotting it is the point of the upcoming practice problem.",
        },
        {
          type: "code",
          caption: "Buggy sum (find the issue when you practice)",
          code: {
            python: "a = int(input())\nb = int(input())\n# Oops: prints product instead of sum\nprint(a * b)",
            java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt();\n    int b = sc.nextInt();\n    // Oops: prints product instead of sum\n    System.out.println(a * b);\n  }\n}",
            cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  // Oops: prints product instead of sum\n  cout << a * b << endl;\n  return 0;\n}",
          },
        },
        {
          type: "callout",
          tone: "tip",
          text: "When output is wrong but the program runs, you have a logic bug. When it crashes or won't compile, start with the first error message — fix that before chasing anything else.",
        },
        {
          type: "callout",
          tone: "mistake",
          text: "Rewriting the entire solution because one test failed. Usually one operator, one variable, or one off-by-one is wrong. Find the small crack before demolishing the wall.",
        },
        {
          type: "keyTakeaways",
          items: [
            "Bugs are normal — debugging is a core skill, not a failure.",
            "Compare expected vs actual; use errors and small prints as clues.",
            "Change one thing at a time so you know what fixed it.",
            "Logic bugs run but lie; syntax bugs refuse to run — treat them differently.",
          ],
        },
      ],
    },
  ],
};


