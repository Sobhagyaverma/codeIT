package com.codeit.modules.ai;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.problems.dto.ProblemPublicDTO;
import com.codeit.modules.submission.SubmissionDiagnostic;

class AiGateServiceTests {

    private AiGateService gateService;
    private ProblemPublicDTO problem;

    @BeforeEach
    void setUp() {
        gateService = new AiGateService();
        problem = new ProblemPublicDTO();
        problem.setId(1);
        problem.setTitle("Two Sum");
        problem.setDescription("Find two numbers");
    }

    @Test
    void analyzeCodeRequiresNonEmptyCode() {
        AiCoachContext ctx = base(AiAction.ANALYZE_CODE).code("").build();
        assertThrows(ResponseStatusException.class, () -> gateService.enforce(ctx));
    }

    @Test
    void analyzeCodeAllowsCode() {
        AiCoachContext ctx = base(AiAction.ANALYZE_CODE).code("print(1)").build();
        assertDoesNotThrow(() -> gateService.enforce(ctx));
    }

    @Test
    void hintCannotSkipLevels() {
        AiCoachContext ctx = base(AiAction.REQUEST_HINT)
                .hintLevel(3)
                .unlockedHintLevel(0)
                .build();
        assertThrows(ResponseStatusException.class, () -> gateService.enforce(ctx));
    }

    @Test
    void hintAllowsNextLevel() {
        AiCoachContext ctx = base(AiAction.REQUEST_HINT)
                .hintLevel(1)
                .unlockedHintLevel(0)
                .code(null)
                .build();
        assertDoesNotThrow(() -> gateService.enforce(ctx));
    }

    @Test
    void editorialRequiresGate() {
        AiCoachContext locked = base(AiAction.EXPLAIN_EDITORIAL)
                .unlockedHintLevel(1)
                .hasAccepted(false)
                .build();
        assertThrows(ResponseStatusException.class, () -> gateService.enforce(locked));

        AiCoachContext unlocked = base(AiAction.EXPLAIN_EDITORIAL)
                .unlockedHintLevel(3)
                .hasAccepted(false)
                .build();
        assertDoesNotThrow(() -> gateService.enforce(unlocked));
    }

    @Test
    void failureRequiresNonAcceptedDiagnostic() {
        SubmissionDiagnostic diagnostic = new SubmissionDiagnostic();
        diagnostic.setVerdict("Wrong Answer");
        diagnostic.setPassedCount(1);
        diagnostic.setTotalCount(3);

        AiCoachContext ok = base(AiAction.ANALYZE_FAILURE)
                .code("x=1")
                .submissionId(9)
                .diagnostic(diagnostic)
                .build();
        assertDoesNotThrow(() -> gateService.enforce(ok));

        SubmissionDiagnostic accepted = new SubmissionDiagnostic();
        accepted.setVerdict("Accepted");
        AiCoachContext bad = base(AiAction.ANALYZE_FAILURE)
                .code("x=1")
                .submissionId(9)
                .diagnostic(accepted)
                .build();
        assertThrows(ResponseStatusException.class, () -> gateService.enforce(bad));
    }

    private AiCoachContext.AiCoachContextBuilder base(AiAction action) {
        return AiCoachContext.builder()
                .userId(1)
                .problem(problem)
                .action(action)
                .language("python")
                .languageId(71)
                .unlockedHintLevel(0)
                .hasAccepted(false);
    }
}
