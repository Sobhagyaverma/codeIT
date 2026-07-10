package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

@Service
public class TestCaseJudgeService {

    private final Judge0Service judge0Service;
    private final OutputComparator outputComparator;
    private final ExecutorService judgeExecutor;

    public TestCaseJudgeService(
            Judge0Service judge0Service,
            OutputComparator outputComparator,
            ExecutorService judgeExecutor) {
        this.judge0Service = judge0Service;
        this.outputComparator = outputComparator;
        this.judgeExecutor = judgeExecutor;
    }

    public JudgeVerdictDTO judge(String userCode, Integer languageId, List<TestCaseDTO> testCases) {
        JudgeVerdictDTO verdict = new JudgeVerdictDTO();
        verdict.setTotalCount(testCases.size());
        verdict.setPassedCount(0);

        double maxTime = 0;
        int maxMemory = 0;

        List<Future<Judge0Result>> futures = new ArrayList<>(testCases.size());
        for (TestCaseDTO test : testCases) {
            futures.add(judgeExecutor.submit(
                    () -> judge0Service.executeCode(userCode, languageId, test.getStdin())));
        }

        try {
            for (int i = 0; i < testCases.size(); i++) {
                TestCaseDTO test = testCases.get(i);
                Judge0Result result = futures.get(i).get();

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
                    cancelRemaining(futures, i + 1);
                    verdict.setVerdict(status);
                    verdict.setFailedTestIndex(i);
                    verdict.setPassedCount(i);
                    verdict.setTime(maxTime);
                    verdict.setMemory(maxMemory);
                    return verdict;
                }

                if (!outputComparator.matches(result.getStdout(), test.getStdout())) {
                    cancelRemaining(futures, i + 1);
                    verdict.setVerdict("Wrong Answer");
                    verdict.setFailedTestIndex(i);
                    verdict.setPassedCount(i);
                    verdict.setTime(maxTime);
                    verdict.setMemory(maxMemory);
                    return verdict;
                }

                verdict.setPassedCount(i + 1);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            cancelRemaining(futures, 0);
            throw new RuntimeException("Judge interrupted", e);
        } catch (ExecutionException e) {
            cancelRemaining(futures, 0);
            throw new RuntimeException("Judge execution failed", e.getCause());
        }

        verdict.setVerdict("Accepted");
        verdict.setTime(maxTime);
        verdict.setMemory(maxMemory);
        return verdict;
    }

    private void cancelRemaining(List<Future<Judge0Result>> futures, int fromIndex) {
        for (int i = fromIndex; i < futures.size(); i++) {
            futures.get(i).cancel(true);
        }
    }
}
