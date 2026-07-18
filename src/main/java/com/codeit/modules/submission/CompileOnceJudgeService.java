package com.codeit.modules.submission;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;

@Service
public class CompileOnceJudgeService {

    private static final String RESULT_MARKER = "__CODEIT_RESULT__";

    private final Judge0Service judge0Service;
    private final OutputComparator outputComparator;
    private final int caseTimeoutSeconds;
    private final double cpuTimeLimit;
    private final double wallTimeLimit;

    public CompileOnceJudgeService(
            Judge0Service judge0Service,
            OutputComparator outputComparator,
            @Value("${codeit.judge.case-timeout-seconds:3}") int caseTimeoutSeconds,
            @Value("${codeit.judge.compile-once-cpu-time-limit:30}") double cpuTimeLimit,
            @Value("${codeit.judge.compile-once-wall-time-limit:45}") double wallTimeLimit) {
        this.judge0Service = judge0Service;
        this.outputComparator = outputComparator;
        this.caseTimeoutSeconds = Math.max(1, caseTimeoutSeconds);
        this.cpuTimeLimit = cpuTimeLimit;
        this.wallTimeLimit = wallTimeLimit;
    }

    public JudgeVerdictDTO judge(
            String userCode,
            Integer languageId,
            List<TestCaseDTO> testCases) {

        LanguageProfile profile = profileFor(languageId);
        String archive = buildArchive(userCode, testCases, profile);
        Judge0Result execution = judge0Service.executeMultiFileProgram(
                archive,
                cpuTimeLimit,
                wallTimeLimit);

        JudgeVerdictDTO verdict = new JudgeVerdictDTO();
        verdict.setTotalCount(testCases.size());
        verdict.setPassedCount(0);
        verdict.setTime(parseTime(execution.getTime()));
        verdict.setMemory(execution.getMemory() != null ? execution.getMemory() : 0);

        String outerStatus = statusDescription(execution);
        Map<Integer, CaseResult> caseResults = parseCaseResults(execution.getStdout());

        if (caseResults.isEmpty() && !"Accepted".equals(outerStatus)) {
            return failed(verdict, outerStatus, 0);
        }

        for (int i = 0; i < testCases.size(); i++) {
            CaseResult caseResult = caseResults.get(i);
            if (caseResult == null) {
                String status = "Accepted".equals(outerStatus)
                        ? "Runtime Error"
                        : outerStatus;
                return failed(verdict, status, i);
            }

            if (caseResult.exitCode() == 124 || caseResult.exitCode() == 137) {
                return failed(verdict, "Time Limit Exceeded", i);
            }
            if (caseResult.exitCode() != 0) {
                return failed(verdict, "Runtime Error", i);
            }
            if (!outputComparator.matches(
                    caseResult.stdout(),
                    testCases.get(i).getStdout())) {
                return failed(verdict, "Wrong Answer", i);
            }

            verdict.setPassedCount(i + 1);
        }

        if (!"Accepted".equals(outerStatus)) {
            return failed(verdict, outerStatus, testCases.size() - 1);
        }

        verdict.setVerdict("Accepted");
        return verdict;
    }

    public boolean supports(Integer languageId) {
        return SupportedLanguage.resolve(languageId, null) != SupportedLanguage.CSHARP;
    }

    private JudgeVerdictDTO failed(
            JudgeVerdictDTO verdict,
            String status,
            int testIndex) {
        verdict.setVerdict(status);
        verdict.setFailedTestIndex(Math.max(0, testIndex));
        verdict.setPassedCount(Math.max(0, testIndex));
        return verdict;
    }

    private String buildArchive(
            String userCode,
            List<TestCaseDTO> testCases,
            LanguageProfile profile) {

        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
                addFile(zip, profile.sourceFile(), userCode);
                if (profile.compileCommand() != null) {
                    addFile(zip, "compile", compileScript(profile.compileCommand()));
                }
                addFile(zip, "run", runScript(profile.runCommand()));

                for (int i = 0; i < testCases.size(); i++) {
                    addFile(
                            zip,
                            "inputs/%05d.in".formatted(i),
                            testCases.get(i).getStdin() != null
                                    ? testCases.get(i).getStdin()
                                    : "");
                }
            }
            return Base64.getEncoder().encodeToString(bytes.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to build compile-once archive", e);
        }
    }

    private void addFile(
            ZipOutputStream zip,
            String path,
            String content) throws IOException {
        ZipEntry entry = new ZipEntry(path);
        entry.setTime(0);
        zip.putNextEntry(entry);
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private String compileScript(String command) {
        return """
                #!/bin/bash
                set -e
                %s
                """.formatted(command);
    }

    private String runScript(String command) {
        String escapedCommand = command.replace("'", "'\"'\"'");
        return """
                #!/bin/bash
                set +e
                export LC_ALL=C
                for input in inputs/*.in; do
                  name="${input##*/}"
                  index="${name%%.in}"
                  output="case-${index}.out"
                  error="case-${index}.err"
                  timeout --signal=KILL %ds bash -c '%s' < "$input" > "$output" 2> "$error"
                  exit_code=$?
                  printf '%s\\t%%s\\t%%s\\t' "$index" "$exit_code"
                  base64 -w 0 "$output"
                  printf '\\t'
                  base64 -w 0 "$error"
                  printf '\\n'
                  if [ "$exit_code" -ne 0 ]; then
                    break
                  fi
                done
                exit 0
                """.formatted(caseTimeoutSeconds, escapedCommand, RESULT_MARKER);
    }

    private Map<Integer, CaseResult> parseCaseResults(String protocolOutput) {
        Map<Integer, CaseResult> results = new HashMap<>();
        if (protocolOutput == null || protocolOutput.isBlank()) {
            return results;
        }

        for (String line : protocolOutput.split("\\R")) {
            if (!line.startsWith(RESULT_MARKER + "\t")) {
                continue;
            }

            String[] fields = line.split("\t", -1);
            if (fields.length != 5) {
                continue;
            }

            try {
                int index = Integer.parseInt(fields[1]);
                int exitCode = Integer.parseInt(fields[2]);
                String stdout = decode(fields[3]);
                String stderr = decode(fields[4]);
                results.put(index, new CaseResult(exitCode, stdout, stderr));
            } catch (IllegalArgumentException ignored) {
                // Malformed protocol output becomes a missing result and Runtime Error.
            }
        }
        return results;
    }

    private String decode(String encoded) {
        if (encoded == null || encoded.isEmpty()) {
            return "";
        }
        return new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
    }

    private String statusDescription(Judge0Result result) {
        if (result.getStatus() == null || result.getStatus().getDescription() == null) {
            return "Runtime Error";
        }
        return result.getStatus().getDescription();
    }

    private double parseTime(String time) {
        if (time == null) {
            return 0;
        }
        try {
            return Double.parseDouble(time);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private LanguageProfile profileFor(Integer languageId) {
        SupportedLanguage language = SupportedLanguage.resolve(languageId, null);
        return switch (language) {
            case JAVA -> new LanguageProfile(
                    "Main.java",
                    "/usr/local/openjdk13/bin/javac Main.java",
                    "/usr/local/openjdk13/bin/java Main");
            case PYTHON -> new LanguageProfile(
                    "script.py",
                    null,
                    "/usr/local/python-3.8.1/bin/python3 script.py");
            case JAVASCRIPT -> new LanguageProfile(
                    "script.js",
                    null,
                    "/usr/local/node-12.14.0/bin/node script.js");
            case TYPESCRIPT -> new LanguageProfile(
                    "script.ts",
                    "/usr/bin/tsc script.ts",
                    "/usr/local/node-12.14.0/bin/node script.js");
            case CPP -> new LanguageProfile(
                    "main.cpp",
                    "/usr/local/gcc-9.2.0/bin/g++ main.cpp",
                    "LD_LIBRARY_PATH=/usr/local/gcc-9.2.0/lib64 ./a.out");
            case C -> new LanguageProfile(
                    "main.c",
                    "/usr/local/gcc-9.2.0/bin/gcc main.c",
                    "./a.out");
            case GO -> new LanguageProfile(
                    "main.go",
                    "GOCACHE=/tmp/.cache/go-build /usr/local/go-1.13.5/bin/go build main.go",
                    "./main");
            case RUST -> new LanguageProfile(
                    "main.rs",
                    "/usr/local/rust-1.40.0/bin/rustc main.rs",
                    "./main");
            case CSHARP -> new LanguageProfile(
                    "Main.cs",
                    "/usr/local/mono-6.6.0.161/bin/mcs Main.cs",
                    "/usr/local/mono-6.6.0.161/bin/mono Main.exe");
            case RUBY -> new LanguageProfile(
                    "script.rb",
                    null,
                    "/usr/local/ruby-2.7.0/bin/ruby script.rb");
            case PHP -> new LanguageProfile(
                    "script.php",
                    null,
                    "/usr/local/php-7.4.1/bin/php script.php");
        };
    }

    private record LanguageProfile(
            String sourceFile,
            String compileCommand,
            String runCommand) {
    }

    private record CaseResult(
            int exitCode,
            String stdout,
            String stderr) {
    }
}
