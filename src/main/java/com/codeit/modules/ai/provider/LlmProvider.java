package com.codeit.modules.ai.provider;

public interface LlmProvider {

    /**
     * Sends prompts to an LLM and returns the full text response.
     */
    String complete(String systemPrompt, String userPrompt);
}