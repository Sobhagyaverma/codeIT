package com.codeit.modules.ai;

import com.codeit.modules.ai.dto.AiCoachRequest;
import com.codeit.modules.problems.dto.ProblemPublicDTO;
import com.codeit.modules.submission.SubmissionDiagnostic;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AiCoachContext {
    Integer userId;
    ProblemPublicDTO problem;
    AiAction action;
    String language;
    Integer languageId;
    String code;
    Integer hintLevel;
    String question;
    Integer submissionId;
    Integer unlockedHintLevel;
    boolean hasAccepted;
    SubmissionDiagnostic diagnostic;

    public static AiCoachContext from(
            AiCoachRequest request,
            Integer userId,
            ProblemPublicDTO problem,
            Integer unlockedHintLevel,
            boolean hasAccepted,
            SubmissionDiagnostic diagnostic) {
        return AiCoachContext.builder()
                .userId(userId)
                .problem(problem)
                .action(request.getAction())
                .language(request.getLanguage())
                .languageId(request.getLanguageId())
                .code(request.getCode())
                .hintLevel(request.getHintLevel())
                .question(request.getQuestion())
                .submissionId(request.getSubmissionId())
                .unlockedHintLevel(unlockedHintLevel)
                .hasAccepted(hasAccepted)
                .diagnostic(diagnostic)
                .build();
    }
}
