package com.codeit.modules.submission;

import com.codeit.modules.submission.dto.Judge0Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class Judge0Service {

    private final String judge0Url;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public Judge0Service(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${judge0.api.url:http://localhost:2358}") String judge0BaseUrl) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        String baseUrl = judge0BaseUrl.endsWith("/")
                ? judge0BaseUrl.substring(0, judge0BaseUrl.length() - 1)
                : judge0BaseUrl;
        this.judge0Url = baseUrl + "/submissions/?base64_encoded=false&wait=true";
    }

    public Judge0Result executeCode(String sourceCode, Integer languageId) {
        return executeCode(sourceCode, languageId, null);
    }

    public Judge0Result executeCode(String sourceCode, Integer languageId, String stdin) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("source_code", sourceCode);
            body.put("language_id", languageId);
            if (stdin != null) {
                body.put("stdin", stdin);
            }

            String jsonBody = objectMapper.writeValueAsString(body);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<Judge0Result> response = restTemplate.postForEntity(
                    judge0Url, entity, Judge0Result.class);
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Judge0 request failed", e);
        }
    }
}
