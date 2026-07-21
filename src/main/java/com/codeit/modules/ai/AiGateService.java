package com.codeit.modules.ai;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AiGateService {

    public void enforce(AiCoachContext context) {
        AiAction action = context.getAction();
        switch (action) {
            case ANALYZE_CODE -> requireCode(context);
            case ANALYZE_FAILURE -> {
                requireCode(context);
                requireFailedDiagnostic(context);
            }
            case REVIEW_ACCEPTED -> {
                if (!context.isHasAccepted()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Review Accepted requires an Accepted practice submission");
                }
                requireCode(context);
            }
            case REQUEST_HINT -> enforceHintUnlock(context);
            case EXPLAIN_EDITORIAL -> {
                boolean unlocked = context.getUnlockedHintLevel() != null && context.getUnlockedHintLevel() >= 3;
                if (!unlocked && !context.isHasAccepted()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Explain Editorial requires hint level 3 unlocked or an Accepted submission");
                }
            }
            case ASK_AI -> {
                if (context.getQuestion() == null || context.getQuestion().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "question is required for Ask AI");
                }
            }
            case EXPLAIN_PROBLEM, EXPLAIN_CONSTRAINTS -> {
                // always allowed for practice
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported action");
        }
    }

    private void requireCode(AiCoachContext context) {
        if (context.getCode() == null || context.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code is required for this action");
        }
    }

    private void requireFailedDiagnostic(AiCoachContext context) {
        if (context.getSubmissionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "submissionId is required for failure analysis");
        }
        if (context.getDiagnostic() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "submission diagnostics not found");
        }
        String verdict = context.getDiagnostic().getVerdict();
        if (verdict != null && verdict.equalsIgnoreCase("Accepted")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Submission was Accepted; use Review Accepted");
        }
    }

    private void enforceHintUnlock(AiCoachContext context) {
        int requested = context.getHintLevel() == null ? 1 : context.getHintLevel();
        if (requested < 1 || requested > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hintLevel must be 1, 2, or 3");
        }
        int unlocked = context.getUnlockedHintLevel() == null ? 0 : context.getUnlockedHintLevel();
        // Allow re-reading already unlocked levels, or unlocking next level only
        if (requested > unlocked + 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unlock hints in order. Next available level is " + (unlocked + 1));
        }
    }
}
