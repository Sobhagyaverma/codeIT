package com.codeit.modules.ai;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.codeit.modules.problems.dto.ProblemPublicDTO;
import com.codeit.modules.submission.SubmissionDiagnostic;

@Component
public class AiPromptBuilder {

    private final Map<AiAction, String> actionTemplates = new EnumMap<>(AiAction.class);
    private final String systemMentorTemplate;

    public AiPromptBuilder() {
        this.systemMentorTemplate = readClasspath("ai/prompts/system-mentor.md");
        actionTemplates.put(AiAction.EXPLAIN_PROBLEM, readClasspath("ai/prompts/explain-problem.md"));
        actionTemplates.put(AiAction.EXPLAIN_CONSTRAINTS, readClasspath("ai/prompts/explain-constraints.md"));
        actionTemplates.put(AiAction.ASK_AI, readClasspath("ai/prompts/ask-ai.md"));
        actionTemplates.put(AiAction.ANALYZE_CODE, readClasspath("ai/prompts/analyze-code.md"));
        actionTemplates.put(AiAction.ANALYZE_FAILURE, readClasspath("ai/prompts/analyze-failure.md"));
        actionTemplates.put(AiAction.REVIEW_ACCEPTED, readClasspath("ai/prompts/review-accepted.md"));
        actionTemplates.put(AiAction.EXPLAIN_EDITORIAL, readClasspath("ai/prompts/explain-editorial.md"));
    }

    public String buildSystemPrompt() {
        return systemMentorTemplate;
    }

    public String buildUserPrompt(AiCoachContext context) {
        String actionTemplate = resolveActionTemplate(context);
        ProblemPublicDTO p = context.getProblem();

        StringBuilder sb = new StringBuilder();
        sb.append(actionTemplate).append("\n\n");
        sb.append("## Problem\n");
        sb.append("ID: ").append(p.getId()).append('\n');
        sb.append("Title: ").append(nullToEmpty(p.getTitle())).append('\n');
        sb.append("Difficulty: ").append(nullToEmpty(p.getDifficulty())).append('\n');
        sb.append("Topics: ").append(nullToEmpty(p.getTopics())).append('\n');
        sb.append("Description:\n").append(nullToEmpty(p.getDescription())).append("\n\n");
        sb.append("Examples:\n").append(nullToEmpty(p.getExamples())).append("\n\n");
        sb.append("Constraints:\n").append(nullToEmpty(p.getConstraintsData())).append("\n\n");
        sb.append("## Student attempt\n");
        sb.append("Language: ").append(nullToEmpty(context.getLanguage())).append('\n');
        sb.append("Unlocked hint level: ").append(context.getUnlockedHintLevel()).append('\n');
        if (context.getHintLevel() != null) {
            sb.append("Hint level requested: ").append(context.getHintLevel()).append('\n');
        }
        if (context.getQuestion() != null && !context.getQuestion().isBlank()) {
            sb.append("Student question: ").append(context.getQuestion()).append('\n');
        }
        sb.append("Code:\n").append(nullToEmpty(context.getCode())).append('\n');

        SubmissionDiagnostic d = context.getDiagnostic();
        if (d != null) {
            sb.append("\n## Sanitized submission diagnostics\n");
            sb.append("Verdict: ").append(nullToEmpty(d.getVerdict())).append('\n');
            sb.append("Passed: ").append(d.getPassedCount()).append('/').append(d.getTotalCount()).append('\n');
            if (d.getFailedIndex() != null) {
                sb.append("Failed test index: ").append(d.getFailedIndex()).append('\n');
            }
            if (d.getCompileOutput() != null && !d.getCompileOutput().isBlank()) {
                sb.append("Compile output (sanitized):\n").append(truncate(d.getCompileOutput(), 2000)).append('\n');
            }
            if (d.getStderrSummary() != null && !d.getStderrSummary().isBlank()) {
                sb.append("Stderr summary (sanitized):\n").append(truncate(d.getStderrSummary(), 2000)).append('\n');
            }
            sb.append("Never invent or reveal hidden test inputs/outputs.\n");
        }
        return sb.toString();
    }

    private String resolveActionTemplate(AiCoachContext context) {
        if (context.getAction() == AiAction.REQUEST_HINT) {
            int level = context.getHintLevel() == null ? 1 : context.getHintLevel();
            return switch (level) {
                case 2 -> readClasspath("ai/prompts/hint-level-2.md");
                case 3 -> readClasspath("ai/prompts/hint-level-3.md");
                default -> readClasspath("ai/prompts/hint-level-1.md");
            };
        }
        String template = actionTemplates.get(context.getAction());
        if (template == null) {
            throw new IllegalArgumentException("No prompt template for action: " + context.getAction());
        }
        return template;
    }

    private static String readClasspath(String path) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Missing prompt template: " + path, e);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max) + "\n...[truncated]";
    }
}
