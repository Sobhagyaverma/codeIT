package com.codeit.modules.submission;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.codeit.modules.submission.dto.Judge0Result;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;

@Service
public class ProgressiveBatchJudgeService {

    private final Judge0Service judge0Service;
    private final OutputComparator outputComparator;
    private final int progressiveFirstChunk;
    private final int batchChunkSize;

    public ProgressiveBatchJudgeService(
            Judge0Service judge0Service,
            OutputComparator outputComparator,
            @Value("${codeit.judge.progressive-first-chunk:3}") int progressiveFirstChunk,
            @Value("${codeit.judge.batch-chunk-size:6}") int batchChunkSize) {
        this.judge0Service = judge0Service;
        this.outputComparator = outputComparator;
        this.progressiveFirstChunk = Math.max(1, progressiveFirstChunk);
        this.batchChunkSize = Math.max(1, batchChunkSize);
    }

    public JudgeVerdictDTO judge(
            String userCode,
            Integer languageId,
            List<TestCaseDTO> testCases) {

        JudgeVerdictDTO verdict = new JudgeVerdictDTO();
        verdict.setTotalCount(testCases.size());
        verdict.setPassedCount(0);

        double maxTime = 0;
        int maxMemory = 0;
        int chunkStart = 0;
        boolean firstChunk = true;

        while (chunkStart < testCases.size()) {
            int requestedSize = firstChunk ? progressiveFirstChunk : batchChunkSize;
            int chunkEnd = Math.min(chunkStart + requestedSize, testCases.size());
            List<TestCaseDTO> chunk = testCases.subList(chunkStart, chunkEnd);
            List<String> stdins = chunk.stream()
                    .map(testCase -> testCase.getStdin())
                    .toList();
            List<Judge0Result> results = judge0Service.executeBatchAndWait(
                    userCode,
                    languageId,
                    stdins);

            if (results.size() != chunk.size()) {
                throw new RuntimeException("Judge0 returned an incomplete batch");
            }

            for (int localIndex = 0; localIndex < chunk.size(); localIndex++) {
                int testIndex = chunkStart + localIndex;
                TestCaseDTO test = chunk.get(localIndex);
                Judge0Result result = results.get(localIndex);

                if (result.getTime() != null) {
                    maxTime = Math.max(maxTime, parseTime(result.getTime()));
                }
                if (result.getMemory() != null) {
                    maxMemory = Math.max(maxMemory, result.getMemory());
                }

                String status = result.getStatus() != null
                        ? result.getStatus().getDescription()
                        : "Runtime Error";
                if (!"Accepted".equals(status)) {
                    return failed(verdict, status, testIndex, maxTime, maxMemory);
                }
                if (!outputComparator.matches(result.getStdout(), test.getStdout())) {
                    return failed(
                            verdict,
                            "Wrong Answer",
                            testIndex,
                            maxTime,
                            maxMemory);
                }
                verdict.setPassedCount(testIndex + 1);
            }

            chunkStart = chunkEnd;
            firstChunk = false;
        }

        verdict.setVerdict("Accepted");
        verdict.setTime(maxTime);
        verdict.setMemory(maxMemory);
        return verdict;
    }

    private JudgeVerdictDTO failed(
            JudgeVerdictDTO verdict,
            String status,
            int testIndex,
            double maxTime,
            int maxMemory) {
        verdict.setVerdict(status);
        verdict.setFailedTestIndex(testIndex);
        verdict.setPassedCount(testIndex);
        verdict.setTime(maxTime);
        verdict.setMemory(maxMemory);
        return verdict;
    }

    private double parseTime(String time) {
        try {
            return Double.parseDouble(time);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }
}
