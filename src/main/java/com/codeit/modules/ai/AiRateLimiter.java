package com.codeit.modules.ai;

import org.springframework.stereotype.Component;

import com.codeit.security.ratelimit.RateLimitProperties;
import com.codeit.security.ratelimit.RateLimitService;

/**
 * Very strict 3-tier AI rate limit (burst + sustained + daily).
 * Replaces the old in-memory "20 per minute" counter.
 * Uses Redis when enabled; otherwise the shared in-memory fallback.
 */
@Component
public class AiRateLimiter {

    public static final String POLICY = "ai";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;

    public AiRateLimiter(RateLimitService rateLimitService, RateLimitProperties properties) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
    }

    public void check(Integer userId) {
        rateLimitService.checkTieredOrThrow(POLICY, String.valueOf(userId), properties.getAi());
    }
}
