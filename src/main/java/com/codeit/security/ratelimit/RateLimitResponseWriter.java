package com.codeit.security.ratelimit;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Writes the professional 429 JSON body used by filters
 * (where GlobalExceptionHandler does not run).
 */
@Component
public class RateLimitResponseWriter {

    private final ObjectMapper objectMapper;

    public RateLimitResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(HttpServletResponse response, RateLimitExceededException ex) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));

        var body = objectMapper.createObjectNode();
        body.put("success", false);
        body.put("error", "RATE_LIMIT_EXCEEDED");
        body.put("message", ex.getMessage());
        body.put("retryAfter", ex.getRetryAfterSeconds());
        body.put("policy", ex.getPolicy());
        body.put("timestamp", Instant.now().toString());

        response.getOutputStream().write(objectMapper.writeValueAsBytes(body));
    }
}
