package com.codeit.modules.ai.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "codeit.ai.provider", havingValue = "stub", matchIfMissing = true)
public class StubLlmProvider implements LlmProvider {

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        return "AI Coach stub response. Real Groq provider will replace this later.";
    }
}
