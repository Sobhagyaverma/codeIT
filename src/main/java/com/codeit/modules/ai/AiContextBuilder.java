package com.codeit.modules.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.ai.dto.AiCoachRequest;
import com.codeit.modules.problems.Problem;
import com.codeit.modules.problems.ProblemService;
import com.codeit.modules.problems.dto.ProblemPublicDTO;
import com.codeit.modules.submission.Submission;
import com.codeit.modules.submission.SubmissionDiagnostic;
import com.codeit.modules.submission.SubmissionDiagnosticRepository;
import com.codeit.modules.submission.SubmissionRepository;

@Component
public class AiContextBuilder {

    private final ProblemService problemService;
    private final AiHintProgressRepository hintProgressRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionDiagnosticRepository diagnosticRepository;
    private final int maxCodeChars;

    public AiContextBuilder(
            ProblemService problemService,
            AiHintProgressRepository hintProgressRepository,
            SubmissionRepository submissionRepository,
            SubmissionDiagnosticRepository diagnosticRepository,
            @Value("${codeit.ai.max-code-chars:20000}") int maxCodeChars) {
        this.problemService = problemService;
        this.hintProgressRepository = hintProgressRepository;
        this.submissionRepository = submissionRepository;
        this.diagnosticRepository = diagnosticRepository;
        this.maxCodeChars = maxCodeChars;
    }

    public AiCoachContext build(Integer userId, AiCoachRequest request) {
        if (request.getProblemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "problemId is required");
        }
        if (request.getAction() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "action is required");
        }
        if (request.getCode() != null && request.getCode().length() > maxCodeChars) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code exceeds max length");
        }

        Problem problem = problemService.getProblemById(request.getProblemId());
        if (problem == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }

        SubmissionDiagnostic diagnostic = null;
        if (request.getSubmissionId() != null) {
            Submission submission = submissionRepository.getById(request.getSubmissionId());
            if (submission == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found");
            }
            if (!userId.equals(submission.getUserId()) && !com.codeit.modules.auth.SecurityUtils.isAdmin()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot use another user's submission");
            }
            if (submission.getCompetitionId() != null) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "AI Coach is unavailable for competition submissions");
            }
            if (!request.getProblemId().equals(submission.getProblemId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "submissionId does not match problemId");
            }
            diagnostic = diagnosticRepository.findBySubmissionId(submission.getId());
        }

        ProblemPublicDTO publicProblem = problemService.toPublicDTO(problem);
        int unlocked = hintProgressRepository.getMaxUnlockedLevel(userId, request.getProblemId());
        boolean hasAccepted = submissionRepository.hasAccepted(userId, request.getProblemId());

        return AiCoachContext.from(request, userId, publicProblem, unlocked, hasAccepted, diagnostic);
    }
}
