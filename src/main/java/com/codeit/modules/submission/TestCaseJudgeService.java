package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestCaseJudgeService {

    private final CompileOnceJudgeService compileOnceJudgeService;
    private final ProgressiveBatchJudgeService progressiveBatchJudgeService;

    public TestCaseJudgeService(
            CompileOnceJudgeService compileOnceJudgeService,
            ProgressiveBatchJudgeService progressiveBatchJudgeService) {
        this.compileOnceJudgeService = compileOnceJudgeService;
        this.progressiveBatchJudgeService = progressiveBatchJudgeService;
    }

    public JudgeVerdictDTO judge(String userCode, Integer languageId, List<TestCaseDTO> testCases) {
        if (!compileOnceJudgeService.supports(languageId)) {
            JudgeVerdictDTO verdict = progressiveBatchJudgeService.judge(
                    userCode, languageId, testCases);
            verdict.setEngine("progressive-batch");
            return verdict;
        }
        JudgeVerdictDTO verdict = compileOnceJudgeService.judge(
                userCode, languageId, testCases);
        verdict.setEngine("compile-once");
        return verdict;
    }
}
