package com.codeit.modules.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;

class TestCaseJudgeServiceTests {

    @Test
    void usesCompileOnceWhenSupported() {
        CompileOnceJudgeService compileOnce = mock(CompileOnceJudgeService.class);
        ProgressiveBatchJudgeService progressive = mock(ProgressiveBatchJudgeService.class);
        TestCaseJudgeService service = new TestCaseJudgeService(compileOnce, progressive);
        List<TestCaseDTO> testCases = List.of(new TestCaseDTO());
        JudgeVerdictDTO expected = new JudgeVerdictDTO();

        when(compileOnce.supports(62)).thenReturn(true);
        when(compileOnce.judge("code", 62, testCases)).thenReturn(expected);

        JudgeVerdictDTO actual = service.judge("code", 62, testCases);

        assertSame(expected, actual);
        assertEquals("compile-once", actual.getEngine());
        verify(compileOnce).judge("code", 62, testCases);
    }

    @Test
    void fallsBackToProgressiveBatchForUnsupportedCompileOnceLanguage() {
        CompileOnceJudgeService compileOnce = mock(CompileOnceJudgeService.class);
        ProgressiveBatchJudgeService progressive = mock(ProgressiveBatchJudgeService.class);
        TestCaseJudgeService service = new TestCaseJudgeService(compileOnce, progressive);
        List<TestCaseDTO> testCases = List.of(new TestCaseDTO());
        JudgeVerdictDTO expected = new JudgeVerdictDTO();

        when(compileOnce.supports(51)).thenReturn(false);
        when(progressive.judge("code", 51, testCases)).thenReturn(expected);

        JudgeVerdictDTO actual = service.judge("code", 51, testCases);

        assertSame(expected, actual);
        assertEquals("progressive-batch", actual.getEngine());
        verify(progressive).judge("code", 51, testCases);
    }
}
