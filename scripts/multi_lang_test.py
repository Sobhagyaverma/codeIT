#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE = "http://localhost:9091/api/submissions/submit"
USER_ID = 1

SOLUTIONS = {
    1: {  # Two Sum
        "java": (
            'import java.util.*;\n'
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        Scanner sc = new Scanner(System.in);\n'
            '        int n = sc.nextInt();\n'
            '        int[] nums = new int[n];\n'
            '        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n'
            '        int target = sc.nextInt();\n'
            '        Map<Integer, Integer> map = new HashMap<>();\n'
            '        for (int i = 0; i < n; i++) {\n'
            '            int comp = target - nums[i];\n'
            '            if (map.containsKey(comp)) {\n'
            '                System.out.println(map.get(comp) + " " + i);\n'
            '                return;\n'
            '            }\n'
            '            map.put(nums[i], i);\n'
            '        }\n'
            '    }\n'
            '}'
        ),
        "python": (
            "n = int(input())\n"
            "nums = list(map(int, input().split()))\n"
            "target = int(input())\n"
            "seen = {}\n"
            "for i, x in enumerate(nums):\n"
            "    if target - x in seen:\n"
            "        print(seen[target - x], i)\n"
            "        break\n"
            "    seen[x] = i\n"
        ),
        "cpp": (
            "#include <bits/stdc++.h>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int n; cin >> n;\n"
            "    vector<int> nums(n);\n"
            "    for (int i = 0; i < n; i++) cin >> nums[i];\n"
            "    int target; cin >> target;\n"
            "    unordered_map<int,int> m;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        if (m.count(target - nums[i])) {\n"
            "            cout << m[target - nums[i]] << \" \" << i << endl;\n"
            "            return 0;\n"
            "        }\n"
            "        m[nums[i]] = i;\n"
            "    }\n"
            "}\n"
        ),
        "javascript": (
            "const fs = require('fs');\n"
            "const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');\n"
            "const n = parseInt(lines[0]);\n"
            "const nums = lines[1].split(' ').map(Number);\n"
            "const target = parseInt(lines[2]);\n"
            "const seen = new Map();\n"
            "for (let i = 0; i < n; i++) {\n"
            "    if (seen.has(target - nums[i])) {\n"
            "        console.log(seen.get(target - nums[i]) + ' ' + i);\n"
            "        break;\n"
            "    }\n"
            "    seen.set(nums[i], i);\n"
            "}\n"
        ),
        "c": (
            "#include <stdio.h>\n"
            "int main() {\n"
            "    int n; scanf(\"%d\", &n);\n"
            "    int nums[10005];\n"
            "    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n"
            "    int target; scanf(\"%d\", &target);\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        for (int j = i + 1; j < n; j++) {\n"
            "            if (nums[i] + nums[j] == target) {\n"
            "                printf(\"%d %d\\n\", i, j);\n"
            "                return 0;\n"
            "            }\n"
            "        }\n"
            "    }\n"
            "    return 0;\n"
            "}\n"
        ),
    },
    2: {  # Subset Sum
        "java": (
            'import java.util.*;\n'
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        Scanner sc = new Scanner(System.in);\n'
            '        int n = sc.nextInt();\n'
            '        int[] arr = new int[n];\n'
            '        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n'
            '        int sum = sc.nextInt();\n'
            '        boolean[] dp = new boolean[sum + 1];\n'
            '        dp[0] = true;\n'
            '        for (int x : arr) {\n'
            '            for (int s = sum; s >= x; s--) {\n'
            '                dp[s] = dp[s] || dp[s - x];\n'
            '            }\n'
            '        }\n'
            '        System.out.println(dp[sum] ? 1 : 0);\n'
            '    }\n'
            '}'
        ),
        "python": (
            "n = int(input())\n"
            "arr = list(map(int, input().split()))\n"
            "total = int(input())\n"
            "dp = [False] * (total + 1)\n"
            "dp[0] = True\n"
            "for x in arr:\n"
            "    for s in range(total, x - 1, -1):\n"
            "        dp[s] = dp[s] or dp[s - x]\n"
            "print(1 if dp[total] else 0)\n"
        ),
        "cpp": (
            "#include <bits/stdc++.h>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int n; cin >> n;\n"
            "    vector<int> arr(n);\n"
            "    for (int i = 0; i < n; i++) cin >> arr[i];\n"
            "    int sum; cin >> sum;\n"
            "    vector<bool> dp(sum + 1, false);\n"
            "    dp[0] = true;\n"
            "    for (int x : arr) {\n"
            "        for (int s = sum; s >= x; s--) {\n"
            "            dp[s] = dp[s] || dp[s - x];\n"
            "        }\n"
            "    }\n"
            "    cout << (dp[sum] ? 1 : 0) << endl;\n"
            "}\n"
        ),
        "javascript": (
            "const fs = require('fs');\n"
            "const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');\n"
            "const n = parseInt(lines[0]);\n"
            "const arr = lines[1].split(' ').map(Number);\n"
            "const total = parseInt(lines[2]);\n"
            "const dp = Array(total + 1).fill(false);\n"
            "dp[0] = true;\n"
            "for (const x of arr) {\n"
            "    for (let s = total; s >= x; s--) {\n"
            "        dp[s] = dp[s] || dp[s - x];\n"
            "    }\n"
            "}\n"
            "console.log(dp[total] ? 1 : 0);\n"
        ),
        "c": (
            "#include <stdio.h>\n"
            "#include <stdbool.h>\n"
            "int main() {\n"
            "    int n; scanf(\"%d\", &n);\n"
            "    int arr[105];\n"
            "    for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n"
            "    int sum; scanf(\"%d\", &sum);\n"
            "    bool dp[105] = {false};\n"
            "    dp[0] = true;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        int x = arr[i];\n"
            "        for (int s = sum; s >= x; s--) {\n"
            "            dp[s] = dp[s] || dp[s - x];\n"
            "        }\n"
            "    }\n"
            "    printf(\"%d\\n\", dp[sum] ? 1 : 0);\n"
            "    return 0;\n"
            "}\n"
        ),
    },
    4: {  # Contains Duplicate
        "java": (
            'import java.util.*;\n'
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        Scanner sc = new Scanner(System.in);\n'
            '        int n = sc.nextInt();\n'
            '        Set<Integer> seen = new HashSet<>();\n'
            '        for (int i = 0; i < n; i++) {\n'
            '            int x = sc.nextInt();\n'
            '            if (seen.contains(x)) {\n'
            '                System.out.println("true");\n'
            '                return;\n'
            '            }\n'
            '            seen.add(x);\n'
            '        }\n'
            '        System.out.println("false");\n'
            '    }\n'
            '}'
        ),
        "python": (
            "n = int(input())\n"
            "nums = list(map(int, input().split()))\n"
            "seen = set()\n"
            "for x in nums:\n"
            "    if x in seen:\n"
            "        print('true')\n"
            "        break\n"
            "    seen.add(x)\n"
            "else:\n"
            "    print('false')\n"
        ),
        "cpp": (
            "#include <bits/stdc++.h>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int n; cin >> n;\n"
            "    unordered_set<int> seen;\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        int x; cin >> x;\n"
            "        if (seen.count(x)) {\n"
            "            cout << \"true\" << endl;\n"
            "            return 0;\n"
            "        }\n"
            "        seen.insert(x);\n"
            "    }\n"
            "    cout << \"false\" << endl;\n"
            "}\n"
        ),
        "javascript": (
            "const fs = require('fs');\n"
            "const lines = fs.readFileSync(0, 'utf8').trim().split('\\n');\n"
            "const n = parseInt(lines[0]);\n"
            "const nums = lines[1].split(' ').map(Number);\n"
            "const seen = new Set();\n"
            "for (const x of nums) {\n"
            "    if (seen.has(x)) {\n"
            "        console.log('true');\n"
            "        process.exit(0);\n"
            "    }\n"
            "    seen.add(x);\n"
            "}\n"
            "console.log('false');\n"
        ),
        "c": (
            "#include <stdio.h>\n"
            "#include <stdbool.h>\n"
            "int main() {\n"
            "    int n; scanf(\"%d\", &n);\n"
            "    int seen[100005];\n"
            "    for (int i = 0; i < 100005; i++) seen[i] = 0;\n"
            "  /* values can be large - use simple O(n^2) for small tests */\n"
            "    int nums[100005];\n"
            "    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n"
            "    for (int i = 0; i < n; i++) {\n"
            "        for (int j = i + 1; j < n; j++) {\n"
            "            if (nums[i] == nums[j]) {\n"
            "                printf(\"true\\n\");\n"
            "                return 0;\n"
            "            }\n"
            "        }\n"
            "    }\n"
            "    printf(\"false\\n\");\n"
            "    return 0;\n"
            "}\n"
        ),
    },
}

LANG_IDS = {
    "java": 62,
    "python": 71,
    "cpp": 54,
    "javascript": 63,
    "c": 50,
}

PROBLEM_NAMES = {1: "Two Sum", 2: "Subset Sum", 4: "Contains Duplicate"}


def submit(problem_id, lang, code):
    payload = {
        "userId": USER_ID,
        "problemId": problem_id,
        "languageId": LANG_IDS[lang],
        "language": lang,
        "code": code,
    }
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode()), None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return None, f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return None, str(e)


def main():
    print(f"{'Problem':<20} {'Lang':<12} {'Verdict':<20} {'Passed':<10} {'Time':<8} {'Error'}")
    print("-" * 90)
    passed_all = 0
    total = 0
    for pid in [1, 2, 4]:
        for lang in ["java", "python", "cpp", "javascript", "c"]:
            total += 1
            code = SOLUTIONS[pid][lang]
            result, err = submit(pid, lang, code)
            if err:
                print(f"P{pid} {PROBLEM_NAMES[pid]:<16} {lang:<12} {'ERROR':<20} {'-':<10} {'-':<8} {err}")
            else:
                verdict = result.get("verdict", "?")
                pc = f"{result.get('passedCount', '?')}/{result.get('totalCount', '?')}"
                t = result.get("time", "-")
                fail = ""
                if verdict != "Accepted":
                    fail = f"failed@TC{result.get('failedTestIndex')}"
                if verdict == "Accepted":
                    passed_all += 1
                print(f"P{pid} {PROBLEM_NAMES[pid]:<16} {lang:<12} {verdict:<20} {pc:<10} {t:<8} {fail}")
    print("-" * 90)
    print(f"Result: {passed_all}/{total} Accepted")


if __name__ == "__main__":
    main()
