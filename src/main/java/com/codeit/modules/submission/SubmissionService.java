package com.codeit.modules.submission;

import java.util.List;

import com.codeit.modules.problems.Problem;
import com.codeit.modules.problems.ProblemService;
import com.codeit.modules.submission.dto.JudgeVerdictDTO;
import com.codeit.modules.submission.dto.TestCaseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ProblemService problemService;

    @Autowired
    private TestCaseParser testCaseParser;

    @Autowired
    private TestCaseJudgeService testCaseJudgeService;

    public JudgeVerdictDTO submit(Submission submission) {
        validateSubmission(submission);

        Problem problem = problemService.getProblemForJudge(submission.getProblemId());
        if (problem == null) {
            throw new IllegalArgumentException("Problem not found");
        }

        List<TestCaseDTO> testCases = testCaseParser.parse(problem.getTestCases());

        JudgeVerdictDTO verdict = testCaseJudgeService.judge(
                submission.getCode(),
                submission.getLanguageId(),
                testCases);

        submission.setVerdict(verdict.getVerdict());
        submission.setExecutionTime(verdict.getTime());
        submission.setMemoryUsed(verdict.getMemory());
        submissionRepository.saveSubmission(submission);

        return verdict;
    }

    private void validateSubmission(Submission submission) {
        if (submission.getUserId() == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (submission.getProblemId() == null) {
            throw new IllegalArgumentException("problemId is required");
        }
        if (submission.getCode() == null || submission.getCode().isBlank()) {
            throw new IllegalArgumentException("code is required");
        }
        if (submission.getLanguageId() == null) {
            throw new IllegalArgumentException("languageId is required");
        }
    }

    public List<Submission> getUserSubmissions(Integer userId) {
        return submissionRepository.getUserSubmissions(userId);
    }

    public List<Submission> getProblemSubmissions(Integer problemId) {
        return submissionRepository.getProblemSubmissions(problemId);
    }
}
