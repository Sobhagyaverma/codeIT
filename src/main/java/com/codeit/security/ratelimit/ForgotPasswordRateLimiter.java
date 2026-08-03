package com.codeit.security.ratelimit;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Dual rate limit for Forgot Password (OTP email) — ready for when the endpoint exists.
 *
 * Why Email + IP (both must pass):
 * - Email: one inbox cannot be flooded with OTPs from many IPs
 * - IP: one attacker cannot request OTPs for many emails
 *
 * Default: 1 request / 24h on each dimension.
 *
 * Usage when you build the OTP flow:
 * <pre>
 *   forgotPasswordRateLimiter.checkOrThrow(email, request);
 *   // then send OTP…
 * </pre>
 *
 * Email-verification OTP can reuse the same pattern with a separate policy later.
 */
@Component
public class ForgotPasswordRateLimiter {

    public static final String POLICY = "forgot-password";

    private final RateLimitService rateLimitService;
    private final RateLimitProperties properties;

    public ForgotPasswordRateLimiter(
            RateLimitService rateLimitService,
            RateLimitProperties properties) {
        this.rateLimitService = rateLimitService;
        this.properties = properties;
    }

    /**
     * Enforce both email and IP limits. Throws {@link RateLimitExceededException} if either is exceeded.
     */
    public void checkOrThrow(String email, HttpServletRequest request) {
        checkOrThrow(email, ClientIpResolver.resolve(request));
    }

    public void checkOrThrow(String email, String ip) {
        var limit = properties.getForgotPassword();
        String normalizedEmail = normalizeEmail(email);

        // Order: email first (protect inbox), then IP (protect blast)
        rateLimitService.checkOrThrow(
                POLICY,
                "email",
                normalizedEmail,
                limit.getLimit(),
                limit.getWindowSeconds());

        rateLimitService.checkOrThrow(
                POLICY,
                "ip",
                ip == null || ip.isBlank() ? "unknown" : ip.trim(),
                limit.getLimit(),
                limit.getWindowSeconds());
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return "unknown";
        }
        return email.trim().toLowerCase();
    }
}
