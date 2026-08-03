package com.codeit.security.ratelimit;

/**
 * Builds Redis / in-memory keys so every limit is isolated.
 *
 * Format: rl:{policy}:{dimension}:{id}:{windowBucket}
 *
 * Example: rl:login:ip:203.0.113.10:1912345
 *
 * windowBucket = floor(epochSeconds / windowSeconds)
 * so all requests in the same window share one counter key.
 */
public final class RateLimitKeyBuilder {

    private RateLimitKeyBuilder() {
    }

    public static String build(
            String policy,
            String dimension,
            String id,
            long windowSeconds) {
        long bucket = System.currentTimeMillis() / 1000L / Math.max(windowSeconds, 1);
        String safeId = id == null || id.isBlank() ? "unknown" : id.trim();
        return "rl:" + policy + ":" + dimension + ":" + safeId + ":" + bucket;
    }
}
