package com.codeit.modules.ai;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.codeit.modules.ai.dto.AiCoachRequest;
import com.codeit.modules.ai.dto.AiCoachResponse;
import com.codeit.modules.ai.provider.LlmProvider;

@Service
public class AiService {

    private final boolean enabled;
    private final LlmProvider llmProvider;
    private final AiContextBuilder contextBuilder;
    private final AiPromptBuilder promptBuilder;
    private final AiGateService gateService;
    private final AiRateLimiter rateLimiter;
    private final AiSessionRepository sessionRepository;
    private final AiHintProgressRepository hintProgressRepository;
    private final AiSchemaInitializer schemaInitializer;

    public AiService(
            @Value("${codeit.ai.enabled:true}") boolean enabled,
            LlmProvider llmProvider,
            AiContextBuilder contextBuilder,
            AiPromptBuilder promptBuilder,
            AiGateService gateService,
            AiRateLimiter rateLimiter,
            AiSessionRepository sessionRepository,
            AiHintProgressRepository hintProgressRepository,
            AiSchemaInitializer schemaInitializer) {
        this.enabled = enabled;
        this.llmProvider = llmProvider;
        this.contextBuilder = contextBuilder;
        this.promptBuilder = promptBuilder;
        this.gateService = gateService;
        this.rateLimiter = rateLimiter;
        this.sessionRepository = sessionRepository;
        this.hintProgressRepository = hintProgressRepository;
        this.schemaInitializer = schemaInitializer;
    }

    public AiCoachResponse handle(Integer userId, AiCoachRequest request) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI Coach is disabled");
        }
        schemaInitializer.ensureSchema();
        rateLimiter.check(userId);

        AiCoachContext context = contextBuilder.build(userId, request);
        gateService.enforce(context);

        if (context.getAction() == AiAction.REQUEST_HINT) {
            int level = context.getHintLevel() == null ? 1 : context.getHintLevel();
            hintProgressRepository.unlockLevel(userId, context.getProblem().getId(), level);
            context = contextBuilder.build(userId, request);
        }

        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt = promptBuilder.buildUserPrompt(context);
        String content = llmProvider.complete(systemPrompt, userPrompt);

        long sessionId = sessionRepository.getOrCreateSession(userId, context.getProblem().getId());
        sessionRepository.saveMessage(sessionId, "user", context.getAction().name(), summarizeRequest(context));
        sessionRepository.saveMessage(sessionId, "assistant", context.getAction().name(), content);

        int unlocked = hintProgressRepository.getMaxUnlockedLevel(userId, context.getProblem().getId());

        AiCoachResponse response = new AiCoachResponse();
        response.setAction(context.getAction());
        response.setContent(content);
        response.setHintLevel(context.getHintLevel());
        response.setUnlockedHintLevel(unlocked);
        return response;
    }

    public List<Map<String, Object>> history(Integer userId, Integer problemId) {
        return sessionRepository.getHistory(userId, problemId);
    }

    public int hintProgress(Integer userId, Integer problemId) {
        return hintProgressRepository.getMaxUnlockedLevel(userId, problemId);
    }

    private String summarizeRequest(AiCoachContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("action=").append(context.getAction());
        if (context.getHintLevel() != null) {
            sb.append(", hintLevel=").append(context.getHintLevel());
        }
        if (context.getQuestion() != null && !context.getQuestion().isBlank()) {
            sb.append(", question=").append(context.getQuestion());
        }
        return sb.toString();
    }
}
