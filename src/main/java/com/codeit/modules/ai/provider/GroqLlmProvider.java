package com.codeit.modules.ai.provider;

import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.codeit.modules.ai.provider.dto.ChatCompletionRequest;
import com.codeit.modules.ai.provider.dto.ChatCompletionResponse;
import com.codeit.modules.ai.provider.dto.ChatMessage;

@Component
@ConditionalOnProperty(name = "codeit.ai.provider", havingValue = "groq")
public class GroqLlmProvider implements LlmProvider {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    public GroqLlmProvider(
            @Qualifier("aiRestTemplate") RestTemplate restTemplate,
            @Value("${codeit.ai.groq.base-url}") String baseUrl,
            @Value("${codeit.ai.groq.api-key}") String apiKey,
            @Value("${codeit.ai.groq.model}") String model) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "GROQ_API_KEY is not configured");
        }

        ChatCompletionRequest body = new ChatCompletionRequest(
                model,
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userPrompt)));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<ChatCompletionRequest> entity = new HttpEntity<>(body, headers);

        try {
            ChatCompletionResponse response = restTemplate.postForObject(
                    baseUrl + "/chat/completions",
                    entity,
                    ChatCompletionResponse.class);

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                return "No response from AI provider.";
            }
            ChatMessage message = response.getChoices().get(0).getMessage();
            return message == null || message.getContent() == null
                    ? "No response from AI provider."
                    : message.getContent();
        } catch (org.springframework.web.client.RestClientResponseException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Groq API error: " + ex.getStatusCode().value() + " " + truncate(ex.getResponseBodyAsString()),
                    ex);
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Failed to reach Groq: " + ex.getMessage(),
                    ex);
        }
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 300 ? value : value.substring(0, 300) + "...";
    }
}
