package com.codeit.security.ratelimit;

import org.springframework.stereotype.Component;

/**
 * Strict per-user limits for Judge0-backed endpoints (run + submit).
 * Quotas are shared across submissions and room run/submit.
 */
@Component
public class JudgeExecRateLimiter {

    public static final String POLICY_RUN = "run";
    public static final String POLICY_SUBMIT = "submit";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;

    public JudgeExecRateLimiter(
            RateLimitService rateLimitService,
            RateLimitProperties properties) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
    }

    public void checkRun(Integer userId) {
        rateLimitService.checkTieredOrThrow(POLICY_RUN, String.valueOf(userId), properties.getRun());
    }

    public void checkSubmit(Integer userId) {
        rateLimitService.checkTieredOrThrow(POLICY_SUBMIT, String.valueOf(userId), properties.getSubmit());
    }
}
