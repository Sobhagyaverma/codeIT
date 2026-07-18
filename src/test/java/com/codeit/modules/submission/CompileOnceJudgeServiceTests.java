package com.codeit.modules.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;

class CompileOnceJudgeServiceTests {

    @Test
    void acceptsAllFramedCaseOutputsFromOneExecution() {
        Judge0Service judge0Service = mock(Judge0Service.class);
        CompileOnceJudgeService service = service(judge0Service);
        when(judge0Service.executeMultiFileProgram(anyString(), anyDouble(), anyDouble()))
                .thenReturn(execution(
                        "Accepted",
                        protocol(0, 0, "expected-0")
                                + protocol(1, 0, "expected-1")
                                + protocol(2, 0, "expected-2")));

        JudgeVerdictDTO verdict = service.judge("print('x')", 71, testCases(3));

        assertEquals("Accepted", verdict.getVerdict());
        assertEquals(3, verdict.getPassedCount());
        assertEquals(3, verdict.getTotalCount());

        ArgumentCaptor<String> archive = ArgumentCaptor.forClass(String.class);
        verify(judge0Service).executeMultiFileProgram(
                archive.capture(),
                anyDouble(),
                anyDouble());
        assertNotNull(Base64.getDecoder().decode(archive.getValue()));
    }

    @Test
    void reportsWrongAnswerAtOriginalCaseIndex() {
        Judge0Service judge0Service = mock(Judge0Service.class);
        CompileOnceJudgeService service = service(judge0Service);
        when(judge0Service.executeMultiFileProgram(anyString(), anyDouble(), anyDouble()))
                .thenReturn(execution(
                        "Accepted",
                        protocol(0, 0, "expected-0")
                                + protocol(1, 0, "wrong")
                                + protocol(2, 0, "expected-2")));

        JudgeVerdictDTO verdict = service.judge("print('x')", 71, testCases(3));

        assertEquals("Wrong Answer", verdict.getVerdict());
        assertEquals(1, verdict.getPassedCount());
        assertEquals(1, verdict.getFailedTestIndex());
    }

    @Test
    void reportsCompilationErrorBeforeRunningCases() {
        Judge0Service judge0Service = mock(Judge0Service.class);
        CompileOnceJudgeService service = service(judge0Service);
        when(judge0Service.executeMultiFileProgram(anyString(), anyDouble(), anyDouble()))
                .thenReturn(execution("Compilation Error", null));

        JudgeVerdictDTO verdict = service.judge("invalid", 62, testCases(3));

        assertEquals("Compilation Error", verdict.getVerdict());
        assertEquals(0, verdict.getPassedCount());
        assertEquals(0, verdict.getFailedTestIndex());
    }

    private CompileOnceJudgeService service(Judge0Service judge0Service) {
        return new CompileOnceJudgeService(
                judge0Service,
                new OutputComparator(),
                3,
                30,
                45);
    }

    private List<TestCaseDTO> testCases(int count) {
        List<TestCaseDTO> testCases = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            TestCaseDTO testCase = new TestCaseDTO();
            testCase.setStdin("input-" + i);
            testCase.setStdout("expected-" + i);
            testCases.add(testCase);
        }
        return testCases;
    }

    private Judge0Result execution(String statusDescription, String stdout) {
        Judge0Result.Status status = new Judge0Result.Status();
        status.setId("Accepted".equals(statusDescription) ? 3 : 6);
        status.setDescription(statusDescription);

        Judge0Result result = new Judge0Result();
        result.setStatus(status);
        result.setStdout(stdout);
        result.setTime("0.1");
        result.setMemory(1024);
        return result;
    }

    private String protocol(int index, int exitCode, String stdout) {
        String encodedStdout = Base64.getEncoder().encodeToString(
                stdout.getBytes(StandardCharsets.UTF_8));
        return "__CODEIT_RESULT__\t%05d\t%d\t%s\t\n"
                .formatted(index, exitCode, encodedStdout);
    }
}
