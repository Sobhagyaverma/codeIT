package com.codeit.modules.ai;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.codeit.modules.ai.dto.AiCoachRequest;
import com.codeit.modules.ai.dto.AiCoachResponse;
import com.codeit.modules.auth.SecurityUtils;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/coach")
    public AiCoachResponse coach(@Valid @RequestBody AiCoachRequest request) {
        Integer userId = SecurityUtils.currentUserId();
        return aiService.handle(userId, request);
    }

    @PostMapping("/explain")
    public AiCoachResponse explain(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.EXPLAIN_PROBLEM);
        return coach(request);
    }

    @PostMapping("/constraints")
    public AiCoachResponse constraints(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.EXPLAIN_CONSTRAINTS);
        return coach(request);
    }

    @PostMapping("/chat")
    public AiCoachResponse chat(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.ASK_AI);
        return coach(request);
    }

    @PostMapping("/hints")
    public AiCoachResponse hints(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.REQUEST_HINT);
        return coach(request);
    }

    @PostMapping("/analyze")
    public AiCoachResponse analyze(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.ANALYZE_CODE);
        return coach(request);
    }

    @PostMapping("/analyze-failure")
    public AiCoachResponse analyzeFailure(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.ANALYZE_FAILURE);
        return coach(request);
    }

    @PostMapping("/review")
    public AiCoachResponse review(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.REVIEW_ACCEPTED);
        return coach(request);
    }

    @PostMapping("/editorial")
    public AiCoachResponse editorial(@RequestBody AiCoachRequest request) {
        request.setAction(AiAction.EXPLAIN_EDITORIAL);
        return coach(request);
    }

    @GetMapping("/history")
    public List<Map<String, Object>> history(@RequestParam Integer problemId) {
        Integer userId = SecurityUtils.currentUserId();
        return aiService.history(userId, problemId);
    }

    @GetMapping("/hints/progress")
    public Map<String, Object> hintProgress(@RequestParam Integer problemId) {
        Integer userId = SecurityUtils.currentUserId();
        int unlocked = aiService.hintProgress(userId, problemId);
        return Map.of("problemId", problemId, "unlockedHintLevel", unlocked);
    }
}
