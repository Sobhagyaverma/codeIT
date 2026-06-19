package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestCaseJudgeService {

    private final Judge0Service judge0Service;
    private final OutputComparator outputComparator;

    public TestCaseJudgeService(Judge0Service judge0Service, OutputComparator outputComparator) {
        this.judge0Service = judge0Service;
        this.outputComparator = outputComparator;
    }

    public JudgeVerdictDTO judge(String userCode, Integer languageId, List<TestCaseDTO> testCases) {
        JudgeVerdictDTO verdict = new JudgeVerdictDTO();
        verdict.setTotalCount(testCases.size());
        verdict.setPassedCount(0);

        double maxTime = 0;
        int maxMemory = 0;

        for (int i = 0; i < testCases.size(); i++) {
            TestCaseDTO test = testCases.get(i);
            Judge0Result result = judge0Service.executeCode(userCode, languageId, test.getStdin());

            if (result.getTime() != null) {
                maxTime = Math.max(maxTime, Double.parseDouble(result.getTime()));
            }
            if (result.getMemory() != null) {
                maxMemory = Math.max(maxMemory, result.getMemory());
            }

            String status = result.getStatus() != null
                    ? result.getStatus().getDescription()
                    : "Runtime Error";

            if (!"Accepted".equals(status)) {
                verdict.setVerdict(status);
                verdict.setFailedTestIndex(i);
                verdict.setPassedCount(i);
                verdict.setTime(maxTime);
                verdict.setMemory(maxMemory);
                return verdict;
            }

            if (!outputComparator.matches(result.getStdout(), test.getStdout())) {
                verdict.setVerdict("Wrong Answer");
                verdict.setFailedTestIndex(i);
                verdict.setPassedCount(i);
                verdict.setTime(maxTime);
                verdict.setMemory(maxMemory);
                return verdict;
            }

            verdict.setPassedCount(i + 1);
        }

        verdict.setVerdict("Accepted");
        verdict.setTime(maxTime);
        verdict.setMemory(maxMemory);
        return verdict;
    }
}
