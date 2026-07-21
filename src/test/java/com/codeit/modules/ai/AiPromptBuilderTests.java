package com.codeit.modules.ai;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.codeit.modules.problems.dto.ProblemPublicDTO;

class AiPromptBuilderTests {

    @Test
    void userPromptIncludesPublicProblemFieldsAndNotHiddenTestsKeyword() {
        AiPromptBuilder builder = new AiPromptBuilder();
        ProblemPublicDTO problem = new ProblemPublicDTO();
        problem.setId(42);
        problem.setTitle("Sample");
        problem.setDescription("Public description");
        problem.setExamples("[{\"input\":\"1\",\"output\":\"2\"}]");
        problem.setConstraintsData("[\"n <= 10\"]");
        problem.setDifficulty("Easy");
        problem.setTopics("[\"array\"]");

        AiCoachContext context = AiCoachContext.builder()
                .userId(1)
                .problem(problem)
                .action(AiAction.EXPLAIN_PROBLEM)
                .language("python")
                .code("print(1)")
                .unlockedHintLevel(0)
                .hasAccepted(false)
                .build();

        String prompt = builder.buildUserPrompt(context);
        assertTrue(prompt.contains("Sample"));
        assertTrue(prompt.contains("Public description"));
        assertTrue(prompt.contains("print(1)"));
        assertFalse(prompt.toLowerCase().contains("test_cases"));
        assertFalse(prompt.toLowerCase().contains("hiddentest"));
    }

    @Test
    void systemPromptContainsMentorRules() {
        AiPromptBuilder builder = new AiPromptBuilder();
        String system = builder.buildSystemPrompt();
        assertTrue(system.toLowerCase().contains("mentor"));
        assertTrue(system.toLowerCase().contains("hidden"));
    }
}
