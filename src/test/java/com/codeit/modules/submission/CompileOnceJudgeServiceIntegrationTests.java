package com.codeit.modules.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.client.RestTemplate;

import com.codeit.config.AppConfig;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

class CompileOnceJudgeServiceIntegrationTests {

    @Test
    @EnabledIfEnvironmentVariable(
            named = "RUN_JUDGE0_INTEGRATION",
            matches = "true")
    void judgesTwentyJavaCasesWithOneCompilation() throws Exception {
        try (LiveJudge liveJudge = liveJudge()) {
            String source = """
                    import java.util.Scanner;

                    public class Main {
                        public static void main(String[] args) {
                            Scanner scanner = new Scanner(System.in);
                            System.out.println(scanner.nextInt());
                        }
                    }
                    """;

            JudgeVerdictDTO verdict = liveJudge.service().judge(
                    source,
                    62,
                    numericTestCases(20));

            assertEquals("Accepted", verdict.getVerdict());
            assertEquals(20, verdict.getPassedCount());
        }
    }

    @Test
    @EnabledIfEnvironmentVariable(
            named = "RUN_JUDGE0_INTEGRATION",
            matches = "true")
    void judgesCompiledAndInterpretedLanguageProfiles() throws Exception {
        try (LiveJudge liveJudge = liveJudge()) {
            List<LanguageProgram> programs = List.of(
                    new LanguageProgram(54, """
                            #include <iostream>
                            int main() { int n; std::cin >> n; std::cout << n << '\\n'; }
                            """),
                    new LanguageProgram(50, """
                            #include <stdio.h>
                            int main() { int n; scanf("%d", &n); printf("%d\\n", n); }
                            """),
                    new LanguageProgram(71, "print(int(input()))"),
                    new LanguageProgram(63, """
                            const fs = require('fs');
                            console.log(parseInt(fs.readFileSync(0, 'utf8')));
                            """),
                    new LanguageProgram(74, """
                            declare function require(name: string): any;
                            const fs = require('fs');
                            console.log(parseInt(fs.readFileSync(0, 'utf8')));
                            """),
                    new LanguageProgram(60, """
                            package main
                            import "fmt"
                            func main() { var n int; fmt.Scan(&n); fmt.Println(n) }
                            """),
                    new LanguageProgram(73, """
                            use std::io::{self, Read};
                            fn main() {
                                let mut input = String::new();
                                io::stdin().read_to_string(&mut input).unwrap();
                                println!("{}", input.trim().parse::<i32>().unwrap());
                            }
                            """),
                    new LanguageProgram(72, "puts STDIN.read.to_i"),
                    new LanguageProgram(68, """
                            <?php echo intval(trim(file_get_contents("php://stdin"))), PHP_EOL; ?>
                            """));

            for (LanguageProgram program : programs) {
                JudgeVerdictDTO verdict = liveJudge.service().judge(
                        program.source(),
                        program.languageId(),
                        numericTestCases(2));
                assertEquals(
                        "Accepted",
                        verdict.getVerdict(),
                        "languageId=" + program.languageId());
            }
        }
    }

    private LiveJudge liveJudge() {
        AppConfig config = new AppConfig();
        CloseableHttpClient httpClient =
                config.judgeHttpClient(3000, 60000, 8, 8);
        RestTemplate restTemplate = config.restTemplate(httpClient);
        Judge0Service judge0Service = new Judge0Service(
                restTemplate,
                new ObjectMapper(),
                "http://localhost:2358",
                200,
                60000);
        CompileOnceJudgeService service = new CompileOnceJudgeService(
                judge0Service,
                new OutputComparator(),
                3,
                30,
                45);
        return new LiveJudge(service, httpClient);
    }

    private List<TestCaseDTO> numericTestCases(int count) {
        List<TestCaseDTO> testCases = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            TestCaseDTO testCase = new TestCaseDTO();
            testCase.setStdin(Integer.toString(i));
            testCase.setStdout(Integer.toString(i));
            testCases.add(testCase);
        }
        return testCases;
    }

    private record LanguageProgram(int languageId, String source) {
    }

    private record LiveJudge(
            CompileOnceJudgeService service,
            CloseableHttpClient httpClient) implements AutoCloseable {

        @Override
        public void close() throws Exception {
            httpClient.close();
        }
    }
}
