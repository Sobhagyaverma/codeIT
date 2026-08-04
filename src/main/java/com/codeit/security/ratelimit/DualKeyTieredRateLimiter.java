package com.codeit.security.ratelimit;

import org.springframework.stereotype.Component;

/**
 * Burst + sustained + daily on both email and IP dimensions (mail-cost / OTP endpoints).
 */
@Component
public class DualKeyTieredRateLimiter {

    private final RateLimitService rateLimitService;

    public DualKeyTieredRateLimiter(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    public void checkEmailAndIpOrThrow(
            String policy,
            String email,
            String ip,
            RateLimitProperties.TieredEndpointLimit tiers) {
        String emailNorm = email == null || email.isBlank() ? "unknown" : email.trim().toLowerCase();
        String ipNorm = ip == null || ip.isBlank() ? "unknown" : ip.trim();

        checkTier(policy, "email", emailNorm, tiers);
        checkTier(policy, "ip", ipNorm, tiers);
    }

    private void checkTier(
            String policy,
            String dimensionBase,
            String id,
            RateLimitProperties.TieredEndpointLimit tiers) {
        rateLimitService.checkOrThrow(
                policy,
                dimensionBase + "-burst",
                id,
                tiers.getBurst().getLimit(),
                tiers.getBurst().getWindowSeconds());
        rateLimitService.checkOrThrow(
                policy,
                dimensionBase + "-sustained",
                id,
                tiers.getSustained().getLimit(),
                tiers.getSustained().getWindowSeconds());
        rateLimitService.checkOrThrow(
                policy,
                dimensionBase + "-daily",
                id,
                tiers.getDaily().getLimit(),
                tiers.getDaily().getWindowSeconds());
    }
}
