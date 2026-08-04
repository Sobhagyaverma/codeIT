package com.codeit.security.ratelimit;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Dual rate limit for forgot-password request (email + IP, 3-tier each).
 * Prefer {@link DualKeyTieredRateLimiter} directly from services for new endpoints.
 */
@Component
public class ForgotPasswordRateLimiter {

    public static final String POLICY = "forgot-password";

    private final DualKeyTieredRateLimiter dualKeyTieredRateLimiter;
    private final RateLimitProperties properties;

    public ForgotPasswordRateLimiter(
            DualKeyTieredRateLimiter dualKeyTieredRateLimiter,
            RateLimitProperties properties) {
        this.dualKeyTieredRateLimiter = dualKeyTieredRateLimiter;
        this.properties = properties;
    }

    public void checkOrThrow(String email, HttpServletRequest request) {
        checkOrThrow(email, ClientIpResolver.resolve(request));
    }

    public void checkOrThrow(String email, String ip) {
        dualKeyTieredRateLimiter.checkEmailAndIpOrThrow(
                POLICY, email, ip, properties.getForgotPassword());
    }
}
