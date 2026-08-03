package com.codeit.security.ratelimit;

/**
 * Outcome of one rate-limit check.
 *
 * @param allowed           true if the request may proceed
 * @param limit             configured max for this window
 * @param remaining         how many requests left in this window (0 when blocked)
 * @param retryAfterSeconds seconds until the window resets (0 when allowed)
 * @param key               storage key used (for logging / debugging)
 */
public record RateLimitResult(
        boolean allowed,
        int limit,
        int remaining,
        long retryAfterSeconds,
        String key) {

    public static RateLimitResult allowUnlimited() {
        return new RateLimitResult(true, Integer.MAX_VALUE, Integer.MAX_VALUE, 0, "disabled");
    }
}
